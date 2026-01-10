from fastapi import FastAPI, HTTPException, Depends, status, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date, timedelta
import os
import traceback
import requests
import time
import json
import re
import logging
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from supabase import create_client, Client
from jose import JWTError, jwt
from groq import Groq
from aqi_scheduler import get_scheduler
from chat_cache import get_chat_cache
from aqi_collector import AQICollector
from aqi_collector_singleton import get_collector
from middleware.error_handler import AppException
import geopandas as gpd
import pandas as pd
from shapely.geometry import Point
import json
import requests


load_dotenv()

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

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
    phone_number: Optional[str] = None

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
async def fetch_aqi_data_for_ward(ward_name: str = None, ward_no: str = None) -> dict:
    """Fetch current AQI data for a specific ward from Redis or API"""
    try:
        # Use singleton instance to avoid creating new connections
        collector = get_collector()
        
        # If ward_name provided, find ward_no
        if ward_name and not ward_no:
            wards = collector.selected_wards
            ward = next((w for w in wards if ward_name.upper() in w.get("ward_name", "").upper()), None)
            if ward:
                ward_no = ward.get("ward_no")
        
        if not ward_no:
            return None
        
        # Try to get latest hourly data from Redis
        today = date.today()
        hourly_data = collector.get_hourly_data_from_redis(ward_no, today)
        
        if hourly_data and len(hourly_data) > 0:
            latest = hourly_data[-1]
            return {
                "ward_no": ward_no,
                "ward_name": next((w.get("ward_name") for w in collector.selected_wards if w.get("ward_no") == ward_no), "Unknown"),
                "aqi": latest.get("aqi"),
                "pm25": latest.get("pm25"),
                "pm10": latest.get("pm10"),
                "no2": latest.get("no2"),
                "o3": latest.get("o3"),
                "timestamp": latest.get("fetched_at", latest.get("timestamp")),
                "source": "Redis (hourly data)"
            }
        
        # Fallback to feed API
        ward = next((w for w in collector.selected_wards if w.get("ward_no") == ward_no), None)
        if ward:
            aqi_data = collector.fetch_aqi_for_ward(ward.get("latitude"), ward.get("longitude"))
            if aqi_data:
                return {
                    "ward_no": ward_no,
                    "ward_name": ward.get("ward_name"),
                    "aqi": aqi_data.get("aqi"),
                    "pm25": aqi_data.get("pm25"),
                    "pm10": aqi_data.get("pm10"),
                    "no2": aqi_data.get("no2"),
                    "o3": aqi_data.get("o3"),
                    "timestamp": aqi_data.get("fetched_at"),
                    "source": "WAQI API (real-time)"
                }
        
        return None
    except Exception as e:
        print(f"Error fetching AQI data: {e}")
        return None

async def detect_ward_from_message(message: str) -> tuple:
    """Detect ward name or number from user message"""
    message_lower = message.lower()
    
    # Ward names mapping
    ward_names = {
        "model town": "72",
        "begumpur": "27",
        "hauz rani": "162",
        "nangli sakravati": "134",
        "nangli": "134",
        "sakravati": "134"
    }
    
    # Check for ward names
    for ward_name, ward_no in ward_names.items():
        if ward_name in message_lower:
            return ward_name.title(), ward_no
    
    # Check for ward numbers
    import re
    ward_no_match = re.search(r'ward\s*[:\-]?\s*(\d+)', message_lower)
    if ward_no_match:
        ward_no = ward_no_match.group(1)
        try:
            # Use singleton instance
            collector = get_collector()
            ward_name = next((w.get("ward_name") for w in collector.selected_wards if w.get("ward_no") == ward_no), None)
            return ward_name or f"Ward {ward_no}", ward_no
        except:
            return f"Ward {ward_no}", ward_no
    
    return None, None

