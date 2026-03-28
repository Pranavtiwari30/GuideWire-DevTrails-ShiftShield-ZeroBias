from app import app
from app.routes.shift import router as shift_router
from app.routes.claim import router as claim_router
from app.routes.status import router as status_router

app.include_router(shift_router)
app.include_router(claim_router)
app.include_router(status_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
