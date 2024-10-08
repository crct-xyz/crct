import logging
from fastapi import FastAPI, Response, Request
from app.api.main import api_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Squint-API",
)

# CORS configuration
origins = ["*"]  # Use specific origins in production instead of "*"

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods
    allow_headers=["*"],  # Allows all headers
    expose_headers=["X-Action-Version", "X-Blockchain-Ids"],
)


# Custom middleware to append required headers to every response
@app.middleware("http")
async def add_custom_headers(request: Request, call_next):
    response = await call_next(request)
    origin = request.headers.get("origin")
    if origin in origins:
        response.headers["Access-Control-Allow-Origin"] = origin
    # Add the required custom headers if not already present
    response.headers["X-Action-Version"] = "2.1.3"
    response.headers["X-Blockchain-Ids"] = (
        "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp, solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1"
    )
    return response


# Configure logging
logging.basicConfig(
    level=logging.DEBUG,  # Change to INFO or WARNING in production
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Include API router
app.include_router(api_router)