async def generate_ai_response(user_message: str, user_id: str = None, user_context: dict = None) -> str:
    """Generate AI response using Groq API with conversation context from Redis and real-time AQI data"""
    try:
        chat_cache = get_chat_cache()
        
        # Get conversation context from Redis (last 5 messages for context)
        conversation_context = []
        if user_id:
            conversation_context = chat_cache.get_conversation_context(user_id, max_messages=5)
        
        # Detect if user is asking about AQI/ward and fetch real data
        aqi_context = ""
        message_lower = user_message.lower()
        is_aqi_question = any(keyword in message_lower for keyword in [
            "aqi", "air quality", "pollution", "pm25", "pm10", "no2", "o3", 
            "ward", "model town", "begumpur", "hauz rani", "nangli sakravati"
        ])
        
        if is_aqi_question:
            ward_name, ward_no = await detect_ward_from_message(user_message)
            
            if ward_no:
                aqi_data = await fetch_aqi_data_for_ward(ward_name, ward_no)
                if aqi_data:
                    aqi_context = f"""
REAL-TIME AQI DATA FOR {aqi_data.get('ward_name', 'WARD')} (Ward {aqi_data.get('ward_no')}):
- Current AQI: {aqi_data.get('aqi', 'N/A')}
- PM2.5: {aqi_data.get('pm25', 'N/A')} µg/m³
- PM10: {aqi_data.get('pm10', 'N/A')} µg/m³
- NO2: {aqi_data.get('no2', 'N/A')} µg/m³
- O3: {aqi_data.get('o3', 'N/A')} µg/m³
- Last Updated: {aqi_data.get('timestamp', 'Unknown')}
- Data Source: {aqi_data.get('source', 'Unknown')}

Use this REAL data to answer the user's question. Do NOT say you don't have access to real-time data.
"""
            else:
                # Fetch data for all wards if no specific ward mentioned
                try:
                    # Use singleton instance
                    collector = get_collector()
                    all_wards_data = []
                    for ward in collector.selected_wards[:4]:  # Limit to 4 wards
                        ward_data = await fetch_aqi_data_for_ward(None, ward.get("ward_no"))
                        if ward_data:
                            all_wards_data.append(ward_data)
                    
                    if all_wards_data:
                        aqi_context = "\nREAL-TIME AQI DATA FOR ALL MONITORED WARDS:\n"
                        for ward_data in all_wards_data:
                            aqi_context += f"""
- {ward_data.get('ward_name')} (Ward {ward_data.get('ward_no')}): AQI {ward_data.get('aqi', 'N/A')} | PM2.5: {ward_data.get('pm25', 'N/A')} | PM10: {ward_data.get('pm10', 'N/A')} | NO2: {ward_data.get('no2', 'N/A')} | O3: {ward_data.get('o3', 'N/A')} µg/m³
"""
                        aqi_context += "\nUse this REAL data to answer the user's question. Do NOT say you don't have access to real-time data.\n"
                except Exception as e:
                    print(f"Error fetching all wards data: {e}")
        
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
        
        IMPORTANT: When you have real-time AQI data provided in the context, USE IT to answer questions accurately. 
        Do NOT say you don't have access to real-time data if it's provided below.
        Always provide accurate, helpful, and actionable information based on the data available.
        Keep responses concise but informative, and always prioritize user health and safety."""
        
        # Add user context if available
        context_info = ""
        if user_context:
            context_info = f"\nUser context: {user_context.get('location', 'Unknown location')}"
        
        # Build messages array with conversation history
        messages = [{"role": "system", "content": system_prompt + context_info + aqi_context}]
        
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

def get_aqi_category(aqi: int) -> str:
    """Get AQI category and color"""
    if aqi <= 50:
        return {"category": "Good", "color": "#00e400"}
    elif aqi <= 100:
        return {"category": "Satisfactory", "color": "#ffff00"}
    elif aqi <= 200:
        return {"category": "Moderate", "color": "#ff7e00"}
    elif aqi <= 300:
        return {"category": "Poor", "color": "#ff0000"}
    elif aqi <= 400:
        return {"category": "Very Poor", "color": "#8f3f97"}
    else:
        return {"category": "Severe", "color": "#7e0023"}
    
# ------------------------------------------------------
# HEAVY PROCESSING (RUNS IN BACKGROUND ONLY)
# ------------------------------------------------------
def heavy_aqi_processing():
    """
    Fetch WAQI stations, compute ward averages, and produce final GeoJSON.
    This function is CPU heavy & slow. It runs only ONCE per cron trigger.
    """
    print("\n==== Starting AQI recompute ====")

    # -----------------------------------------------
    # Load ward polygons
    # -----------------------------------------------
    wards_path = os.path.join(os.path.dirname(__file__), "Delhi_Wards.geojson")
    if not os.path.exists(wards_path):
        wards_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "Delhi_Wards.geojson"))

    if not os.path.exists(wards_path):
        raise Exception("Delhi_Wards.geojson not found")

    wards = gpd.read_file(wards_path)

    # detect ward column
    ward_cols = ["Ward_Name", "Ward_No", "Ward", "name", "NAME"]
    WARD_COL = next((c for c in ward_cols if c in wards.columns), None)

    if WARD_COL is None:
        raise Exception(f"Could not detect ward-name column. Columns = {wards.columns}")

    # -----------------------------------------------
    # Fetch WAQI stations (basic)
    # -----------------------------------------------
    url = f"https://api.waqi.info/map/bounds/?latlng=28.4,76.8,28.9,77.4&token={WAQI_TOKEN}"
    resp = requests.get(url)
    data = resp.json()

    if data.get("status") != "ok":
        raise Exception("WAQI returned error")

    stations_raw = data["data"]
    station_rows = []
    station_details = []

    # -----------------------------------------------
    # Process each station
    # -----------------------------------------------
    print(f"Found {len(stations_raw)} WAQI stations. Processing...")

    for i, st in enumerate(stations_raw):
        aqi_val = st.get("aqi")
        if aqi_val in ["-", None]:
            continue
        try:
            aqi_int = int(aqi_val)
        except:
            continue

        lon = float(st["lon"])
        lat = float(st["lat"])
        name = st["station"]["name"]

        # enrich category
        info = get_aqi_category(aqi_int)

        station_info = {
            "name": name,
            "lat": lat,
            "lon": lon,
            "aqi": aqi_int,
            "category": info["category"],
            "color": info["color"]
        }

        # fetch detailed pollutants
        detailed = fetch_detailed_station_data(lat, lon)
        station_info.update(detailed)

        station_details.append(station_info)
        station_rows.append([name, lon, lat, aqi_int])

        time.sleep(0.15)

    # -----------------------------------------------
    # No stations?
    # -----------------------------------------------
    if not station_rows:
        return {
            "wards": json.loads(wards.to_json()),
            "stations": [],
            "summary": {}
        }

    # -----------------------------------------------
    # Create GeoDataFrame
    # -----------------------------------------------
    df = pd.DataFrame(station_rows, columns=["name", "lon", "lat", "aqi"])
    gdf = gpd.GeoDataFrame(df, geometry=gpd.points_from_xy(df.lon, df.lat), crs="EPSG:4326")

    # Spatial Join
    joined = gpd.sjoin(gdf, wards, how="left", predicate="within")

    # -----------------------------------------------
    # Calculate Ward AQI Stats
    # -----------------------------------------------
    ward_stats = joined.groupby(WARD_COL).agg({
        "aqi": ["mean", "max", "min", "count"]
    }).reset_index()

    ward_stats.columns = [WARD_COL, "avg_aqi", "max_aqi", "min_aqi", "station_count"]
    ward_stats["avg_aqi"] = ward_stats["avg_aqi"].round(1)

    # -----------------------------------------------
    # Merge back
    # -----------------------------------------------
    wards = wards.merge(ward_stats, on=WARD_COL, how="left")

    wards["avg_aqi"] = wards["avg_aqi"].fillna(0)
    wards["max_aqi"] = wards["max_aqi"].fillna(0)
    wards["min_aqi"] = wards["min_aqi"].fillna(0)
    wards["station_count"] = wards["station_count"].fillna(0).astype(int)

    wards["category"] = wards["avg_aqi"].apply(lambda x: get_aqi_category(int(x))["category"])
    wards["color"] = wards["avg_aqi"].apply(lambda x: get_aqi_category(int(x))["color"])

    final_geojson = json.loads(wards.to_json())

    summary = {
        "total_wards": len(wards),
        "total_stations": len(station_details),
        "avg_aqi": round(df["aqi"].mean(), 1),
        "max_aqi": int(df["aqi"].max()),
        "min_aqi": int(df["aqi"].min())
    }

    return {
        "wards": final_geojson,
        "stations": station_details,
        "summary": summary
    }

#save cache to supabase
def save_cache_to_db(data: dict):
    """
    Save AQI cache data to Supabase.
    Since 'id' is an identity column (GENERATED ALWAYS), we can't specify it.
    We'll use direct REST API calls to bypass Python client issues with identity columns.
    """
    try:
        # Use direct REST API to avoid Python client issues with GENERATED ALWAYS columns
        print("Checking for existing cache records...")
        
        # Get existing records using REST API
        # Use service key if available, otherwise use regular key
        api_key = supabase_service_key if supabase_service_key else supabase_key
        headers = {
            "apikey": api_key,
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        
        # Step 1: Delete all existing cache records
        try:
            delete_url = f"{supabase_url}/rest/v1/aqi_cache"
            delete_resp = requests.get(delete_url, headers=headers, params={"select": "id"})
            if delete_resp.ok and delete_resp.json():
                existing_records = delete_resp.json()
                print(f"Found {len(existing_records)} existing record(s). Deleting...")
                for record in existing_records:
                    record_id = record.get("id")
                    if record_id:
                        delete_one_url = f"{supabase_url}/rest/v1/aqi_cache?id=eq.{record_id}"
                        del_resp = requests.delete(delete_one_url, headers=headers)
                        if del_resp.ok:
                            print(f"  ✓ Deleted old cache record with id={record_id}")
                        else:
                            print(f"  ⚠ Warning: Could not delete cache record {record_id}")
            else:
                print("No existing cache records found.")
        except Exception as delete_err:
            print(f"  ⚠ Warning: Could not check/delete existing records: {delete_err}")
        
        # Step 2: Insert new cache record using REST API (without specifying id)
        print("Inserting new cache record (id will be auto-generated)...")
        
        insert_data = {
            "data": data,
            "generated_at": datetime.utcnow().isoformat()
        }
        
        insert_url = f"{supabase_url}/rest/v1/aqi_cache"
        insert_resp = requests.post(
            insert_url,
            headers=headers,
            json=insert_data
        )
        
        if insert_resp.ok:
            result = insert_resp.json()
            if result and len(result) > 0:
                record_id = result[0].get('id')
                print(f"✅ Cache saved successfully! New record id={record_id}")
                return result
            else:
                raise Exception("Insert succeeded but no data returned")
        else:
            error_text = insert_resp.text
            print(f"❌ Insert failed with status {insert_resp.status_code}: {error_text}")
            raise Exception(f"Failed to insert cache: {insert_resp.status_code} - {error_text}")
            
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Error saving cache: {error_msg}")
        
        # Try fallback: Use Python client update if a record exists
        print("Attempting fallback: Update existing record using Python client...")
        try:
            existing = supabase_admin.table("aqi_cache").select("id").order("id", desc=True).limit(1).execute()
            if existing.data and len(existing.data) > 0:
                record_id = existing.data[0]["id"]
                print(f"Found existing record id={record_id}. Updating...")
                response = supabase_admin.table("aqi_cache").update({
                    "data": data,
                    "generated_at": datetime.utcnow().isoformat()
                }).eq("id", record_id).execute()
                print(f"✅ Cache updated successfully in existing record id={record_id}")
                return response.data
            else:
                print("No existing record found for update fallback.")
                raise e
        except Exception as update_err:
            print(f"❌ Update fallback also failed: {update_err}")
            raise e

# Authentication Endpoints
@app.post("/api/auth/signup", response_model=TokenResponse)
async def signup(user_data: UserSignup):
    """Register a new user"""
    try:
        # Create user in Supabase Auth
        user_metadata = {
            "full_name": user_data.full_name or ""
        }
        
        # Add phone number to metadata if provided
        if user_data.phone_number:
            user_metadata["phone_number"] = user_data.phone_number
        
        response = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
            "options": {
                "data": user_metadata
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
        
        # Get user profile and metadata
        try:
            profile = supabase.table("profiles").select("*").eq("id", response.user.id).single().execute()
            full_name = profile.data.get("full_name") if profile.data else None
        except Exception as profile_error:
            # Profile might not exist yet, that's okay
            print(f"DEBUG: Profile fetch error (non-critical): {profile_error}")
            full_name = None
        
        # Get phone number from user metadata
        user_metadata = response.user.user_metadata if hasattr(response.user, 'user_metadata') else {}
        phone_number = user_metadata.get("phone_number")
        
        return TokenResponse(
            access_token=response.session.access_token,
            user={
                "id": response.user.id,
                "email": response.user.email,
                "full_name": full_name,
                "phone_number": phone_number
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
        
        # Get phone number from user metadata
        user_metadata = current_user.user_metadata if hasattr(current_user, 'user_metadata') else {}
        phone_number = user_metadata.get("phone_number")
        
        return {
            "id": current_user.id,
            "email": current_user.email,
            "full_name": profile.data.get("full_name") if profile.data else None,
            "phone_number": phone_number
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
WAQI_TOKEN = os.getenv("WAQI_API_TOKEN") or os.getenv("WAQI_TOKEN")
if not WAQI_TOKEN:
    logger.warning("WAQI_API_TOKEN not set. AQI endpoints will fail.")

@app.post("/api/admin/recompute-aqi")
def recompute_aqi(request: Request):
    """
    Trigger AQI data recomputation.
    Can be secured with X-Backend-Secret header if BACKEND_SECRET env var is set.
    """
    try:
        # Optional: Check for secret header if BACKEND_SECRET is configured
        backend_secret = os.getenv("BACKEND_SECRET")
        if backend_secret:
            provided_secret = request.headers.get("X-Backend-Secret")
            if provided_secret != backend_secret:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Unauthorized: Invalid secret key"
                )
        
        print("Starting AQI recomputation...")

        data = heavy_aqi_processing()

        save_cache_to_db(data)

        print("AQI recompute completed successfully.")

        return {"status": "ok", "message": "AQI cache updated"}
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/recompute-aqi")
def recompute_aqi_get():
    """
    GET endpoint to trigger AQI recomputation (for easier testing).
    This is less secure but useful for development.
    """
    try:
        print("Starting AQI recomputation (GET request)...")

        data = heavy_aqi_processing()

        save_cache_to_db(data)

        print("AQI recompute completed successfully.")

        return {
            "status": "ok", 
            "message": "AQI cache updated successfully",
            "summary": data.get("summary", {}),
            "wards_count": len(data.get("wards", {}).get("features", [])) if data.get("wards") else 0,
            "stations_count": len(data.get("stations", []))
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/api/delhi-aqi")
def get_cached_aqi():
    """
    Get cached AQI data from Supabase schema.
    Enriches ward data with daily averages from ward_aqi_daily table.
    If cache is empty, returns ward boundaries with daily averages if available.
    """
    try:
        # Get the most recent cache entry
        resp = supabase.table("aqi_cache").select("data").order("id", desc=True).limit(1).execute()
        
        if resp.data and len(resp.data) > 0 and resp.data[0].get("data"):
            cached_data = resp.data[0]["data"]
            
            # Enrich ward data with daily averages from ward_aqi_daily
            try:
                # Get today's daily averages for all wards
                today = date.today().isoformat()
                daily_resp = supabase.table("ward_aqi_daily")\
                    .select("*")\
                    .eq("date", today)\
                    .execute()
                
                if daily_resp.data:
                    # Create a map of ward_no to daily average
                    daily_map = {rec["ward_no"]: rec for rec in daily_resp.data}
                    
                    # If cached_data has wards, enrich them
                    if "wards" in cached_data and "features" in cached_data["wards"]:
                        for feature in cached_data["wards"]["features"]:
                            ward_no = feature.get("properties", {}).get("Ward_No") or \
                                      feature.get("properties", {}).get("ward_no")
                            if ward_no and ward_no in daily_map:
                                daily_avg = daily_map[ward_no]
                                props = feature["properties"]
                                # Update with daily average data if not already set
                                if not props.get("avg_aqi") or props.get("avg_aqi") == 0:
                                    props["avg_aqi"] = daily_avg["avg_aqi"]
                                    props["min_aqi"] = daily_avg.get("min_aqi", daily_avg["avg_aqi"])
                                    props["max_aqi"] = daily_avg.get("max_aqi", daily_avg["avg_aqi"])
                                    props["avg_pm25"] = daily_avg.get("avg_pm25")
                                    props["avg_pm10"] = daily_avg.get("avg_pm10")
                                    props["avg_no2"] = daily_avg.get("avg_no2")
                                    props["avg_o3"] = daily_avg.get("avg_o3")
            except Exception as e:
                logging.warning(f"Could not enrich with daily averages: {e}")
            
            return cached_data
    except Exception as e:
        logging.warning(f"Cache lookup failed: {e}")
    
    # Fallback: Return basic ward boundaries, enriched with daily averages if available
    logging.info("Cache empty, returning basic ward boundaries with daily averages...")
    try:
        wards_path = os.path.join(os.path.dirname(__file__), "Delhi_Wards.geojson")
        if not os.path.exists(wards_path):
            wards_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "Delhi_Wards.geojson"))
        
        if not os.path.exists(wards_path):
            raise Exception("Delhi_Wards.geojson not found")
        
        wards = gpd.read_file(wards_path)
        
        # Add default values for wards without data
        ward_cols = ["Ward_Name", "Ward_No", "Ward", "name", "NAME"]
        WARD_COL = next((c for c in ward_cols if c in wards.columns), None)
        
        if WARD_COL is None:
            raise Exception(f"Could not detect ward-name column. Columns = {wards.columns}")
        
        # Try to get daily averages from ward_aqi_daily table
        daily_map = {}
        try:
            today = date.today().isoformat()
            daily_resp = supabase.table("ward_aqi_daily")\
                .select("*")\
                .eq("date", today)\
                .execute()
            
            if daily_resp.data:
                daily_map = {rec["ward_no"]: rec for rec in daily_resp.data}
                logging.info(f"Found {len(daily_map)} wards with daily averages for today")
        except Exception as e:
            logging.warning(f"Could not fetch daily averages: {e}")
        
        # Initialize ward properties
        ward_no_col = next((c for c in ["Ward_No", "ward_no", "WARD_NO"] if c in wards.columns), None)
        
        for idx, row in wards.iterrows():
            ward_no = str(row.get(ward_no_col, "")) if ward_no_col else ""
            
            if ward_no in daily_map:
                # Use daily average data
                daily_avg = daily_map[ward_no]
                wards.at[idx, "avg_aqi"] = daily_avg["avg_aqi"]
                wards.at[idx, "min_aqi"] = daily_avg.get("min_aqi", daily_avg["avg_aqi"])
                wards.at[idx, "max_aqi"] = daily_avg.get("max_aqi", daily_avg["avg_aqi"])
                wards.at[idx, "station_count"] = 0  # Will be populated by cache
                wards.at[idx, "category"] = get_aqi_category(int(daily_avg["avg_aqi"]))
                wards.at[idx, "color"] = get_aqi_category(int(daily_avg["avg_aqi"]))["color"]
            else:
                # Default values
                wards.at[idx, "avg_aqi"] = 0
                wards.at[idx, "max_aqi"] = 0
                wards.at[idx, "min_aqi"] = 0
                wards.at[idx, "station_count"] = 0
                wards.at[idx, "category"] = "No Data"
                wards.at[idx, "color"] = "#cccccc"
        
        final_geojson = json.loads(wards.to_json())
        
        # Calculate summary from daily averages if available
        summary = {
            "total_wards": len(wards),
            "total_stations": 0,
            "avg_aqi": 0,
            "max_aqi": 0,
            "min_aqi": 0,
        }
        
        if daily_map:
            aqi_values = [rec["avg_aqi"] for rec in daily_map.values() if rec.get("avg_aqi")]
            if aqi_values:
                summary["avg_aqi"] = sum(aqi_values) / len(aqi_values)
                summary["max_aqi"] = max(aqi_values)
                summary["min_aqi"] = min(aqi_values)
            summary["message"] = "Using daily averages from database. Cache not initialized."
        else:
            summary["message"] = "Cache not initialized. Call /api/admin/recompute-aqi to generate full data."
        
        return {
            "wards": final_geojson,
            "stations": [],
            "summary": summary
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to load ward boundaries: {str(e)}")

# @app.get("/api/delhi-aqi/wards-only")
# def delhi_aqi_wards_only():
#     """
#     Returns only ward boundaries with aggregated AQI (lighter response)
#     """
#     result = delhi_aqi()
#     response_data = json.loads(result.body)
    
