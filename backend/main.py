from fastapi import FastAPI, HTTPException, Depends, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date
import os
import traceback
import requests
import time
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from supabase import create_client, Client
from jose import JWTError, jwt
from groq import Groq
from aqi_scheduler import get_scheduler
from chat_cache import get_chat_cache


load_dotenv()

# Lifespan context for scheduler
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start the AQI scheduler
    try:
        scheduler = get_scheduler()
        scheduler.start()
        print("✓ AQI Scheduler started")
    except Exception as e:
        print(f"⚠ Warning: Could not start AQI Scheduler: {e}")
    
    yield
    
    # Shutdown: Stop the scheduler
    try:
        scheduler = get_scheduler()
        scheduler.shutdown()
        print("✓ AQI Scheduler stopped")
    except Exception as e:
        print(f"⚠ Warning: Error stopping AQI Scheduler: {e}")

app = FastAPI(title="JanDrishti API", version="1.0.0", lifespan=lifespan)

# CORS Configuration
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase Client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase_service_key = os.getenv("SUPABASE_SERVICE_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables")

supabase: Client = create_client(supabase_url, supabase_key)
supabase_admin: Client = create_client(supabase_url, supabase_service_key) if supabase_service_key else supabase

# Groq Client
groq_api_key = os.getenv("GROQ_API")
if not groq_api_key:
    raise ValueError("GROQ_API must be set in environment variables")

groq_client = Groq(api_key=groq_api_key)

# Security
security = HTTPBearer()

