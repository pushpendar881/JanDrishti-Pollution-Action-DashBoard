# Redis Storage Troubleshooting Guide

## ✅ Connection Status

Based on the test, your **Redis connection is working correctly**:
- ✅ Connection successful
- ✅ Write/Read test passed
- ✅ Authentication working

## ⚠️ Why No Data in Redis?

The test shows **no AQI data** because:

1. **Scheduler hasn't run yet** - AQI data is collected hourly by the scheduler
2. **No manual trigger** - Data collection needs to be triggered
3. **Cache keys exist** - The cache middleware is working (found 1 cache key)

## 🔍 How to Check Redis Database

### Method 1: Using the Test Script (Recommended)
```bash
cd backend
python3 test_redis_storage.py
```

This will show:
- Connection status
- All keys in Redis
- AQI data keys
- Chat keys
- Key types and TTLs

### Method 2: Using Redis CLI

**For Redis Cloud:**
```bash
# Install redis-cli if not installed
brew install redis  # macOS
# or
sudo apt-get install redis-tools  # Linux

# Connect to Redis Cloud
redis-cli -h redis-11826.crce179.ap-south-1-1.ec2.cloud.redislabs.com -p 11826 -a YOUR_PASSWORD --no-auth-warning

# Once connected:
> KEYS *                    # List all keys
> KEYS aqi:*                # List AQI keys
> KEYS chat:*               # List chat keys
> GET aqi:hourly:ward_1:2024-01-15:10  # Get specific key
> ZRANGE aqi:hourly:ward_1:2024-01-15 0 -1  # Get sorted set
> TTL aqi:hourly:ward_1:2024-01-15:10  # Check expiration
```

### Method 3: Using Python
```python
import redis
import os
from dotenv import load_dotenv

load_dotenv()

# Connect
r = redis.Redis(
    host=os.getenv("REDIS_HOST"),
    port=int(os.getenv("REDIS_PORT")),
    password=os.getenv("REDIS_PASSWORD"),
    username=os.getenv("REDIS_USERNAME", "default"),
    decode_responses=True
)

# Check keys
print("All keys:", r.keys("*"))
print("AQI keys:", r.keys("aqi:*"))
print("Chat keys:", r.keys("chat:*"))

# Get specific data
key = "aqi:hourly:ward_1:2024-01-15:10"
data = r.get(key)
print(f"Data for {key}:", data)
```

### Method 4: Redis Cloud Dashboard

1. Log into [Redis Cloud](https://redis.com/cloud/)
2. Go to your database
3. Click on "CLI" or "Browser" tab
4. Run commands like `KEYS *` or `GET <key>`

## 🚀 How to Trigger Data Collection

### Option 1: Wait for Scheduler (Automatic)
The scheduler runs automatically:
- **Hourly**: Every hour at minute 0 (e.g., 1:00, 2:00, 3:00)
- **Daily**: Every day at 00:00 IST (midnight)

Make sure the scheduler is running:
```bash
# Check if backend is running
ps aux | grep "python.*main.py"

# Check scheduler logs
tail -f backend/logs/aqi_service.log
```

### Option 2: Manual Trigger via API
```bash
# Trigger hourly collection
curl -X POST http://localhost:8000/api/aqi/scheduler/trigger/hourly

# Trigger daily calculation
curl -X POST http://localhost:8000/api/aqi/scheduler/trigger/daily
```

### Option 3: Manual Trigger via Python
```python
from aqi_collector_singleton import get_collector

collector = get_collector()
collector.fetch_and_store_hourly_data()
```

## 📊 Expected Redis Key Patterns

### AQI Hourly Data
```
aqi:hourly:{ward_no}:{date}:{hour}
Example: aqi:hourly:ward_1:2024-01-15:10

aqi:hourly:{ward_no}:{date}  (sorted set)
Example: aqi:hourly:ward_1:2024-01-15
```

### Chat Data
```
chat:history:{user_id}
chat:session:{user_id}
chat:ratelimit:{user_id}
```

### Cache Data
```
cache:api:{hash}
```

### Rate Limiting
```
ratelimit:{path}:{client_id}
```

## 🔧 Troubleshooting Steps

### Step 1: Verify Scheduler is Running
```bash
# Check if scheduler started
grep "AQI Scheduler started" backend/logs/aqi_service.log

# Check for errors
grep "ERROR" backend/logs/aqi_service.log
```

### Step 2: Check WAQI API Token
```bash
# Make sure WAQI_API_TOKEN is set
grep WAQI_API_TOKEN backend/.env
```

### Step 3: Manually Trigger Collection
```bash
# Trigger hourly collection
curl -X POST http://localhost:8000/api/aqi/scheduler/trigger/hourly

# Wait a few seconds, then check Redis
python3 backend/test_redis_storage.py
```

### Step 4: Check Scheduler Status
```bash
# Get scheduler status
curl http://localhost:8000/api/aqi/scheduler/status
```

### Step 5: Verify Data Collection
After triggering, check Redis:
```bash
python3 backend/test_redis_storage.py
```

You should see keys like:
- `aqi:hourly:ward_1:2024-01-15:10`
- `aqi:hourly:ward_1:2024-01-15` (sorted set)

## 🐛 Common Issues

### Issue 1: "No keys found"
**Cause:** Scheduler hasn't run or data collection failed
**Solution:** 
- Check scheduler is running
- Manually trigger collection
- Check WAQI_API_TOKEN is set

### Issue 2: "Connection failed"
**Cause:** Wrong credentials or Redis server down
**Solution:**
- Verify REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
- Check Redis Cloud dashboard
- Test connection with `test_redis_storage.py`

### Issue 3: "Keys expire too quickly"
**Cause:** TTL is set too short
**Solution:**
- AQI keys expire after 2 days (86400 * 2 seconds)
- This is intentional to prevent Redis from filling up
- Data is moved to Supabase for long-term storage

### Issue 4: "Wrong database number"
**Cause:** REDIS_DB setting might be wrong
**Solution:**
- Default is 0
- Check `.env` file: `REDIS_DB=0`
- Redis Cloud uses database 0 by default

## 📝 Quick Checklist

- [ ] Redis connection working (test with `test_redis_storage.py`)
- [ ] Backend server running
- [ ] Scheduler started (check logs)
- [ ] WAQI_API_TOKEN set in `.env`
- [ ] Manually triggered data collection
- [ ] Checked Redis keys after trigger
- [ ] Verified data format in Redis

## 🎯 Next Steps

1. **Start the backend server:**
   ```bash
   cd backend
   python3 main.py
   ```

2. **Wait for scheduler or trigger manually:**
   ```bash
   curl -X POST http://localhost:8000/api/aqi/scheduler/trigger/hourly
   ```

3. **Check Redis after 30 seconds:**
   ```bash
   python3 backend/test_redis_storage.py
   ```

4. **You should now see AQI keys!**