#     return JSONResponse(content={
#         "wards": response_data["wards"],
#         "summary": response_data["summary"]
#     })


# @app.get("/api/delhi-aqi/stations-only")
# def delhi_aqi_stations_only():
#     """
#     Returns only station data (lightest response)
#     """
#     result = delhi_aqi()
#     response_data = json.loads(result.body)
    
#     return JSONResponse(content={
#         "stations": response_data["stations"],
#         "summary": response_data["summary"]
#     })

def fetch_detailed_station_data(lat: float, lon: float) -> dict:
    """
    Fetch detailed pollutant data for a specific station
    This includes PM2.5, PM10, NO2, SO2, O3, CO
    """
    url = f"https://api.waqi.info/feed/geo:{lat};{lon}/?token={WAQI_TOKEN}"
    
    try:
        resp = requests.get(url, timeout=10)
        data = resp.json()
        
        if data["status"] != "ok":
            return {}
        
        station_data = data["data"]
        iaqi = station_data.get("iaqi", {})
        
        # Extract pollutant values (these are sub-indices, not raw concentrations)
        pollutants = {
            "pm25": iaqi.get("pm25", {}).get("v"),
            "pm10": iaqi.get("pm10", {}).get("v"),
            "no2": iaqi.get("no2", {}).get("v"),
            "so2": iaqi.get("so2", {}).get("v"),
            "o3": iaqi.get("o3", {}).get("v"),
            "co": iaqi.get("co", {}).get("v"),
            "temperature": iaqi.get("t", {}).get("v"),
            "humidity": iaqi.get("h", {}).get("v"),
            "pressure": iaqi.get("p", {}).get("v"),
            "wind_speed": iaqi.get("w", {}).get("v")
        }
        
        # Get update time
        time_info = station_data.get("time", {})
        updated = time_info.get("s", "Unknown")
        
        return {
            "pollutants": pollutants,
            "updated": updated,
            "dominentpol": station_data.get("dominentpol", "")
        }
        
    except Exception as e:
        print(f"Error fetching detailed data for {lat},{lon}: {e}")
        return {}

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

