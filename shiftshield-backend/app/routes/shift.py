from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from app.database import get_db
from app.schemas import StartShiftRequest, StartShiftResponse

router = APIRouter(prefix="/shift", tags=["Shift"])


def _new_shift_id() -> str:
    return f"SHF-{uuid4().hex[:8].upper()}"


@router.post("/start", response_model=StartShiftResponse, status_code=201)
async def start_shift(body: StartShiftRequest):
    if not body.pincode.isdigit() or len(body.pincode) != 6:
        raise HTTPException(status_code=400, detail="pincode must be a 6-digit Indian postal code")

    db = get_db()

    existing = await db.shifts.find_one({"rider_id": body.rider_id, "status": "ACTIVE"})
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"Rider {body.rider_id} already has active shift: {existing['shift_id']}",
        )

    shift_start = (
        datetime.fromisoformat(body.shift_start.replace("Z", "+00:00"))
        if body.shift_start
        else datetime.now(timezone.utc)
    )

    shift_id = _new_shift_id()
    doc = {
        "shift_id":    shift_id,
        "rider_id":    body.rider_id,
        "pincode":     body.pincode,
        "shift_start": shift_start,
        "status":      "ACTIVE",
        "created_at":  datetime.now(timezone.utc),
    }
    await db.shifts.insert_one(doc)

    return StartShiftResponse(
        shift_id=shift_id,
        rider_id=body.rider_id,
        pincode=body.pincode,
        shift_start=shift_start.isoformat(),
        status="ACTIVE",
        message="Coverage activated. ShiftShield is monitoring your shift.",
    )


@router.post("/end")
async def end_shift(body: dict):
    shift_id = body.get("shift_id")
    rider_id = body.get("rider_id")

    if not shift_id or not rider_id:
        raise HTTPException(status_code=400, detail="shift_id and rider_id are required")

    db  = get_db()
    doc = await db.shifts.find_one({"shift_id": shift_id, "rider_id": rider_id})
    if not doc:
        raise HTTPException(status_code=404, detail=f"Shift {shift_id} not found")
    if doc["status"] == "ENDED":
        raise HTTPException(status_code=409, detail=f"Shift {shift_id} already ended")

    now = datetime.now(timezone.utc)
    await db.shifts.update_one(
        {"shift_id": shift_id},
        {"$set": {"status": "ENDED", "shift_end": now}},
    )

    return {
        "shift_id":    shift_id,
        "rider_id":    rider_id,
        "status":      "ENDED",
        "shift_start": doc["shift_start"].isoformat(),
        "shift_end":   now.isoformat(),
        "message":     "Shift ended. Coverage deactivated.",
    }


@router.get("/{rider_id}/active")
async def get_active_shift(rider_id: str):
    db  = get_db()
    doc = await db.shifts.find_one({"rider_id": rider_id, "status": "ACTIVE"})
    if not doc:
        raise HTTPException(status_code=404, detail=f"No active shift for rider {rider_id}")

    return {
        "shift_id":    doc["shift_id"],
        "rider_id":    doc["rider_id"],
        "pincode":     doc["pincode"],
        "shift_start": doc["shift_start"].isoformat(),
        "status":      doc["status"],
    }