# Pydantic Models
class UserSignup(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict
    message: Optional[str] = None

class ReportCreate(BaseModel):
    title: str
    description: str
    location: str
    category: str
    priority: Optional[str] = "medium"
    ward: Optional[str] = None
    images: Optional[List[str]] = []

class ReportResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: str
    location: str
    category: str
    status: str
    priority: str
    ward: Optional[str]
    images: List[str]
    upvotes: int
    created_at: str
    updated_at: str

class ChatMessageCreate(BaseModel):
    message: str

class ChatMessageResponse(BaseModel):
    id: str
    user_id: str
    user_message: str
    bot_response: Optional[str]
    created_at: str

# AQI Models
class StationData(BaseModel):
    name: str
    lon: float
    lat: float
    aqi: float
    pm25: Optional[float] = None
    pm10: Optional[float] = None
    no2: Optional[float] = None
    o3: Optional[float] = None
    updated: Optional[str] = None

class AQIStationsResponse(BaseModel):
    stations: List[StationData]
    total_stations: int
    average_aqi: Optional[float] = None

class AQIFeedResponse(BaseModel):
    name: str
    lon: float
    lat: float
    aqi: float
    pm25: Optional[float] = None
    pm10: Optional[float] = None
    no2: Optional[float] = None
    o3: Optional[float] = None
    so2: Optional[float] = None
    co: Optional[float] = None
    updated: Optional[str] = None
    station: Optional[dict] = None



# Authentication Helper Functions
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify JWT token and return user"""
    token = credentials.credentials
    
    try:
        # Verify token with Supabase
        user = supabase.auth.get_user(token)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user.user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# AI Helper Functions
async def generate_ai_response(user_message: str, user_id: str = None, user_context: dict = None) -> str:
    """Generate AI response using Groq API with conversation context from Redis"""
    try:
        chat_cache = get_chat_cache()
        
        # Get conversation context from Redis (last 5 messages for context)
        conversation_context = []
        if user_id:
            conversation_context = chat_cache.get_conversation_context(user_id, max_messages=5)
        
        # Create a context-aware system prompt for pollution monitoring
        system_prompt = """You are an AI assistant for JanDrishti, a pollution monitoring and environmental intelligence platform. 
        You help users understand air quality data, provide health recommendations, explain government policies, and offer guidance on pollution-related issues.
        
        Key areas you can help with:
        - Air Quality Index (AQI) interpretation and current levels
        - Health recommendations based on pollution levels
        - Government regulations and policies
        - Best times for outdoor activities
        - Pollution sources and mitigation strategies
        - Emergency contacts and helplines
        - Environmental health tips
        
        Always provide accurate, helpful, and actionable information. If you don't have specific real-time data, acknowledge this and provide general guidance.
        Keep responses concise but informative, and always prioritize user health and safety."""
        
        # Add user context if available
        context_info = ""
        if user_context:
            context_info = f"\nUser context: {user_context.get('location', 'Unknown location')}"
        
        # Build messages array with conversation history
        messages = [{"role": "system", "content": system_prompt + context_info}]
        
        # Add conversation context from Redis
        for msg in conversation_context:
            if msg.get("user_message"):
                messages.append({"role": "user", "content": msg["user_message"]})
            if msg.get("bot_response"):
                messages.append({"role": "assistant", "content": msg["bot_response"]})
        
        # Add current user message
        messages.append({"role": "user", "content": user_message})
        
        # Create the chat completion
        chat_completion = groq_client.chat.completions.create(
            messages=messages,
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=500,
            top_p=1,
            stream=False
        )
        
        return chat_completion.choices[0].message.content
        
    except Exception as e:
        print(f"Error generating AI response: {e}")
        # Fallback response
        return f"I understand you're asking about: {user_message}. I'm having trouble connecting to my AI service right now, but I'm here to help with pollution monitoring, air quality questions, and health recommendations. Please try again in a moment, or contact our support team for immediate assistance."

# Authentication Endpoints
@app.post("/api/auth/signup", response_model=TokenResponse)
async def signup(user_data: UserSignup):
    """Register a new user"""
    try:
        # Create user in Supabase Auth
        response = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
            "options": {
                "data": {
                    "full_name": user_data.full_name or ""
                }
            }
        })
        
        if not response.user:
            raise HTTPException(status_code=400, detail="Failed to create user")
        
        # Check if email confirmation is required
        email_confirmation_required = not response.session
        
        return TokenResponse(
            access_token=response.session.access_token if response.session else "",
            user={
                "id": response.user.id,
                "email": response.user.email,
                "full_name": user_data.full_name
            },
            message="Email confirmation required. Please check your email and confirm your account before logging in." if email_confirmation_required else None
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Login user and return JWT token"""
    try:
        # Attempt to sign in with Supabase
        response = supabase.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password
        })
        
        # Check if we got a valid response
        if not response:
            print("DEBUG: No response from Supabase")
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        if not hasattr(response, 'user') or not response.user:
            print("DEBUG: No user in response")
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        if not hasattr(response, 'session') or not response.session:
            print("DEBUG: No session in response - user may need to confirm email")
            raise HTTPException(
                status_code=401, 
                detail="Email not confirmed. Please check your email and confirm your account."
            )
        
        # Get user profile
        try:
            profile = supabase.table("profiles").select("*").eq("id", response.user.id).single().execute()
            full_name = profile.data.get("full_name") if profile.data else None
        except Exception as profile_error:
            # Profile might not exist yet, that's okay
            print(f"DEBUG: Profile fetch error (non-critical): {profile_error}")
            full_name = None
        
        return TokenResponse(
            access_token=response.session.access_token,
            user={
                "id": response.user.id,
                "email": response.user.email,
                "full_name": full_name
            }
        )
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Log the full error for debugging
        error_type = type(e).__name__
        error_message = str(e)
        error_traceback = traceback.format_exc()
        
        print(f"DEBUG: Login error type: {error_type}")
        print(f"DEBUG: Login error message: {error_message}")
        print(f"DEBUG: Full traceback:\n{error_traceback}")
        
        # Check for specific Supabase error patterns
        error_str_lower = error_message.lower()
        
        if "invalid login credentials" in error_str_lower:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        elif "email not confirmed" in error_str_lower or "email_not_confirmed" in error_str_lower:
            raise HTTPException(
                status_code=401, 
                detail="Email not confirmed. Please check your email and confirm your account."
            )
        elif "user not found" in error_str_lower:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        elif "too many requests" in error_str_lower:
            raise HTTPException(status_code=429, detail="Too many login attempts. Please try again later.")
        else:
            # Return the actual error for debugging (in production, you might want to hide this)
            raise HTTPException(
                status_code=401, 
                detail=f"Login failed: {error_message}"
            )

