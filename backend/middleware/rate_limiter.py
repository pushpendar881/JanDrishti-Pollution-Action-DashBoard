"""
Rate limiting middleware for FastAPI
Uses Redis for distributed rate limiting
"""
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response, JSONResponse
import time
import logging
from chat_cache import get_chat_cache

logger = logging.getLogger(__name__)

# Rate limit configuration
RATE_LIMITS = {
    "/api/auth/login": {"requests": 5, "window": 60},  # 5 requests per minute
    "/api/auth/signup": {"requests": 3, "window": 60},  # 3 requests per minute
    "/api/aqi/feed/": {"requests": 30, "window": 60},  # 30 requests per minute
    "/api/aqi/hourly/": {"requests": 60, "window": 60},  # 60 requests per minute
    "/api/aqi/daily": {"requests": 30, "window": 60},  # 30 requests per minute
    "default": {"requests": 100, "window": 60}  # 100 requests per minute for other endpoints
}

class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks
        if request.url.path in ["/", "/api/health", "/docs", "/redoc", "/openapi.json"]:
            return await call_next(request)
        
        # Get rate limit config for this endpoint
        rate_limit = RATE_LIMITS.get("default")
        for path, config in RATE_LIMITS.items():
            if path != "default" and request.url.path.startswith(path):
                rate_limit = config
                break
        
        # Get client identifier (IP address or user ID)
        client_id = request.client.host if request.client else "unknown"
        
        # Check if user is authenticated (for user-based rate limiting)
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            try:
                # Extract user ID from token if possible
                # For now, use IP + path as identifier
                client_id = f"{client_id}:{request.url.path}"
            except:
                pass
        
        # Check rate limit
        try:
            chat_cache = get_chat_cache()
            rate_limit_key = f"ratelimit:{request.url.path}:{client_id}"
            
            # Get current count
            current_count = chat_cache.redis_client.get(rate_limit_key)
            
            if current_count is None:
                # First request in window
                chat_cache.redis_client.setex(rate_limit_key, rate_limit["window"], "1")
                remaining = rate_limit["requests"] - 1
            else:
                count = int(current_count)
                if count >= rate_limit["requests"]:
                    # Rate limit exceeded
                    logger.warning(f"Rate limit exceeded for {client_id} on {request.url.path}")
                    return JSONResponse(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        content={
                            "error": "Rate Limit Exceeded",
                            "message": f"Too many requests. Limit: {rate_limit['requests']} per {rate_limit['window']} seconds",
                            "retry_after": rate_limit["window"]
                        },
                        headers={"Retry-After": str(rate_limit["window"])}
                    )
                else:
                    # Increment counter
                    chat_cache.redis_client.incr(rate_limit_key)
                    remaining = rate_limit["requests"] - count - 1
            
            # Process request
            response = await call_next(request)
            
            # Add rate limit headers
            response.headers["X-RateLimit-Limit"] = str(rate_limit["requests"])
            response.headers["X-RateLimit-Remaining"] = str(remaining)
            response.headers["X-RateLimit-Reset"] = str(int(time.time()) + rate_limit["window"])
            
            return response
            
        except Exception as e:
            # If rate limiting fails, allow request but log error
            logger.error(f"Rate limiting error: {e}")
            return await call_next(request)
