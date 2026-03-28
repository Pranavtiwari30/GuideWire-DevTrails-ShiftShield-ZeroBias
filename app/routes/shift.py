from fastapi import APIRouter, Depends
from app.engine.scoring import score_shift

router = APIRouter()

@router.post("/shift/start")
async def start_shift(shift_data):
    score = score_shift(shift_data)
    return {"score": score}
