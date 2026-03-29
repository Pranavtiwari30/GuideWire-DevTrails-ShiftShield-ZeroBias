from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

client: AsyncIOMotorClient = None

async def connect_db():
    global client
    client = AsyncIOMotorClient(settings.mongodb_uri)
    print(f"[DB] Connected to MongoDB Atlas → {settings.db_name}")

async def close_db():
    global client
    if client:
        client.close()
        print("[DB] MongoDB connection closed")

def get_db():
    return client[settings.db_name]