@app.get("/api/aqi/hourly/{ward_no}")
async def get_ward_hourly_aqi(
    ward_no: str,
    hours: int = Query(24, description="Number of hours to retrieve (max 48)")
):
    """
    Get hourly AQI data for a specific ward from Redis
    Returns hourly readings for the last N hours
    """
    try:
        # Use singleton instance to avoid creating new connections
        collector = get_collector()
        
        # Limit to max 48 hours
        hours = min(hours, 48)
        
        # Get data for today and yesterday if needed
        today = date.today()
        yesterday = today - timedelta(days=1)
        
        all_readings = []
        
        # Get today's data
        try:
            today_readings = collector.get_hourly_data_from_redis(ward_no, today)
            if today_readings and isinstance(today_readings, list):
                all_readings.extend(today_readings)
        except Exception as e:
            logging.warning(f"Error fetching today's data for ward {ward_no}: {e}")
        
        # Get yesterday's data if needed
        if hours > len(all_readings):
            try:
                yesterday_readings = collector.get_hourly_data_from_redis(ward_no, yesterday)
                if yesterday_readings and isinstance(yesterday_readings, list):
                    all_readings.extend(yesterday_readings)
            except Exception as e:
                logging.warning(f"Error fetching yesterday's data for ward {ward_no}: {e}")
        
        # Sort by timestamp (oldest first) - handle missing timestamps
        def get_sort_key(x):
            if not isinstance(x, dict):
                return ""
            return x.get("fetched_at") or x.get("timestamp") or x.get("time") or ""
        
        all_readings.sort(key=get_sort_key)
        
        # Get last N hours
        recent_readings = all_readings[-hours:] if len(all_readings) > hours else all_readings
        
        # Format for frontend
        formatted_data = []
        for reading in recent_readings:
            if not isinstance(reading, dict):
                logging.warning(f"Skipping invalid reading format: {type(reading)}")
                continue
                
            # Get timestamp - try multiple fields
            fetched_at = reading.get("fetched_at") or reading.get("timestamp") or reading.get("time")
            
            # If no timestamp found, skip this reading
            if not fetched_at:
                logging.warning(f"Skipping reading without timestamp: {reading}")
                continue
            
            # Ensure fetched_at is a string
            if not isinstance(fetched_at, str):
                fetched_at = str(fetched_at)
            
            try:
                # Parse datetime - handle different formats
                dt = None
                if 'Z' in fetched_at:
                    dt = datetime.fromisoformat(fetched_at.replace('Z', '+00:00'))
                elif '+' in fetched_at or fetched_at.count('-') >= 3:
                    try:
                        dt = datetime.fromisoformat(fetched_at)
                    except ValueError:
                        # Try parsing as timestamp
                        try:
                            dt = datetime.fromtimestamp(float(fetched_at))
                        except (ValueError, TypeError):
                            logging.warning(f"Could not parse timestamp: {fetched_at}")
                            continue
                else:
                    # Fallback: try parsing as simple format
                    try:
                        dt = datetime.fromisoformat(fetched_at)
                    except ValueError:
                        logging.warning(f"Could not parse timestamp format: {fetched_at}")
                        continue
                
                if dt is None:
                    continue
                
                # Convert to IST (UTC+5:30) if timezone-aware, otherwise assume UTC
                if dt.tzinfo is None:
                    # Assume UTC if no timezone info
                    dt = dt.replace(tzinfo=None)
                    ist_offset = timedelta(hours=5, minutes=30)
                    dt_ist = dt + ist_offset
                else:
                    # Convert from UTC to IST
                    ist_offset = timedelta(hours=5, minutes=30)
                    dt_utc = dt.replace(tzinfo=None) if dt.tzinfo else dt
                    dt_ist = dt_utc + ist_offset
                
                formatted_data.append({
                    "time": dt_ist.strftime("%H:00"),
                    "hour": dt_ist.hour,
                    "date": dt_ist.strftime("%Y-%m-%d"),
                    "aqi": round(reading.get("aqi", 0), 1) if reading.get("aqi") is not None else None,
                    "pm25": round(reading.get("pm25", 0), 1) if reading.get("pm25") is not None else None,
                    "pm10": round(reading.get("pm10", 0), 1) if reading.get("pm10") is not None else None,
                    "no2": round(reading.get("no2", 0), 1) if reading.get("no2") is not None else None,
                    "o3": round(reading.get("o3", 0), 1) if reading.get("o3") is not None else None,
                    "timestamp": fetched_at
                })
            except Exception as e:
                logging.warning(f"Error formatting reading: {e}, reading: {reading}")
                continue
        
        return {
            "ward_no": ward_no,
            "readings": formatted_data,
            "total_readings": len(formatted_data),
            "hours_requested": hours
        }
        
    except Exception as e:
        logging.error(f"Error getting hourly data for ward {ward_no}: {e}")
        logging.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error fetching hourly data: {str(e)}")

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

