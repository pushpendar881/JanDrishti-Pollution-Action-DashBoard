"""
Singleton pattern for AQICollector to avoid creating multiple instances
This reduces latency by reusing connections and cached data
"""
from aqi_collector import AQICollector
import threading

# Global singleton instance
_collector_instance = None
_collector_lock = threading.Lock()

def get_collector() -> AQICollector:
    """Get or create the global AQICollector instance (singleton)"""
    global _collector_instance
    
    if _collector_instance is None:
        with _collector_lock:
            # Double-check after acquiring lock
            if _collector_instance is None:
                _collector_instance = AQICollector()
    
    return _collector_instance

def reset_collector():
    """Reset the singleton instance (useful for testing or reconnection)"""
    global _collector_instance
    with _collector_lock:
        _collector_instance = None