@app.get("/api/auth/me")
async def get_current_user_info(current_user = Depends(get_current_user)):
    """Get current authenticated user information"""
    try:
        profile = supabase.table("profiles").select("*").eq("id", current_user.id).single().execute()
        return {
            "id": current_user.id,
            "email": current_user.email,
            "full_name": profile.data.get("full_name") if profile.data else None
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail="User profile not found")

# Reports Endpoints
@app.get("/api/reports", response_model=List[ReportResponse])
async def get_reports(
    category: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    """Get all reports (public endpoint)"""
    try:
        query = supabase.table("reports").select("*")
        
        if category:
            query = query.eq("category", category)
        if status:
            query = query.eq("status", status)
        
        query = query.order("created_at", desc=True).limit(limit).offset(offset)
        response = query.execute()
        
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/reports", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def create_report(report: ReportCreate, current_user = Depends(get_current_user)):
    """Create a new report (requires authentication)"""
    try:
        report_data = {
            "user_id": current_user.id,
            "title": report.title,
            "description": report.description,
            "location": report.location,
            "category": report.category,
            "priority": report.priority,
            "ward": report.ward,
            "images": report.images or [],
            "status": "open"
        }
        
        response = supabase.table("reports").insert(report_data).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create report")
        
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/reports/{report_id}", response_model=ReportResponse)
async def get_report(report_id: str):
    """Get a specific report by ID"""
    try:
        response = supabase.table("reports").select("*").eq("id", report_id).single().execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=404, detail="Report not found")

