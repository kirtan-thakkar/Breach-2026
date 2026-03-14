from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.api.v1.api import api_router

settings = get_settings()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

import logging
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

try:
    from postgrest.exceptions import APIError as SupabaseAPIError
except ImportError:
    SupabaseAPIError = None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global Error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please check logs.", "error": str(exc)},
    )

if SupabaseAPIError:
    @app.exception_handler(SupabaseAPIError)
    async def supabase_exception_handler(request: Request, exc):
        logger.error(f"Supabase Error: {exc}", exc_info=True)
        return JSONResponse(
            status_code=400,
            content={"detail": "Database operation failed", "error": str(exc)},
        )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"Validation Error: {exc.errors()}", exc_info=True)
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body},
    )

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {"message": "Welcome to AttackSimulator API", "status": "healthy", "version": "1.0.0-hackathon"}

@app.get("/health")
async def health_check():
    # Basic check for DB connectivity could be added here
    return {"status": "ok", "timestamp": "now()"}
