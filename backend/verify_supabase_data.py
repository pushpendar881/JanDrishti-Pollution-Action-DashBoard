#!/usr/bin/env python3
"""
Script to verify Supabase data storage and edge function execution
"""
import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client
from datetime import datetime, timedelta
import json

load_dotenv()

def get_supabase_client() -> Client:
    """Initialize Supabase client"""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        print("❌ SUPABASE_URL and SUPABASE_KEY must be set in environment variables")
        sys.exit(1)
    
    return create_client(supabase_url, supabase_key)

def check_aqi_cache(supabase: Client):
    """Check aqi_cache table for recent data"""
    print("\n" + "=" * 70)
    print("Checking aqi_cache Table")
    print("=" * 70)
    
    try:
        # Get the most recent cache entry
        response = supabase.table("aqi_cache")\
            .select("*")\
            .order("id", desc=True)\
            .limit(1)\
            .execute()
        
        if response.data and len(response.data) > 0:
            cache_entry = response.data[0]
            print(f"✅ Found cache entry (ID: {cache_entry['id']})")
            print(f"   Generated at: {cache_entry['generated_at']}")
            if 'created_at' in cache_entry:
                print(f"   Created at: {cache_entry['created_at']}")
            
            # Check how old the data is
            generated_at = datetime.fromisoformat(cache_entry['generated_at'].replace('Z', '+00:00'))
            age_hours = (datetime.now(generated_at.tzinfo) - generated_at).total_seconds() / 3600
            print(f"   Age: {age_hours:.1f} hours")
            
            if age_hours > 2:
                print(f"   ⚠️  Data is {age_hours:.1f} hours old. Edge function may not be running.")
            else:
                print(f"   ✅ Data is fresh (less than 2 hours old)")
            
            # Check data structure
            data = cache_entry.get('data', {})
            if isinstance(data, dict):
                stations = data.get('stations', [])
                summary = data.get('summary', {})
                wards = data.get('wards', {})
                
                print(f"\n   Data Structure:")
                print(f"   - Stations: {len(stations) if isinstance(stations, list) else 'N/A'}")
                print(f"   - Summary: {summary}")
                print(f"   - Wards: {'Present' if wards else 'Not populated'}")
                
                if isinstance(stations, list) and len(stations) > 0:
                    print(f"\n   Sample Station:")
                    sample = stations[0]
                    print(f"   - Name: {sample.get('name', 'N/A')}")
                    print(f"   - AQI: {sample.get('aqi', 'N/A')}")
                    print(f"   - Location: ({sample.get('lat', 'N/A')}, {sample.get('lon', 'N/A')})")
            else:
                print(f"   ⚠️  Data is not in expected format")
        else:
            print("❌ No cache entries found")
            print("   This means the edge function has not run yet or failed to store data.")
            print("   You can manually trigger it by calling:")
            print("   curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/fetch-aqi-stations")
    
    except Exception as e:
        print(f"❌ Error checking aqi_cache: {e}")
        import traceback
        traceback.print_exc()

