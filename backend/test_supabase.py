from supabase import create_client
import sys
import os

# Add the backend path to sys.path so we can import app.core.config
sys.path.append('d:/FinStock/backend')

try:
    from app.core.config import get_settings
    settings = get_settings()
    
    print(f"Connecting to: {settings.supabase_url}")
    # Using the key from the .env to test connection
    supabase = create_client(settings.supabase_url, settings.supabase_key)
    
    # Try to fetch from profiles
    res = supabase.table("profiles").select("*").limit(1).execute()
    print("Connection successful! Profiles table found.")
    print(f"Current rows in profiles: {len(res.data)}")
    
except Exception as e:
    print(f"Connection failed: {e}")
