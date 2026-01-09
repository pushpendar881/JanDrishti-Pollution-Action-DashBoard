
import os
from dotenv import load_dotenv
from supabase import create_client, Client
import datetime

load_dotenv()

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

print(f"URL: {supabase_url}")
print(f"Key found: {'Yes' if supabase_key else 'No'}")

try:
    supabase: Client = create_client(supabase_url, supabase_key)
    
    # Try to select from chat_messages
    print("Testing read from chat_messages...")
    response = supabase.table("chat_messages").select("*").limit(1).execute()
    print("Read success!")
    print(response)

except Exception as e:
    print(f"Error: {e}")
