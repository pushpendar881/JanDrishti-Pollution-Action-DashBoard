
import os
from dotenv import load_dotenv
from supabase import create_client, Client
import uuid

load_dotenv()

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

try:
    # Need a valid user_id. We can't fake it easily if there is a foreign key constraint to auth.users.
    # But usually RLS is on, checking auth.uid().
    # Using the service key allows bypassing RLS.
    # SUPABASE_SERVICE_KEY should be used for admin tasks.
    
    service_key = os.getenv("SUPABASE_SERVICE_KEY")
    admin_supabase = create_client(supabase_url, service_key)
    
    # We need a user ID. Let's try to get one from existing messages or profiles.
    # Or just try to insert with a random UUID and see if it fails on FK.
    # Note: If foreign key is to auth.users, we can't insert a random UUID.
    
    # Let's try to fetch a real user ID first
    existing = admin_supabase.table("profiles").select("id").limit(1).execute()
    if not existing.data:
        print("No users found to test with.")
        exit(1)
        
    user_id = existing.data[0]['id']
    print(f"Testing with user_id: {user_id}")

    # Test User Message Insert
    print("Inserting USER message...")
    user_msg = {
        "user_id": user_id,
        "message": "Test message from script",
        "type": "user"
    }
    res1 = admin_supabase.table("chat_messages").insert(user_msg).execute()
    print("User message inserted:", res1.data[0]['id'])

    # Test Bot Message Insert
    print("Inserting BOT message...")
    bot_msg = {
        "user_id": user_id,
        "message": "Test message from script",
        "response": "This is a test response",
        "type": "bot"
    }
    res2 = admin_supabase.table("chat_messages").insert(bot_msg).execute()
    print("Bot message inserted:", res2.data[0]['id'])
    
    print("SUCCESS: Database schema accepts bot messages.")

except Exception as e:
    print(f"FAILED: {e}")
