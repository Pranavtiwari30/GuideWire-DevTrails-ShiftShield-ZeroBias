import os
import httpx

FAST2SMS_KEY = os.getenv("FAST2SMS_API_KEY", "")


async def send_otp(phone: str, otp: str) -> bool:
    """
    Send OTP via Fast2SMS (India). Returns True on success.
    Falls back to server log when FAST2SMS_API_KEY is not set (local dev).
    """
    if not FAST2SMS_KEY:
        print(f"[SMS] FAST2SMS_API_KEY not set — OTP for {phone}: {otp}")
        return False

    try:
        async with httpx.AsyncClient(timeout=5) as client:
            r = await client.post(
                "https://www.fast2sms.com/dev/bulkV2",
                headers={"authorization": FAST2SMS_KEY},
                json={
                    "route": "otp",
                    "variables_values": otp,
                    "numbers": phone,
                },
            )
            data = r.json()
            if data.get("return") is True:
                return True
            print(f"[SMS] Fast2SMS error: {data}")
            return False
    except Exception as e:
        print(f"[SMS] Failed to send OTP to {phone}: {e}")
        return False