def check_ward_aqi_daily(supabase: Client):
    """Check ward_aqi_daily table for daily averages"""
    print("\n" + "=" * 70)
    print("Checking ward_aqi_daily Table")
    print("=" * 70)
    
    try:
        # Get recent daily averages
        response = supabase.table("ward_aqi_daily")\
            .select("*")\
            .order("date", desc=True)\
            .limit(10)\
            .execute()
        
        if response.data and len(response.data) > 0:
            print(f"✅ Found {len(response.data)} daily average records")
            
            # Group by date
            by_date = {}
            for record in response.data:
                date_str = record['date']
                if date_str not in by_date:
                    by_date[date_str] = []
                by_date[date_str].append(record)
            
            print(f"\n   Records by date:")
            for date_str in sorted(by_date.keys(), reverse=True)[:5]:
                records = by_date[date_str]
                print(f"   - {date_str}: {len(records)} wards")
                for rec in records:
                    print(f"     • {rec['ward_name']} ({rec['ward_no']}): AQI {rec['avg_aqi']:.1f}")
            
            # Check if we have data for today
            today = date.today().isoformat()
            today_data = [r for r in response.data if r['date'] == today]
            if today_data:
                print(f"\n   ✅ Today's data ({today}): {len(today_data)} wards")
            else:
                print(f"\n   ⚠️  No data for today ({today})")
                print(f"   The daily average calculation job may not have run yet.")
        else:
            print("❌ No daily average records found")
            print("   This means the daily average calculation job has not run yet.")
            print("   You can manually trigger it via:")
            print("   curl -X POST http://localhost:8000/api/aqi/scheduler/trigger/daily")
    
    except Exception as e:
        print(f"❌ Error checking ward_aqi_daily: {e}")
        import traceback
        traceback.print_exc()

def check_selected_wards(supabase: Client):
    """Check selected_wards table"""
    print("\n" + "=" * 70)
    print("Checking selected_wards Table")
    print("=" * 70)
    
    try:
        response = supabase.table("selected_wards")\
            .select("*")\
            .eq("is_active", True)\
            .execute()
        
        if response.data and len(response.data) > 0:
            print(f"✅ Found {len(response.data)} active wards:")
            for ward in response.data:
                print(f"   - {ward['ward_name']} ({ward['ward_no']}) - {ward['quadrant']}")
                print(f"     Location: ({ward['latitude']}, {ward['longitude']})")
        else:
            print("❌ No active wards found")
            print("   Run the schema SQL to insert the 4 selected wards.")
    
    except Exception as e:
        print(f"❌ Error checking selected_wards: {e}")
        import traceback
        traceback.print_exc()

def check_edge_function_status():
    """Check if edge function can be called"""
    print("\n" + "=" * 70)
    print("Edge Function Status")
    print("=" * 70)
    
    supabase_url = os.getenv("SUPABASE_URL")
    if not supabase_url:
        print("❌ SUPABASE_URL not set")
        return
    
    # Extract project ref from URL
    try:
        project_ref = supabase_url.split("//")[1].split(".")[0]
        edge_function_url = f"{supabase_url}/functions/v1/fetch-aqi-stations"
        print(f"   Edge Function URL: {edge_function_url}")
        print(f"   Project Reference: {project_ref}")
        print(f"\n   To manually trigger the edge function:")
        print(f"   curl -X POST {edge_function_url} \\")
        print(f"     -H 'Authorization: Bearer YOUR_ANON_KEY' \\")
        print(f"     -H 'Content-Type: application/json'")
        print(f"\n   To check if pg_cron is scheduled:")
        print(f"   Run in Supabase SQL Editor: SELECT * FROM cron.job;")
    except Exception as e:
        print(f"   ⚠️  Could not parse SUPABASE_URL: {e}")

def main():
    """Main verification function"""
    print("=" * 70)
    print("Supabase Data Verification")
    print("=" * 70)
    
    supabase = get_supabase_client()
    
    check_selected_wards(supabase)
    check_aqi_cache(supabase)
    check_ward_aqi_daily(supabase)
    check_edge_function_status()
    
    print("\n" + "=" * 70)
    print("Verification Complete")
    print("=" * 70)
    print("\n📝 Next Steps:")
    print("1. If aqi_cache is empty, trigger the edge function manually")
    print("2. If ward_aqi_daily is empty, trigger daily calculation:")
    print("   curl -X POST http://localhost:8000/api/aqi/scheduler/trigger/daily")
    print("3. To schedule edge function via pg_cron, run the SQL in:")
    print("   supabase/migrations/002_setup_pg_cron.sql")
    print("   (Replace YOUR_PROJECT_REF and YOUR_ANON_KEY)")

if __name__ == "__main__":
    from datetime import date
    main()
