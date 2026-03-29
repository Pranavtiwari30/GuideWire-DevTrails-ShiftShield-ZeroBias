from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config   import settings
from app.database import connect_db, close_db
from app.routes   import shift, claim


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title="ShiftShield API",
    description="Parametric micro-insurance for food delivery partners",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.cors_origin] if settings.cors_origin != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(shift.router)
app.include_router(claim.router)


@app.get("/health")
async def health():
    return {
        "status":  "ok",
        "service": "ShiftShield API",
        "version": "1.0.0",
    }