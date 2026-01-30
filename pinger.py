import os
import requests
import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

# Load the environment variables from your Next.js env file locally
# This is ignored in GitHub Actions (which uses Secrets instead)
load_dotenv(dotenv_path=".env.local")

# These names must match your .env.local exactly
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") 

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found.")
    print("If running locally, check your .env.local file.")
    exit(1)

# Initialize Supabase Client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

def check_all_sites():
    # Use UTC for the log printout
    now_utc = datetime.datetime.now(datetime.timezone.utc)
    print(f"--- Starting Check: {now_utc.strftime('%Y-%m-%d %H:%M:%S')} UTC ---")
    
    # 1. Fetch all sites across all users (possible because of Service Role Key)
    try:
        response = supabase.table("sites").select("*").execute()
        sites = response.data
    except Exception as e:
        print(f"Database error: {e}")
        return

    if not sites:
        print("No sites found in database.")
        return

    for site in sites:
        url = site['url']
        site_id = site['id']
        
        # Ensure URL starts with http to prevent request errors
        if not url.startswith('http'):
            url = f"https://{url}"
        
        try:
            # 2. Perform the request
            # We use a timeout so one slow site doesn't hang the whole script
            res = requests.get(
                url, 
                headers={'User-Agent': 'StillUp-Bot/1.0 (Uptime Monitor)'}, 
                timeout=15
            )
            # Consider 2xx and 3xx as "UP"
            status = 'up' if 200 <= res.status_code < 400 else 'down'
            print(f"Checked {url}: {status.upper()} ({res.status_code})")
        except Exception as e:
            status = 'down'
            print(f"Checked {url}: DOWN (Error: {type(e).__name__})")

        # 3. Update both status and the timestamp in UTC
        # .isoformat() is required for Postgres TIMESTAMPTZ columns
        try:
            supabase.table("sites").update({
                "status": status,
                "last_checked_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
            }).eq("id", site_id).execute()
        except Exception as e:
            print(f"Failed to update database for {url}: {e}")

if __name__ == "__main__":
    check_all_sites()
    print("--- Check Complete ---")