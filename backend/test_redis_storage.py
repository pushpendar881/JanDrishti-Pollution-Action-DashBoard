#!/usr/bin/env python3
"""
Test script to check Redis connection and data storage
"""
import os
import sys
from dotenv import load_dotenv
import redis
from datetime import datetime

load_dotenv()

def test_redis_connection():
    """Test Redis connection and show configuration"""
    print("=" * 60)
    print("Redis Connection Test")
    print("=" * 60)
    
    # Get Redis configuration
    redis_url = os.getenv("REDIS_URL")
    redis_host = os.getenv("REDIS_HOST", "localhost")
    redis_port = int(os.getenv("REDIS_PORT", 6379))
    redis_db = int(os.getenv("REDIS_DB", 0))
    redis_password = os.getenv("REDIS_PASSWORD", None)
    redis_username = os.getenv("REDIS_USERNAME", "default")
    redis_ssl = os.getenv("REDIS_SSL", "false").lower() == "true"
    
    print(f"\n📋 Configuration:")
    print(f"   REDIS_URL: {redis_url if redis_url else 'Not set'}")
    print(f"   REDIS_HOST: {redis_host}")
    print(f"   REDIS_PORT: {redis_port}")
    print(f"   REDIS_DB: {redis_db}")
    print(f"   REDIS_USERNAME: {redis_username}")
    print(f"   REDIS_PASSWORD: {'***' if redis_password else 'Not set'}")
    print(f"   REDIS_SSL: {redis_ssl}")
    
    # Try to connect
    try:
        if redis_url:
            print(f"\n🔌 Connecting using REDIS_URL...")
            try:
                client = redis.from_url(
                    redis_url,
                    decode_responses=True,
                    socket_connect_timeout=5
                )
                client.ping()
                print("✅ Connected using REDIS_URL")
            except Exception as e:
                print(f"❌ Connection failed: {e}")
                return None
        else:
            print(f"\n🔌 Connecting using individual parameters...")
            try:
                client = redis.Redis(
                    host=redis_host,
                    port=redis_port,
                    db=redis_db,
                    username=redis_username if redis_password else None,
                    password=redis_password,
                    decode_responses=True,
                    ssl=redis_ssl,
                    ssl_cert_reqs=None if redis_ssl else False,
                    socket_connect_timeout=5
                )
                client.ping()
                print("✅ Connected using individual parameters")
            except (redis.ConnectionError, redis.TimeoutError) as ssl_error:
                if redis_ssl and ("SSL" in str(ssl_error) or "wrong version" in str(ssl_error).lower()):
                    print(f"⚠️  SSL connection failed, trying without SSL...")
                    client = redis.Redis(
                        host=redis_host,
                        port=redis_port,
                        db=redis_db,
                        username=redis_username if redis_password else None,
                        password=redis_password,
                        decode_responses=True,
                        ssl=False,
                        socket_connect_timeout=5
                    )
                    client.ping()
                    print("✅ Connected without SSL")
                else:
                    raise
        
        # Test write/read
        print(f"\n🧪 Testing write/read...")
        test_key = "test:connection"
        test_value = f"test_{datetime.now().isoformat()}"
        client.setex(test_key, 60, test_value)
        retrieved = client.get(test_key)
        
        if retrieved == test_value:
            print("✅ Write/Read test successful")
            client.delete(test_key)
        else:
            print(f"❌ Write/Read test failed. Expected: {test_value}, Got: {retrieved}")
            return None
        
        return client
        
    except redis.AuthenticationError as e:
        print(f"\n❌ Authentication Error: {e}")
        print("\n💡 Troubleshooting:")
        print("  1. Check your Redis password")
        print("  2. For Redis Cloud, username should be 'default'")
        print("  3. Verify REDIS_USERNAME and REDIS_PASSWORD in .env")
        return None
    except redis.ConnectionError as e:
        print(f"\n❌ Connection Error: {e}")
        print("\n💡 Troubleshooting:")
        print("  1. Check if Redis server is running")
        print("  2. Verify host and port")
        print("  3. Check firewall settings")
        return None
    except Exception as e:
        print(f"\n❌ Unexpected Error: {e}")
        import traceback
        traceback.print_exc()
        return None

