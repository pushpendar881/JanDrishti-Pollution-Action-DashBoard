"""
AQI Data Collector Service
Fetches hourly AQI data for selected wards and stores in Redis.
Calculates daily averages and stores in Supabase.
"""
import os
import json
import redis
import requests
import time
from datetime import datetime, date, timedelta
from typing import List, Dict, Optional
from dotenv import load_dotenv
from supabase import create_client, Client
import threading

load_dotenv()

# WAQI API Token
WAQI_TOKEN = os.getenv("WAQI_API_TOKEN")
if not WAQI_TOKEN:
    logger.warning("WAQI_API_TOKEN not set in environment variables. AQI data collection will fail.")

# Redis Configuration
# Support both connection string (Redis Cloud) and individual parameters (local)
REDIS_URL = os.getenv("REDIS_URL", None)  # Redis Cloud connection string
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB = int(os.getenv("REDIS_DB", 0))
REDIS_USERNAME = os.getenv("REDIS_USERNAME", "default")  # Redis Cloud default username
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", None)
REDIS_SSL = os.getenv("REDIS_SSL", "false").lower() == "true"  # Enable SSL for Redis Cloud

# Supabase Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

class AQICollector:
    def __init__(self):
        """Initialize Redis and Supabase clients"""
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
        
        # Supabase client (using service key for admin operations)
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
        
        self.supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        
        # Load selected wards (cached)
        self.selected_wards = self._load_selected_wards()
    
    @staticmethod
    def _get_cached_wards() -> Optional[List[Dict]]:
        """Get cached selected wards"""
        if not hasattr(AQICollector, '_cached_wards'):
            AQICollector._cached_wards = None
            AQICollector._cache_lock = threading.Lock()
        return AQICollector._cached_wards
    
    @staticmethod
    def _set_cached_wards(wards: List[Dict]):
        """Cache selected wards"""
        if not hasattr(AQICollector, '_cached_wards'):
            AQICollector._cached_wards = None
            AQICollector._cache_lock = threading.Lock()
        AQICollector._cached_wards = wards
    
    def _load_selected_wards(self) -> List[Dict]:
        """Load selected wards from cache, Supabase, or JSON file"""
        # Check cache first
        cached = self._get_cached_wards()
        if cached is not None:
            return cached
        
        # Load from database/file
        with self._cache_lock:
            # Double-check after acquiring lock
            cached = self._get_cached_wards()
            if cached is not None:
                return cached
            
            try:
                # Try to load from Supabase first
                response = self.supabase.table("selected_wards").select("*").eq("is_active", True).execute()
                if response.data:
                    self._set_cached_wards(response.data)
                    return response.data
            except Exception as e:
                print(f"Could not load from Supabase: {e}")
            
            # Fallback to JSON file
            json_path = os.path.join(os.path.dirname(__file__), "selected_wards.json")
            if os.path.exists(json_path):
                with open(json_path, 'r') as f:
                    wards = json.load(f)
                    self._set_cached_wards(wards)
                    return wards
            
            raise FileNotFoundError("Could not find selected_wards.json or Supabase data")
    
    @staticmethod
    def clear_wards_cache():
        """Clear cached selected wards (useful for testing or updates)"""
        if hasattr(AQICollector, '_cached_wards'):
            AQICollector._cached_wards = None
    
    def fetch_aqi_for_ward(self, lat: float, lon: float) -> Optional[Dict]:
        """
        Fetch AQI data for a specific location using WAQI API
        Returns dict with AQI and pollutant data
        Note: This is synchronous for backward compatibility with scheduler
        For async endpoints, use the async version in main.py
        """
        try:
            # Check if token is available
            if not WAQI_TOKEN:
                logger.error("WAQI_API_TOKEN not set. Cannot fetch AQI data.")
                return None
            
            # Validate coordinates
            if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
                logger.error(f"Invalid coordinates: lat={lat}, lon={lon}")
                return None
            
            detail_url = f"https://api.waqi.info/feed/geo:{lat};{lon}/?token={WAQI_TOKEN}"
            response = requests.get(detail_url, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if data.get("status") != "ok":
                logger.warning(f"WAQI API Error for ({lat}, {lon}): {data.get('data', 'Unknown error')}")
                return None
            
            station_full = data.get("data", {})
            iaqi = station_full.get("iaqi", {})
            time_data = station_full.get("time", {})
            
            # Get AQI value
            aqi = station_full.get("aqi")
            if aqi is None:
                aqi = station_full.get("iaqi", {}).get("aqi", {}).get("v")
            
            if aqi is None:
                return None
            
            return {
                "aqi": float(aqi),
                "pm25": iaqi.get("pm25", {}).get("v"),
                "pm10": iaqi.get("pm10", {}).get("v"),
                "no2": iaqi.get("no2", {}).get("v"),
                "o3": iaqi.get("o3", {}).get("v"),
                "timestamp": time_data.get("s", datetime.utcnow().isoformat()),
                "fetched_at": datetime.utcnow().isoformat()
            }
        except requests.RequestException as e:
            logger.error(f"HTTP error fetching AQI data for ({lat}, {lon}): {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error fetching AQI data for ({lat}, {lon}): {e}", exc_info=True)
            return None
    
    def store_hourly_data_in_redis(self, ward: Dict, aqi_data: Dict):
        """
        Store hourly AQI data in Redis
        Key format: aqi:hourly:{ward_no}:{date}:{hour}
        """
        if not aqi_data:
            return
        
        ward_no = ward["ward_no"]
        now = datetime.utcnow()
        date_str = now.strftime("%Y-%m-%d")
        hour = now.hour
        
        # Store individual reading
        key = f"aqi:hourly:{ward_no}:{date_str}:{hour}"
        self.redis_client.setex(
            key,
            86400 * 2,  # Expire after 2 days
            json.dumps(aqi_data)
        )
        
        # Add to sorted set for the day (for easy retrieval)
        day_key = f"aqi:hourly:{ward_no}:{date_str}"
        score = now.timestamp()
        self.redis_client.zadd(day_key, {json.dumps(aqi_data): score})
        self.redis_client.expire(day_key, 86400 * 2)  # Expire after 2 days
        
        logger.info(f"✓ Stored hourly data for {ward['ward_name']} ({ward_no}) at {now.strftime('%Y-%m-%d %H:00')}")
    
    def get_hourly_data_from_redis(self, ward_no: str, target_date: date) -> List[Dict]:
        """
        Get all hourly readings for a ward on a specific date from Redis
        """
        date_str = target_date.strftime("%Y-%m-%d")
        day_key = f"aqi:hourly:{ward_no}:{date_str}"
        
        # Get all readings for the day
        readings = self.redis_client.zrange(day_key, 0, -1)
        
        result = []
        for reading_json in readings:
            try:
                result.append(json.loads(reading_json))
            except json.JSONDecodeError:
                continue
        
        return result
    
    def calculate_daily_average(self, hourly_readings: List[Dict]) -> Optional[Dict]:
        """
        Calculate daily average from hourly readings
        """
        if not hourly_readings:
            return None
        
        aqi_values = [r["aqi"] for r in hourly_readings if r.get("aqi") is not None]
        pm25_values = [r["pm25"] for r in hourly_readings if r.get("pm25") is not None]
        pm10_values = [r["pm10"] for r in hourly_readings if r.get("pm10") is not None]
        no2_values = [r["no2"] for r in hourly_readings if r.get("no2") is not None]
        o3_values = [r["o3"] for r in hourly_readings if r.get("o3") is not None]
        
        if not aqi_values:
            return None
        
        return {
            "avg_aqi": sum(aqi_values) / len(aqi_values),
            "min_aqi": min(aqi_values),
            "max_aqi": max(aqi_values),
            "avg_pm25": sum(pm25_values) / len(pm25_values) if pm25_values else None,
            "avg_pm10": sum(pm10_values) / len(pm10_values) if pm10_values else None,
            "avg_no2": sum(no2_values) / len(no2_values) if no2_values else None,
            "avg_o3": sum(o3_values) / len(o3_values) if o3_values else None,
            "hourly_readings_count": len(hourly_readings)
        }
    
    def store_daily_average_in_supabase(self, ward: Dict, target_date: date, daily_avg: Dict):
        """
        Store or update daily average AQI in Supabase
        """
        try:
            data = {
                "ward_name": ward["ward_name"],
                "ward_no": ward["ward_no"],
                "quadrant": ward["quadrant"],
                "latitude": ward["latitude"],
                "longitude": ward["longitude"],
                "date": target_date.isoformat(),
                "avg_aqi": daily_avg["avg_aqi"],
                "min_aqi": daily_avg["min_aqi"],
                "max_aqi": daily_avg["max_aqi"],
                "avg_pm25": daily_avg.get("avg_pm25"),
                "avg_pm10": daily_avg.get("avg_pm10"),
                "avg_no2": daily_avg.get("avg_no2"),
                "avg_o3": daily_avg.get("avg_o3"),
                "hourly_readings_count": daily_avg["hourly_readings_count"],
                "updated_at": datetime.utcnow().isoformat()
            }
            
            # Use upsert to insert or update
            response = self.supabase.table("ward_aqi_daily").upsert(
                data,
                on_conflict="ward_no,date"
            ).execute()
            
            print(f"✓ Stored daily average for {ward['ward_name']} ({ward['ward_no']}) for {target_date}")
            return response.data
        except Exception as e:
            print(f"Error storing daily average in Supabase: {e}")
            return None
    
    def fetch_and_store_hourly_data(self):
        """
        Fetch AQI data for all selected wards and store in Redis
        This should be called every hour
        """
        logger.info(f"\n{'='*70}")
        logger.info(f"Fetching AQI data at {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info(f"{'='*70}")
        
        success_count = 0
        for ward in self.selected_wards:
            logger.info(f"\nFetching data for {ward['ward_name']} ({ward['ward_no']})...")
            aqi_data = self.fetch_aqi_for_ward(ward["latitude"], ward["longitude"])
            
            if aqi_data:
                self.store_hourly_data_in_redis(ward, aqi_data)
                success_count += 1
            else:
                logger.warning(f"⚠ No data available for {ward['ward_name']}")
            
            # Small delay to avoid rate limiting
            time.sleep(0.5)
        
        logger.info(f"\n{'='*70}")
        logger.info(f"Hourly data collection completed - {success_count}/{len(self.selected_wards)} wards successful")
        logger.info(f"{'='*70}\n")
    
    def calculate_and_store_daily_averages(self, target_date: Optional[date] = None):
        """
        Calculate daily averages from Redis data and store in Supabase
        This should be called once per day (typically at midnight)
        """
        if target_date is None:
            # Calculate for yesterday (since we want complete 24-hour data)
            target_date = date.today() - timedelta(days=1)
        
        print(f"\n{'='*70}")
        print(f"Calculating daily averages for {target_date}")
        print(f"{'='*70}")
        
        for ward in self.selected_wards:
            print(f"\nProcessing {ward['ward_name']} ({ward['ward_no']})...")
            
            # Get all hourly readings for the day
            hourly_readings = self.get_hourly_data_from_redis(ward["ward_no"], target_date)
            
            if not hourly_readings:
                print(f"⚠ No hourly data found for {ward['ward_name']} on {target_date}")
                continue
            
            print(f"  Found {len(hourly_readings)} hourly readings")
            
            # Calculate daily average
            daily_avg = self.calculate_daily_average(hourly_readings)
            
            if daily_avg:
                # Store in Supabase
                self.store_daily_average_in_supabase(ward, target_date, daily_avg)
            else:
                print(f"⚠ Could not calculate daily average for {ward['ward_name']}")
        
        print(f"\n{'='*70}")
        print("Daily average calculation completed")
        print(f"{'='*70}\n")


if __name__ == "__main__":
    # Test the collector
    collector = AQICollector()
    
    # Test: Fetch and store hourly data
    print("Testing hourly data collection...")
    collector.fetch_and_store_hourly_data()
    
    # Test: Calculate daily average (for yesterday)
    print("\nTesting daily average calculation...")
    yesterday = date.today() - timedelta(days=1)
    collector.calculate_and_store_daily_averages(yesterday)
