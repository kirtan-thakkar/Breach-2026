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
    EMAIL_ENABLED = os.getenv("EMAIL_ENABLED", "false").lower() == "true"
    EMAIL_DRY_RUN = os.getenv("EMAIL_DRY_RUN", "true").lower() == "true"
    EMAIL_FROM_ADDRESS = os.getenv("EMAIL_FROM_ADDRESS", "no-reply@example.com")
    EMAIL_FROM_NAME = os.getenv("EMAIL_FROM_NAME", "AttackSimulator")
    SMTP_HOST = os.getenv("SMTP_HOST")
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME = os.getenv("SMTP_USERNAME")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
    SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
    SMTP_USE_SSL = os.getenv("SMTP_USE_SSL", "false").lower() == "true"
    SMTP_TIMEOUT_SECONDS = float(os.getenv("SMTP_TIMEOUT_SECONDS", "20"))
    EMAIL_MAX_RETRIES = int(os.getenv("EMAIL_MAX_RETRIES", "3"))
    EMAIL_BASE_RETRY_SECONDS = float(os.getenv("EMAIL_BASE_RETRY_SECONDS", "1.0"))
    EMAIL_BATCH_CONCURRENCY = int(os.getenv("EMAIL_BATCH_CONCURRENCY", "8"))

def get_settings():
    return Settings()
