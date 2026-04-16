import random
from datetime import datetime, timezone, timedelta
from uuid import uuid4
from fastapi import APIRouter, HTTPException
from app.database import get_db
from app.engine.sms import send_otp
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/rider", tags=["Rider"])

class RegisterRiderRequest(BaseModel):
    name: str
    phone: str
    pincode: str
    city: str
    zone_type: str = "metro_suburb"  # metro_core, metro_suburb, tier2, rural
    vehicle_type: str = "bike"
    upi_id: Optional[str] = None

def _new_rider_id() -> str:
    return f"RDR-{uuid4().hex[:8].upper()}"

@router.post("/register", status_code=201)
async def register_rider(body: RegisterRiderRequest):
    if not body.pincode.isdigit() or len(body.pincode) != 6:
        raise HTTPException(status_code=400, detail="pincode must be 6 digits")
    if not body.phone.isdigit() or len(body.phone) != 10:
        raise HTTPException(status_code=400, detail="phone must be 10 digits")

    db = get_db()

    existing = await db.riders.find_one({"phone": body.phone})
    if existing:
        raise HTTPException(status_code=409, detail=f"Rider with phone {body.phone} already registered")

    rider_id = _new_rider_id()
    now = datetime.now(timezone.utc)

    doc = {
        "rider_id":     rider_id,
        "name":         body.name,
        "phone":        body.phone,
        "pincode":      body.pincode,
        "city":         body.city,
        "zone_type":    body.zone_type,
        "vehicle_type": body.vehicle_type,
        "upi_id":       body.upi_id,
        "status":       "ACTIVE",
        "created_at":   now,
    }
    await db.riders.insert_one(doc)

    return {
        "rider_id":   rider_id,
        "name":       body.name,
        "phone":      body.phone,
        "zone_type":  body.zone_type,
        "status":     "ACTIVE",
        "created_at": now.isoformat(),
        "message":    "Rider registered successfully.",
    }

class UpdateRiderRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    pincode: Optional[str] = None
    city: Optional[str] = None
    zone_type: Optional[str] = None
    vehicle_type: Optional[str] = None
    upi_id: Optional[str] = None

class ForgotIdRequest(BaseModel):
    phone: str

class VerifyOtpRequest(BaseModel):
    phone: str
    otp: str

@router.patch("/{rider_id}")
async def update_rider(rider_id: str, body: UpdateRiderRequest):
    db = get_db()
    doc = await db.riders.find_one({"rider_id": rider_id})
    if not doc:
        raise HTTPException(status_code=404, detail=f"Rider {rider_id} not found")

    updates: dict = {}
    if body.name is not None:
        updates["name"] = body.name
    if body.phone is not None:
        if not body.phone.isdigit() or len(body.phone) != 10:
            raise HTTPException(status_code=400, detail="phone must be 10 digits")
        existing = await db.riders.find_one({"phone": body.phone, "rider_id": {"$ne": rider_id}})
        if existing:
            raise HTTPException(status_code=409, detail="This phone number is already registered to another rider")
        updates["phone"] = body.phone
    if body.pincode is not None:
        if not body.pincode.isdigit() or len(body.pincode) != 6:
            raise HTTPException(status_code=400, detail="pincode must be 6 digits")
        updates["pincode"] = body.pincode
    if body.city is not None:
        updates["city"] = body.city
    if body.zone_type is not None:
        updates["zone_type"] = body.zone_type
    if body.vehicle_type is not None:
        updates["vehicle_type"] = body.vehicle_type
    if body.upi_id is not None:
        updates["upi_id"] = body.upi_id

    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    updates["updated_at"] = datetime.now(timezone.utc)
    await db.riders.update_one({"rider_id": rider_id}, {"$set": updates})

    updated = await db.riders.find_one({"rider_id": rider_id})
    return {
        "rider_id":     updated["rider_id"],
        "name":         updated["name"],
        "phone":        updated["phone"],
        "pincode":      updated["pincode"],
        "city":         updated["city"],
        "zone_type":    updated["zone_type"],
        "vehicle_type": updated["vehicle_type"],
        "upi_id":       updated.get("upi_id"),
        "status":       updated["status"],
        "message":      "Profile updated successfully.",
    }

@router.post("/forgot-id")
async def forgot_rider_id(body: ForgotIdRequest):
    if not body.phone.isdigit() or len(body.phone) != 10:
        raise HTTPException(status_code=400, detail="phone must be 10 digits")

    db = get_db()
    rider = await db.riders.find_one({"phone": body.phone})
    if not rider:
        raise HTTPException(status_code=404, detail="No rider found with this phone number")

    otp = f"{random.randint(100000, 999999)}"
    now = datetime.now(timezone.utc)

    await db.otp_sessions.delete_many({"phone": body.phone})
    await db.otp_sessions.insert_one({
        "phone": body.phone,
        "otp": otp,
        "created_at": now,
    })

    masked = body.phone[:2] + "****" + body.phone[-4:]
    await send_otp(body.phone, otp)
    return {
        "message": f"OTP sent to {masked}",
        "masked_phone": masked,
    }

@router.post("/verify-otp")
async def verify_otp(body: VerifyOtpRequest):
    if not body.phone.isdigit() or len(body.phone) != 10:
        raise HTTPException(status_code=400, detail="phone must be 10 digits")

    db = get_db()
    session = await db.otp_sessions.find_one({"phone": body.phone})
    if not session:
        raise HTTPException(status_code=400, detail="No OTP requested for this number — request one first")

    age = datetime.now(timezone.utc) - session["created_at"].replace(tzinfo=timezone.utc)
    if age > timedelta(minutes=5):
        await db.otp_sessions.delete_one({"phone": body.phone})
        raise HTTPException(status_code=400, detail="OTP expired — request a new one")

    if session["otp"] != body.otp.strip():
        raise HTTPException(status_code=400, detail="Incorrect OTP")

    await db.otp_sessions.delete_one({"phone": body.phone})

    rider = await db.riders.find_one({"phone": body.phone})
    if not rider:
        raise HTTPException(status_code=404, detail="Rider not found")

    return {
        "rider_id": rider["rider_id"],
        "name": rider["name"],
        "message": "OTP verified",
    }

@router.delete("/{rider_id}", status_code=200)
async def delete_rider(rider_id: str):
    db = get_db()
    doc = await db.riders.find_one({"rider_id": rider_id})
    if not doc:
        raise HTTPException(status_code=404, detail=f"Rider {rider_id} not found")

    await db.riders.delete_one({"rider_id": rider_id})
    await db.shifts.delete_many({"rider_id": rider_id})
    await db.claims.delete_many({"rider_id": rider_id})
    await db.otp_sessions.delete_many({"phone": doc.get("phone", "")})

    return {"message": "Account and all associated data deleted successfully."}

@router.get("/{rider_id}")
async def get_rider(rider_id: str):
    db  = get_db()
    doc = await db.riders.find_one({"rider_id": rider_id})
    if not doc:
        raise HTTPException(status_code=404, detail=f"Rider {rider_id} not found")

    return {
        "rider_id":     doc["rider_id"],
        "name":         doc["name"],
        "phone":        doc["phone"],
        "pincode":      doc["pincode"],
        "city":         doc["city"],
        "zone_type":    doc["zone_type"],
        "vehicle_type": doc["vehicle_type"],
        "upi_id":       doc.get("upi_id"),
        "status":       doc["status"],
        "created_at":   doc["created_at"].isoformat(),
    }