@app.get("/api/aqi/forecast/{ward_no}")
async def get_ai_forecast(
    ward_no: str,
    period: str = Query("7d", description="Forecast period: 24h, 7d, or 30d"),
    metric: str = Query("aqi", description="Metric to forecast: aqi, pm25, pm10, no2, o3")
):
    """
    Get AI-powered pollution forecast for a specific ward using Groq API
    Analyzes historical data and generates predictions
    """
    try:
        # Validate inputs
        if period not in ["24h", "7d", "30d"]:
            raise AppException("Period must be one of: 24h, 7d, 30d", status_code=400)
        if metric not in ["aqi", "pm25", "pm10", "no2", "o3"]:
            raise AppException("Metric must be one of: aqi, pm25, pm10, no2, o3", status_code=400)
        
        # Use singleton instance
        collector = get_collector()
        
        # Find ward
        ward = next((w for w in collector.selected_wards if w.get("ward_no") == ward_no), None)
        if not ward:
            raise AppException(f"Ward {ward_no} not found", status_code=404)
        
        # Get historical data based on period
        today = date.today()
        historical_data = []
        
        if period == "24h":
            # Get last 7 days of hourly data for pattern analysis
            for i in range(7):
                target_date = today - timedelta(days=i)
                day_data = collector.get_hourly_data_from_redis(ward_no, target_date)
                historical_data.extend(day_data)
        elif period == "7d":
            # Get last 30 days of daily averages
            try:
                response = supabase.table("ward_aqi_daily")\
                    .select("*")\
                    .eq("ward_no", ward_no)\
                    .order("date", desc=True)\
                    .limit(30)\
                    .execute()
                historical_data = response.data or []
            except Exception as e:
                logger.warning(f"Could not fetch daily data from Supabase: {e}")
                # Fallback to hourly data
                for i in range(30):
                    target_date = today - timedelta(days=i)
                    day_data = collector.get_hourly_data_from_redis(ward_no, target_date)
                    if day_data:
                        # Calculate average for the day
                        avg_aqi = sum(r.get("aqi", 0) for r in day_data if r.get("aqi")) / len(day_data) if day_data else None
                        if avg_aqi:
                            historical_data.append({
                                "date": target_date.isoformat(),
                                "aqi": avg_aqi,
                                "pm25": sum(r.get("pm25", 0) for r in day_data if r.get("pm25")) / len([r for r in day_data if r.get("pm25")]) if any(r.get("pm25") for r in day_data) else None,
                                "pm10": sum(r.get("pm10", 0) for r in day_data if r.get("pm10")) / len([r for r in day_data if r.get("pm10")]) if any(r.get("pm10") for r in day_data) else None,
                                "no2": sum(r.get("no2", 0) for r in day_data if r.get("no2")) / len([r for r in day_data if r.get("no2")]) if any(r.get("no2") for r in day_data) else None,
                                "o3": sum(r.get("o3", 0) for r in day_data if r.get("o3")) / len([r for r in day_data if r.get("o3")]) if any(r.get("o3") for r in day_data) else None,
                            })
        else:  # 30d
            # Get last 90 days of daily averages
            try:
                response = supabase.table("ward_aqi_daily")\
                    .select("*")\
                    .eq("ward_no", ward_no)\
                    .order("date", desc=True)\
                    .limit(90)\
                    .execute()
                historical_data = response.data or []
            except Exception as e:
                logger.warning(f"Could not fetch daily data from Supabase: {e}")
        
        if not historical_data:
            raise AppException(
                "Insufficient historical data for forecast. Please wait for more data to be collected.",
                status_code=404
            )
        
        # Prepare data for Groq analysis
        historical_summary = []
        for data_point in historical_data[-20:]:  # Last 20 data points for context
            value = data_point.get(metric)
            if value is not None:
                historical_summary.append({
                    "date": data_point.get("date") or data_point.get("fetched_at", ""),
                    "value": float(value)
                })
        
        if not historical_summary:
            raise AppException(f"No historical data available for {metric}", status_code=404)
        
        # Calculate basic statistics
        values = [d["value"] for d in historical_summary]
        avg_value = sum(values) / len(values)
        min_value = min(values)
        max_value = max(values)
        recent_trend = "increasing" if len(values) > 1 and values[-1] > values[-2] else "decreasing" if len(values) > 1 and values[-1] < values[-2] else "stable"
        
        # Create prompt for Groq
        forecast_prompt = f"""You are an AI environmental analyst. Analyze the following historical {metric.upper()} data for {ward.get('ward_name')} (Ward {ward_no}) and generate a {period} forecast.

Historical Data (last {len(historical_summary)} readings):
{chr(10).join([f"- {d['date']}: {d['value']:.1f}" for d in historical_summary[-10:]])}

Statistics:
- Average: {avg_value:.1f}
- Minimum: {min_value:.1f}
- Maximum: {max_value:.1f}
- Recent Trend: {recent_trend}

Generate a {period} forecast with the following requirements:
1. Analyze patterns, trends, and seasonality in the data
2. Predict future values for {metric.upper()}
3. Consider typical pollution patterns (morning peaks, evening peaks, weekly patterns, etc.)
4. Provide realistic predictions based on historical patterns
5. Include confidence scores (0-100%) for each prediction

Return ONLY a JSON array with this exact format:
[
  {{"time": "HH:MM" or "Day", "{metric}": <predicted_value>, "confidence": <0-100>}},
  ...
]

For 24h: Provide hourly predictions (24 data points)
For 7d: Provide daily predictions (7 data points, use day names: Mon, Tue, Wed, etc.)
For 30d: Provide daily predictions (30 data points, use day names)

IMPORTANT: Return ONLY valid JSON, no explanations, no markdown, just the array."""
        
        # Call Groq API
        try:
            chat_completion = groq_client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert environmental data analyst. You analyze air quality data and generate accurate forecasts. Always respond with valid JSON arrays only."
                    },
                    {
                        "role": "user",
                        "content": forecast_prompt
                    }
                ],
                model="llama-3.3-70b-versatile",
                temperature=0.3,  # Lower temperature for more consistent predictions
                max_tokens=2000
            )
            
            ai_response = chat_completion.choices[0].message.content
            
            # Parse JSON response
            # Try to extract JSON from response (in case it's wrapped in markdown)
            if "```json" in ai_response:
                ai_response = ai_response.split("```json")[1].split("```")[0].strip()
            elif "```" in ai_response:
                ai_response = ai_response.split("```")[1].split("```")[0].strip()
            
            # Try parsing as array or object
            try:
                forecast_data = json.loads(ai_response)
                # If it's an object with a key, extract the array
                if isinstance(forecast_data, dict):
                    for key in forecast_data:
                        if isinstance(forecast_data[key], list):
                            forecast_data = forecast_data[key]
                            break
            except json.JSONDecodeError:
                # Try to extract array from text
                array_match = re.search(r'\[.*\]', ai_response, re.DOTALL)
                if array_match:
                    forecast_data = json.loads(array_match.group())
                else:
                    raise ValueError("Could not parse forecast data from AI response")
            
            # Validate and format forecast data
            if not isinstance(forecast_data, list):
                raise ValueError("Forecast data is not a list")
            
            # Ensure all required fields
            formatted_forecast = []
            for item in forecast_data:
                if isinstance(item, dict):
                    formatted_forecast.append({
                        "time": item.get("time", ""),
                        "day": item.get("day", item.get("time", "")),
                        metric: float(item.get(metric, item.get("value", avg_value))),
                        "confidence": float(item.get("confidence", 85.0))
                    })
            
            # If we don't have enough data points, generate them
            expected_points = 24 if period == "24h" else (7 if period == "7d" else 30)
            if len(formatted_forecast) < expected_points:
                # Use the last value and trend to generate remaining points
                last_value = formatted_forecast[-1][metric] if formatted_forecast else avg_value
                trend_factor = 1.02 if recent_trend == "increasing" else 0.98 if recent_trend == "decreasing" else 1.0
                
                for i in range(len(formatted_forecast), expected_points):
                    if period == "24h":
                        hour = i
                        time_str = f"{hour:02d}:00"
                    else:
                        days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
                        day_idx = i % 7
                        time_str = days[day_idx]
                    
                    # Apply slight variation
                    variation = (i % 3 - 1) * (max_value - min_value) * 0.05
                    predicted_value = last_value * (trend_factor ** (i - len(formatted_forecast))) + variation
                    predicted_value = max(min_value * 0.8, min(max_value * 1.2, predicted_value))  # Keep within reasonable bounds
                    
                    formatted_forecast.append({
                        "time": time_str,
                        "day": time_str,
                        metric: round(predicted_value, 1),
                        "confidence": max(70.0, 95.0 - (i * 0.5))  # Decreasing confidence for further predictions
                    })
            
            # Calculate overall confidence
            avg_confidence = sum(f.get("confidence", 85) for f in formatted_forecast) / len(formatted_forecast)
            
            return {
                "ward_no": ward_no,
                "ward_name": ward.get("ward_name"),
                "period": period,
                "metric": metric,
                "forecast": formatted_forecast[:expected_points],
                "confidence": round(avg_confidence, 1),
                "historical_data_points": len(historical_summary),
                "trend": recent_trend,
                "generated_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error generating AI forecast with Groq: {e}", exc_info=True)
            # Fallback: Generate simple forecast based on statistics
            expected_points = 24 if period == "24h" else (7 if period == "7d" else 30)
            fallback_forecast = []
            
            for i in range(expected_points):
                if period == "24h":
                    time_str = f"{i:02d}:00"
                else:
                    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
                    time_str = days[i % 7] if period == "7d" else f"Day {i+1}"
                
                # Simple trend-based prediction
                trend_factor = 1.01 if recent_trend == "increasing" else 0.99 if recent_trend == "decreasing" else 1.0
                base_value = values[-1] if values else avg_value
                predicted_value = base_value * (trend_factor ** i)
                predicted_value = max(min_value * 0.9, min(max_value * 1.1, predicted_value))
                
                fallback_forecast.append({
                    "time": time_str,
                    "day": time_str,
                    metric: round(predicted_value, 1),
                    "confidence": max(70.0, 90.0 - (i * 0.3))
                })
            
            return {
                "ward_no": ward_no,
                "ward_name": ward.get("ward_name"),
                "period": period,
                "metric": metric,
                "forecast": fallback_forecast,
                "confidence": 75.0,
                "historical_data_points": len(historical_summary),
                "trend": recent_trend,
                "generated_at": datetime.utcnow().isoformat(),
                "note": "Fallback forecast (AI service unavailable)"
            }
        
    except AppException:
        raise
    except Exception as e:
        logger.error(f"Error in AI forecast endpoint: {e}", exc_info=True)
        raise AppException(
            "Failed to generate forecast. Please try again later.",
            status_code=500
        )

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