@app.put("/api/reports/{report_id}", response_model=ReportResponse)
async def update_report(
    report_id: str,
    report: ReportCreate,
    current_user = Depends(get_current_user)
):
    """Update a report (only owner can update)"""
    try:
        # Check if user owns the report
        existing = supabase.table("reports").select("user_id").eq("id", report_id).single().execute()
        
        if not existing.data or existing.data["user_id"] != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to update this report")
        
        report_data = {
            "title": report.title,
            "description": report.description,
            "location": report.location,
            "category": report.category,
            "priority": report.priority,
            "ward": report.ward,
            "images": report.images or []
        }
        
        response = supabase.table("reports").update(report_data).eq("id", report_id).execute()
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/reports/{report_id}/upvote")
async def upvote_report(report_id: str, current_user = Depends(get_current_user)):
    """Upvote a report (requires authentication)"""
    try:
        # Get current upvotes
        report = supabase.table("reports").select("upvotes").eq("id", report_id).single().execute()
        current_upvotes = report.data.get("upvotes", 0) if report.data else 0
        
        # Increment upvotes
        response = supabase.table("reports").update({"upvotes": current_upvotes + 1}).eq("id", report_id).execute()
        return {"upvotes": response.data[0]["upvotes"]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Chat Endpoints
@app.get("/api/chat/messages", response_model=List[ChatMessageResponse])
async def get_chat_messages(
    limit: int = 50,
    offset: int = 0,
    current_user = Depends(get_current_user)
):
    """
    Get chat message history (requires authentication)
    Uses Redis cache for fast retrieval, falls back to Supabase if cache miss
    """
    try:
        chat_cache = get_chat_cache()
        
        # Try to get from Redis cache first
        cached_messages = chat_cache.get_cached_messages(current_user.id, limit=limit + offset)
        
        if cached_messages and len(cached_messages) >= limit:
            # Return cached messages (already sorted by newest first)
            return cached_messages[:limit]
        
        # Cache miss or insufficient data - fetch from Supabase
        response = supabase.table("chat_messages")\
            .select("*")\
            .eq("user_id", current_user.id)\
            .order("created_at", desc=True)\
            .limit(limit + offset)\
            .execute()
        
        messages = response.data
        
        # Cache the messages in Redis for future requests
        if messages:
            chat_cache.cache_messages_batch(current_user.id, messages)
        
        # Update user session
        chat_cache.update_session(current_user.id)
        
        # Return requested slice
        return messages[offset:offset + limit] if offset > 0 else messages[:limit]
        
    except Exception as e:
        print(f"Error getting chat messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat/messages", response_model=ChatMessageResponse, status_code=status.HTTP_201_CREATED)
async def create_chat_message(
    message: ChatMessageCreate,
    current_user = Depends(get_current_user)
):
    """
    Send a chat message (requires authentication)
    Uses Redis for rate limiting, caching, and conversation context
    """
    try:
        chat_cache = get_chat_cache()
        
        # Check rate limit
        is_allowed, remaining = chat_cache.check_rate_limit(current_user.id)
        if not is_allowed:
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. Please wait before sending another message. You can send {remaining} more messages."
            )
        
        # Update user session
        chat_cache.update_session(current_user.id)
        
        # Generate AI response with conversation context
        ai_response = await generate_ai_response(
            user_message=message.message,
            user_id=current_user.id,
            user_context={"location": "Unknown location"}
        )
        
        # Prepare message data
        message_data = {
            "user_id": current_user.id,
            "user_message": message.message,
            "bot_response": ai_response,
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Save to Supabase (primary storage)
        response = supabase.table("chat_messages").insert(message_data).execute()
        saved_message = response.data[0]
        
        # Cache in Redis immediately for fast retrieval
        chat_cache.cache_message(current_user.id, saved_message)
        
        # Return the saved data
        return saved_message
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in create_chat_message: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/chat/rate-limit")
async def get_rate_limit_status(current_user = Depends(get_current_user)):
    """Get current rate limit status for the user"""
    try:
        chat_cache = get_chat_cache()
        is_allowed, remaining = chat_cache.check_rate_limit(current_user.id)
        
        return {
            "allowed": is_allowed,
            "remaining": remaining,
            "limit": 10,
            "window_seconds": 60
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/chat/cache")
async def clear_chat_cache(current_user = Depends(get_current_user)):
    """Clear user's chat cache (admin or own cache only)"""
    try:
        chat_cache = get_chat_cache()
        chat_cache.invalidate_user_cache(current_user.id)
        return {"message": "Chat cache cleared successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# AQI Endpoints
WAQI_TOKEN = "62fbeb618094ae4ec793918f91392c3716055dab"

@app.get("/api/aqi/stations", response_model=AQIStationsResponse)
async def get_aqi_stations_by_bounds(
    min_lat: float = Query(..., description="Minimum latitude"),
    min_lon: float = Query(..., description="Minimum longitude"),
    max_lat: float = Query(..., description="Maximum latitude"),
    max_lon: float = Query(..., description="Maximum longitude"),
    include_details: bool = Query(False, description="Include detailed pollutant data for each station")
):
    """
    Fetch AQI stations within geographic bounds.
    Uses the same WAQI API logic as map.py
    """
    try:
        # Format bounds as required by WAQI API: lat1,lon1,lat2,lon2
        latlng_bounds = f"{min_lat},{min_lon},{max_lat},{max_lon}"
        url = f"https://api.waqi.info/map/bounds/?latlng={latlng_bounds}&token={WAQI_TOKEN}"
        
        response = requests.get(url, timeout=30)
        data = response.json()
        
        if data.get("status") != "ok":
            raise HTTPException(
                status_code=400,
                detail=f"WAQI API Error: {data.get('data', 'Unknown error')}"
            )
        
        stations_raw = data.get("data", [])
        station_data = []
        
        if include_details:
            # Fetch detailed data for each station (same logic as map.py)
            for i, station in enumerate(stations_raw):
                try:
                    lat = station.get("lat")
                    lon = station.get("lon")
                    aqi = station.get("aqi")
                    
                    if aqi is None or aqi == "-":
                        continue
                    
                    aqi = float(aqi)
                    name = station.get("station", {}).get("name", "Unknown")
                    
                    # Get detailed feed data
                    detail_url = f"https://api.waqi.info/feed/geo:{lat};{lon}/?token={WAQI_TOKEN}"
                    detail_response = requests.get(detail_url, timeout=10)
                    detail_data = detail_response.json()
                    
                    if detail_data.get("status") == "ok":
                        station_full = detail_data.get("data", {})
                        iaqi = station_full.get("iaqi", {})
                        time_data = station_full.get("time", {})
                        
                        station_data.append({
                            "name": name,
                            "lon": lon,
                            "lat": lat,
                            "aqi": aqi,
                            "pm25": iaqi.get("pm25", {}).get("v"),
                            "pm10": iaqi.get("pm10", {}).get("v"),
                            "no2": iaqi.get("no2", {}).get("v"),
                            "o3": iaqi.get("o3", {}).get("v"),
                            "updated": time_data.get("s", "Unknown")
                        })
                    
                    # Rate limiting - small delay between requests
                    time.sleep(0.1)
                    
                except Exception as e:
                    # Continue processing other stations if one fails
                    continue
        else:
            # Return basic station data without detailed fetch
            for station in stations_raw:
                try:
                    lat = station.get("lat")
                    lon = station.get("lon")
                    aqi = station.get("aqi")
                    
                    if aqi is None or aqi == "-":
                        continue
                    
                    aqi = float(aqi)
                    name = station.get("station", {}).get("name", "Unknown")
                    
                    station_data.append({
                        "name": name,
                        "lon": lon,
                        "lat": lat,
                        "aqi": aqi,
                        "pm25": None,
                        "pm10": None,
                        "no2": None,
                        "o3": None,
                        "updated": None
                    })
                except Exception as e:
                    continue
        
        # Calculate average AQI
        aqi_values = [s["aqi"] for s in station_data if s["aqi"] is not None]
        average_aqi = sum(aqi_values) / len(aqi_values) if aqi_values else None
        
        return AQIStationsResponse(
            stations=[StationData(**s) for s in station_data],
            total_stations=len(station_data),
            average_aqi=average_aqi
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching AQI stations: {str(e)}"
        )

@app.get("/api/aqi/feed/{lat}/{lon}", response_model=AQIFeedResponse)
async def get_aqi_feed_by_coordinates(
    lat: float,
    lon: float
):
    """
    Get detailed AQI feed for a specific geographic location.
    Uses the same WAQI API logic as map.py
    """
    try:
        # Get detailed feed data (same as map.py detail_url)
        detail_url = f"https://api.waqi.info/feed/geo:{lat};{lon}/?token={WAQI_TOKEN}"
        detail_response = requests.get(detail_url, timeout=10)
        detail_data = detail_response.json()
        
        if detail_data.get("status") != "ok":
            raise HTTPException(
                status_code=400,
                detail=f"WAQI API Error: {detail_data.get('data', 'Unknown error')}"
            )
        
        station_full = detail_data.get("data", {})
        iaqi = station_full.get("iaqi", {})
        time_data = station_full.get("time", {})
        station_info = station_full.get("station", {})
        
        # Get AQI value
        aqi = station_full.get("aqi")
        if aqi is None:
            # Try to get from iaqi if main aqi is not available
            aqi = station_full.get("iaqi", {}).get("aqi", {}).get("v")
        
        if aqi is None:
            raise HTTPException(
                status_code=404,
                detail="AQI data not available for this location"
            )
        
        return AQIFeedResponse(
            name=station_info.get("name", "Unknown Station"),
            lon=lon,
            lat=lat,
            aqi=float(aqi),
            pm25=iaqi.get("pm25", {}).get("v"),
            pm10=iaqi.get("pm10", {}).get("v"),
            no2=iaqi.get("no2", {}).get("v"),
            o3=iaqi.get("o3", {}).get("v"),
            so2=iaqi.get("so2", {}).get("v"),
            co=iaqi.get("co", {}).get("v"),
            updated=time_data.get("s", "Unknown"),
            station=station_info
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching AQI feed: {str(e)}"
        )

@app.get("/api/aqi/bounds")
async def get_aqi_bounds(
    min_lat: float = Query(..., description="Minimum latitude"),
    min_lon: float = Query(..., description="Minimum longitude"),
    max_lat: float = Query(..., description="Maximum latitude"),
    max_lon: float = Query(..., description="Maximum longitude")
):
    """
    Get raw AQI station data within geographic bounds.
    Returns the raw response from WAQI API without detailed processing.
    """
    try:
        latlng_bounds = f"{min_lat},{min_lon},{max_lat},{max_lon}"
        url = f"https://api.waqi.info/map/bounds/?latlng={latlng_bounds}&token={WAQI_TOKEN}"
        
        response = requests.get(url, timeout=30)
        data = response.json()
        
        if data.get("status") != "ok":
            raise HTTPException(
                status_code=400,
                detail=f"WAQI API Error: {data.get('data', 'Unknown error')}"
            )
        
        return {
            "status": "ok",
            "data": data.get("data", []),
            "total_stations": len(data.get("data", []))
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching AQI bounds: {str(e)}"
        )

# AQI Data Management Endpoints
@app.get("/api/aqi/wards")
async def get_selected_wards():
    """Get the 4 selected wards for AQI monitoring"""
    try:
        response = supabase.table("selected_wards").select("*").eq("is_active", True).execute()
        return response.data
    except Exception as e:
        # Fallback to JSON file
        import json
        json_path = os.path.join(os.path.dirname(__file__), "selected_wards.json")
        if os.path.exists(json_path):
            with open(json_path, 'r') as f:
                return json.load(f)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/aqi/daily")
async def get_daily_aqi_data(
    ward_no: Optional[str] = Query(None, description="Filter by ward number"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    limit: int = Query(100, description="Maximum number of records")
):
    """Get daily average AQI data from Supabase"""
    try:
        query = supabase.table("ward_aqi_daily").select("*")
        
        if ward_no:
            query = query.eq("ward_no", ward_no)
        
        if start_date:
            query = query.gte("date", start_date)
        
        if end_date:
            query = query.lte("date", end_date)
        
        query = query.order("date", desc=True).limit(limit)
        response = query.execute()
        
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/aqi/daily/{ward_no}")
async def get_ward_daily_aqi(
    ward_no: str,
    days: int = Query(30, description="Number of days to retrieve")
):
    """Get daily AQI data for a specific ward"""
    try:
        from datetime import timedelta
        start_date = (date.today() - timedelta(days=days)).isoformat()
        
        response = supabase.table("ward_aqi_daily")\
            .select("*")\
            .eq("ward_no", ward_no)\
            .gte("date", start_date)\
            .order("date", desc=True)\
            .execute()
        
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/aqi/scheduler/status")
async def get_scheduler_status():
    """Get status of the AQI data collection scheduler"""
    try:
        scheduler = get_scheduler()
        jobs = scheduler.get_jobs()
        
        return {
            "is_running": scheduler.is_running,
            "jobs": [
                {
                    "id": job.id,
                    "name": job.name,
                    "next_run": job.next_run_time.isoformat() if job.next_run_time else None
                }
                for job in jobs
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/aqi/scheduler/trigger/hourly")
async def trigger_hourly_collection():
    """Manually trigger hourly AQI data collection"""
    try:
        scheduler = get_scheduler()
        scheduler.trigger_hourly_fetch()
        return {"message": "Hourly data collection triggered successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/aqi/scheduler/trigger/daily")
async def trigger_daily_calculation():
    """Manually trigger daily average calculation"""
    try:
        scheduler = get_scheduler()
        scheduler.trigger_daily_calculation()
        return {"message": "Daily average calculation triggered successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Health Check Endpoints
@app.get("/")
async def root():
    return {"message": "JanDrishti API", "version": "1.0.0"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)