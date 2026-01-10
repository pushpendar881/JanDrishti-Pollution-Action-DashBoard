"""
Response caching middleware for AQI endpoints
Uses Redis to cache responses and reduce external API calls
"""
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import json
import hashlib
import logging
from chat_cache import get_chat_cache

logger = logging.getLogger(__name__)

# Cache configuration
CACHE_TTL = {
    "/api/aqi/feed/": 300,  # 5 minutes for feed data
    "/api/aqi/hourly/": 60,  # 1 minute for hourly data
    "/api/aqi/daily": 3600,  # 1 hour for daily data
    "/api/aqi/wards": 3600,  # 1 hour for wards list
}

class CacheMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Only cache GET requests
        if request.method != "GET":
            return await call_next(request)
        
        # Check if this endpoint should be cached
        cache_ttl = None
        for path, ttl in CACHE_TTL.items():
            if request.url.path.startswith(path):
                cache_ttl = ttl
                break
        
        if not cache_ttl:
            return await call_next(request)
        
        # Generate cache key from request
        cache_key = self._generate_cache_key(request)
        
        try:
            chat_cache = get_chat_cache()
            
            # Try to get from cache
            cached_response = chat_cache.redis_client.get(cache_key)
            if cached_response:
                logger.debug(f"Cache hit for {request.url.path}")
                cached_data = json.loads(cached_response)
                return JSONResponse(
                    content=cached_data["content"],
                    status_code=cached_data["status_code"],
                    headers={**cached_data.get("headers", {}), "X-Cache": "HIT"}
                )
            
            # Cache miss - process request
            response = await call_next(request)
            
            # Cache successful responses only
            if response.status_code == 200:
                try:
                    # Read response body
                    response_body = b""
                    async for chunk in response.body_iterator:
                        response_body += chunk
                    
                    # Parse JSON
                    response_data = json.loads(response_body)
                    
                    # Store in cache
                    cache_data = {
                        "content": response_data,
                        "status_code": response.status_code,
                        "headers": dict(response.headers)
                    }
                    chat_cache.redis_client.setex(
                        cache_key,
                        cache_ttl,
                        json.dumps(cache_data)
                    )
                    
                    logger.debug(f"Cached response for {request.url.path}")
                    
                    # Return response with cache header
                    return JSONResponse(
                        content=response_data,
                        status_code=response.status_code,
                        headers={**response.headers, "X-Cache": "MISS"}
                    )
                except Exception as e:
                    logger.warning(f"Error caching response: {e}")
                    # Return original response if caching fails
                    return Response(
                        content=response_body,
                        status_code=response.status_code,
                        headers=response.headers
                    )
            
            return response
            
        except Exception as e:
            logger.error(f"Cache middleware error: {e}")
            # If caching fails, just process request normally
            return await call_next(request)
    
    def _generate_cache_key(self, request: Request) -> str:
        """Generate cache key from request path and query params"""
        key_parts = [request.url.path]
        if request.url.query:
            # Sort query params for consistent keys
            sorted_params = sorted(request.url.query.split("&"))
            key_parts.extend(sorted_params)
        
        key_string = "|".join(key_parts)
        key_hash = hashlib.md5(key_string.encode()).hexdigest()
        return f"cache:api:{key_hash}"
