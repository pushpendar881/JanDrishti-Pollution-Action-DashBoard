from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
import os
import traceback
from dotenv import load_dotenv
from supabase import create_client, Client
from jose import JWTError, jwt

load_dotenv()

app = FastAPI(title="JanDrishti API", version="1.0.0")

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
    message: str
    response: Optional[str]
    type: str
    created_at: str

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
async def upvote_report(report_id: str):
    """Upvote a report (public endpoint)"""
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
    """Get chat message history (requires authentication)"""
    try:
        response = supabase.table("chat_messages")\
            .select("*")\
            .eq("user_id", current_user.id)\
            .order("created_at", desc=True)\
            .limit(limit)\
            .offset(offset)\
            .execute()
        
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat/messages", response_model=ChatMessageResponse, status_code=status.HTTP_201_CREATED)
async def create_chat_message(
    message: ChatMessageCreate,
    current_user = Depends(get_current_user)
):
    """Send a chat message (requires authentication)"""
    try:
        # Save user message
        user_message_data = {
            "user_id": current_user.id,
            "message": message.message,
            "type": "user"
        }
        
        user_message = supabase.table("chat_messages").insert(user_message_data).execute()
        
        # TODO: Integrate with AI service (OpenAI, Anthropic, etc.)
        # For now, return a simple response
        ai_response = f"I understand you're asking about: {message.message}. This is a placeholder response. AI integration will be added later."
        
        # Save bot response
        bot_message_data = {
            "user_id": current_user.id,
            "message": message.message,
            "response": ai_response,
            "type": "bot"
        }
        
        bot_message = supabase.table("chat_messages").insert(bot_message_data).execute()
        
        return {
            "id": user_message.data[0]["id"],
            "user_id": current_user.id,
            "message": message.message,
            "response": ai_response,
            "type": "user",
            "created_at": user_message.data[0]["created_at"]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/")
async def root():
    return {"message": "JanDrishti API", "version": "1.0.0"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
