import os
from dotenv import load_dotenv
load_dotenv()
class Settings:
    PROJECT_NAME = "AttackSimulator"
    API_V1_STR = "/api/v1"
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    JWT_SECRET = os.getenv("JWT_SECRET")

def get_settings():
    return Settings()