def check_redis_keys(client):
    """Check what keys exist in Redis"""
    print("\n" + "=" * 60)
    print("Redis Keys Analysis")
    print("=" * 60)
    
    try:
        # Get all keys
        all_keys = client.keys("*")
        
        if not all_keys:
            print("\n⚠️  No keys found in Redis database")
            print("   This could mean:")
            print("   - Data hasn't been written yet")
            print("   - Wrong database number (check REDIS_DB)")
            print("   - Keys expired")
            return
        
        print(f"\n📊 Found {len(all_keys)} keys:")
        
        # Group by prefix
        key_groups = {}
        for key in all_keys:
            prefix = key.split(":")[0] if ":" in key else "other"
            if prefix not in key_groups:
                key_groups[prefix] = []
            key_groups[prefix].append(key)
        
        for prefix, keys in sorted(key_groups.items()):
            print(f"\n   {prefix}: {len(keys)} keys")
            for key in keys[:5]:  # Show first 5
                ttl = client.ttl(key)
                ttl_str = f"TTL: {ttl}s" if ttl > 0 else "No expiry" if ttl == -1 else "Expired"
                print(f"      - {key} ({ttl_str})")
            if len(keys) > 5:
                print(f"      ... and {len(keys) - 5} more")
        
        # Check AQI specific keys
        print("\n" + "-" * 60)
        print("AQI Data Keys:")
        aqi_keys = [k for k in all_keys if "aqi" in k.lower() or "ward" in k.lower()]
        if aqi_keys:
            for key in aqi_keys[:10]:
                value_type = client.type(key)
                if value_type == "hash":
                    size = client.hlen(key)
                    print(f"   {key} (hash, {size} fields)")
                elif value_type == "list":
                    size = client.llen(key)
                    print(f"   {key} (list, {size} items)")
                elif value_type == "string":
                    size = len(client.get(key) or "")
                    print(f"   {key} (string, {size} bytes)")
                else:
                    print(f"   {key} ({value_type})")
        else:
            print("   ⚠️  No AQI-related keys found")
        
        # Check chat keys
        print("\n" + "-" * 60)
        print("Chat Keys:")
        chat_keys = [k for k in all_keys if "chat" in k.lower()]
        if chat_keys:
            for key in chat_keys[:10]:
                print(f"   {key}")
        else:
            print("   ⚠️  No chat-related keys found")
        
    except Exception as e:
        print(f"\n❌ Error checking keys: {e}")
        import traceback
        traceback.print_exc()

def check_aqi_data(client):
    """Check AQI data storage format"""
    print("\n" + "=" * 60)
    print("AQI Data Storage Check")
    print("=" * 60)
    
    try:
        # Look for hourly AQI keys (format: aqi:hourly:ward_{ward_no}:{date}:{hour})
        pattern = "aqi:hourly:*"
        keys = client.keys(pattern)
        
        if keys:
            print(f"\n✅ Found {len(keys)} hourly AQI keys")
            # Show sample
            sample_key = keys[0]
            print(f"\n   Sample key: {sample_key}")
            value = client.get(sample_key)
            if value:
                print(f"   Value: {value[:200]}...")  # First 200 chars
        else:
            print("\n⚠️  No hourly AQI keys found")
            print("   Expected pattern: aqi:hourly:ward_{ward_no}:{date}:{hour}")
        
        # Look for daily AQI keys
        pattern = "aqi:daily:*"
        keys = client.keys(pattern)
        if keys:
            print(f"\n✅ Found {len(keys)} daily AQI keys")
        else:
            print("\n⚠️  No daily AQI keys found")
        
    except Exception as e:
        print(f"\n❌ Error checking AQI data: {e}")

def main():
    """Main function"""
    client = test_redis_connection()
    
    if client:
        check_redis_keys(client)
        check_aqi_data(client)
        
        print("\n" + "=" * 60)
        print("How to Check Redis Database")
        print("=" * 60)
        print("\n📝 Methods to check Redis:")
        print("\n1. Using Redis CLI:")
        print("   redis-cli")
        print("   > KEYS *")
        print("   > GET <key>")
        print("   > HGETALL <hash_key>")
        print("   > LRANGE <list_key> 0 -1")
        print("\n2. Using this script:")
        print("   python3 test_redis_storage.py")
        print("\n3. Using Python:")
        print("   import redis")
        print("   r = redis.Redis(...)")
        print("   r.keys('*')")
        print("\n4. Redis Cloud Dashboard:")
        print("   - Log into Redis Cloud")
        print("   - Go to your database")
        print("   - Use 'CLI' or 'Browser' tab")
        print("\n" + "=" * 60)
    else:
        print("\n❌ Cannot proceed without Redis connection")

if __name__ == "__main__":
    main()
