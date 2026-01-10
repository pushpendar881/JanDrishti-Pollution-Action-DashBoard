"""
Redis-based Chat Cache and Optimization
Provides fast chat history retrieval, session management, and rate limiting
"""
import os
import json
import redis
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from dotenv import load_dotenv

load_dotenv()

# Redis Configuration
# Support both connection string (Redis Cloud) and individual parameters (local)
REDIS_URL = os.getenv("REDIS_URL", None)  # Redis Cloud connection string
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB = int(os.getenv("REDIS_DB", 0))
REDIS_USERNAME = os.getenv("REDIS_USERNAME", "default")  # Redis Cloud default username
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", None)
REDIS_SSL = os.getenv("REDIS_SSL", "false").lower() == "true"  # Enable SSL for Redis Cloud

class ChatCache:
    def __init__(self):
        """Initialize Redis client for chat caching"""
        # Redis client - support both connection string and individual parameters
        try:
            if REDIS_URL:
                # Use connection string (Redis Cloud format: redis://default:password@host:port)
                # or rediss:// for SSL
                # Check if URL already has SSL protocol
                use_ssl = REDIS_URL.startswith('rediss://') or REDIS_SSL
                self.redis_client = redis.from_url(
                    REDIS_URL,
                    decode_responses=True,
                    ssl=use_ssl,
                    ssl_cert_reqs=None if use_ssl else False,
                    socket_connect_timeout=5
                )
            else:
                # Use individual parameters (local Redis or Redis Cloud)
                # Try with SSL first if enabled, fallback to non-SSL if SSL fails
                try:
                    self.redis_client = redis.Redis(
                        host=REDIS_HOST,
                        port=REDIS_PORT,
                        db=REDIS_DB,
                        username=REDIS_USERNAME if REDIS_PASSWORD else None,  # Only set username if password is provided
                        password=REDIS_PASSWORD,
                        decode_responses=True,
                        ssl=REDIS_SSL,
                        ssl_cert_reqs=None if REDIS_SSL else False,
                        socket_connect_timeout=5
                    )
                    # Test connection
                    self.redis_client.ping()
                except (redis.ConnectionError, redis.TimeoutError) as ssl_error:
                    if REDIS_SSL and ("SSL" in str(ssl_error) or "wrong version" in str(ssl_error).lower()):
                        # SSL failed, try without SSL (some Redis Cloud ports don't use SSL)
                        print(f"⚠️  SSL connection failed, trying without SSL...")
                        self.redis_client = redis.Redis(
                            host=REDIS_HOST,
                            port=REDIS_PORT,
                            db=REDIS_DB,
                            username=REDIS_USERNAME if REDIS_PASSWORD else None,
                            password=REDIS_PASSWORD,
                            decode_responses=True,
                            ssl=False,
                            socket_connect_timeout=5
                        )
                        self.redis_client.ping()
                    else:
                        raise
            
            # Test connection if not already tested
            if not REDIS_URL:
                self.redis_client.ping()
        except redis.ConnectionError as e:
            raise ConnectionError(f"Failed to connect to Redis: {e}. Please check your Redis configuration.")
        except redis.AuthenticationError as e:
            raise ConnectionError(f"Redis authentication failed: {e}. Please check your password.")
        except Exception as e:
            raise ValueError(f"Redis initialization error: {e}")
        
        # Configuration
        self.CACHE_TTL = 3600 * 24  # 24 hours
        self.RECENT_MESSAGES_COUNT = 50  # Cache last 50 messages
        self.SESSION_TTL = 3600 * 2  # 2 hours for active sessions
        self.RATE_LIMIT_WINDOW = 60  # 1 minute
        self.RATE_LIMIT_MAX = 10  # 10 messages per minute
    
    def _get_user_chat_key(self, user_id: str) -> str:
        """Get Redis key for user's chat history"""
        return f"chat:history:{user_id}"
    
    def _get_user_session_key(self, user_id: str) -> str:
        """Get Redis key for user's active session"""
        return f"chat:session:{user_id}"
    
    def _get_rate_limit_key(self, user_id: str) -> str:
        """Get Redis key for rate limiting"""
        return f"chat:ratelimit:{user_id}"
    
    def _get_message_key(self, message_id: str) -> str:
        """Get Redis key for individual message"""
        return f"chat:message:{message_id}"
    
    def _get_conversation_summary_key(self, user_id: str) -> str:
        """Get Redis key for conversation summary"""
        return f"chat:summary:{user_id}"
    
    def cache_message(self, user_id: str, message: Dict):
        """
        Cache a single message in Redis
        Also adds to user's recent messages list
        """
        try:
            message_id = message.get("id", str(datetime.now().timestamp()))
            message_key = self._get_message_key(message_id)
            
            # Store individual message
            self.redis_client.setex(
                message_key,
                self.CACHE_TTL,
                json.dumps(message)
            )
            
            # Add to user's recent messages list (sorted set by timestamp)
            user_chat_key = self._get_user_chat_key(user_id)
            timestamp = datetime.fromisoformat(message.get("created_at", datetime.now().isoformat())).timestamp()
            
            self.redis_client.zadd(
                user_chat_key,
                {json.dumps(message): timestamp}
            )
            
            # Keep only recent N messages in cache
            self.redis_client.zremrangebyrank(
                user_chat_key,
                0,
                -(self.RECENT_MESSAGES_COUNT + 1)
            )
            
            # Set expiry on the sorted set
            self.redis_client.expire(user_chat_key, self.CACHE_TTL)
            
            return True
        except Exception as e:
            print(f"Error caching message: {e}")
            return False
    
    def get_cached_messages(self, user_id: str, limit: int = 50) -> List[Dict]:
        """
        Get cached messages for a user
        Returns messages sorted by timestamp (newest first)
        """
        try:
            user_chat_key = self._get_user_chat_key(user_id)
            
            # Get recent messages (sorted by timestamp, descending)
            messages_json = self.redis_client.zrevrange(
                user_chat_key,
                0,
                limit - 1
            )
            
            messages = []
            for msg_json in messages_json:
                try:
                    messages.append(json.loads(msg_json))
                except json.JSONDecodeError:
                    continue
            
            return messages
        except Exception as e:
            print(f"Error getting cached messages: {e}")
            return []
    
    def cache_messages_batch(self, user_id: str, messages: List[Dict]):
        """Cache multiple messages at once"""
        for message in messages:
            self.cache_message(user_id, message)
    
    def invalidate_user_cache(self, user_id: str):
        """Clear all cached data for a user"""
        try:
            keys_to_delete = [
                self._get_user_chat_key(user_id),
                self._get_user_session_key(user_id),
                self._get_conversation_summary_key(user_id),
            ]
            
            for key in keys_to_delete:
                self.redis_client.delete(key)
            
            return True
        except Exception as e:
            print(f"Error invalidating cache: {e}")
            return False
    
    def update_session(self, user_id: str, metadata: Dict = None):
        """Update user's active chat session"""
        try:
            session_key = self._get_user_session_key(user_id)
            session_data = {
                "last_active": datetime.now().isoformat(),
                "metadata": metadata or {}
            }
            
            self.redis_client.setex(
                session_key,
                self.SESSION_TTL,
                json.dumps(session_data)
            )
            
            return True
        except Exception as e:
            print(f"Error updating session: {e}")
            return False
    
    def get_session(self, user_id: str) -> Optional[Dict]:
        """Get user's active session data"""
        try:
            session_key = self._get_user_session_key(user_id)
            session_json = self.redis_client.get(session_key)
            
            if session_json:
                return json.loads(session_json)
            return None
        except Exception as e:
            print(f"Error getting session: {e}")
            return None
    
    def check_rate_limit(self, user_id: str) -> Tuple[bool, int]:
        """
        Check if user has exceeded rate limit
        Returns (is_allowed, remaining_requests)
        """
        try:
            rate_limit_key = self._get_rate_limit_key(user_id)
            current_count = self.redis_client.get(rate_limit_key)
            
            if current_count is None:
                # First request in this window
                self.redis_client.setex(rate_limit_key, self.RATE_LIMIT_WINDOW, "1")
                return True, self.RATE_LIMIT_MAX - 1
            else:
                count = int(current_count)
                if count >= self.RATE_LIMIT_MAX:
                    return False, 0
                else:
                    # Increment counter
                    self.redis_client.incr(rate_limit_key)
                    return True, self.RATE_LIMIT_MAX - count - 1
        except Exception as e:
            print(f"Error checking rate limit: {e}")
            # On error, allow the request
            return True, self.RATE_LIMIT_MAX
    
    def cache_conversation_summary(self, user_id: str, summary: str):
        """Cache a summary of the conversation for context"""
        try:
            summary_key = self._get_conversation_summary_key(user_id)
            summary_data = {
                "summary": summary,
                "updated_at": datetime.now().isoformat()
            }
            
            self.redis_client.setex(
                summary_key,
                self.CACHE_TTL,
                json.dumps(summary_data)
            )
            
            return True
        except Exception as e:
            print(f"Error caching summary: {e}")
            return False
    
    def get_conversation_summary(self, user_id: str) -> Optional[str]:
        """Get cached conversation summary"""
        try:
            summary_key = self._get_conversation_summary_key(user_id)
            summary_json = self.redis_client.get(summary_key)
            
            if summary_json:
                data = json.loads(summary_json)
                return data.get("summary")
            return None
        except Exception as e:
            print(f"Error getting summary: {e}")
            return None
    
    def get_conversation_context(self, user_id: str, max_messages: int = 10) -> List[Dict]:
        """
        Get recent conversation context for AI
        Returns last N messages for context
        """
        try:
            messages = self.get_cached_messages(user_id, limit=max_messages)
            # Return in chronological order (oldest first) for AI context
            return list(reversed(messages))
        except Exception as e:
            print(f"Error getting conversation context: {e}")
            return []


# Global instance
_chat_cache_instance = None

def get_chat_cache() -> ChatCache:
    """Get or create the global chat cache instance"""
    global _chat_cache_instance
    if _chat_cache_instance is None:
        _chat_cache_instance = ChatCache()
    return _chat_cache_instance
