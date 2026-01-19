from datetime import datetime, timedelta
import os
import uuid

from fastapi import Depends, FastAPI, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

SECRET = os.getenv("JWT_SECRET", "dev-secret")
ALGO = "HS256"
MONGO_URL = os.getenv("MONGO_URL", "mongodb://mongo:27017")
DB_NAME = os.getenv("DB_NAME", "freelas")

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="auth-service")


class UserBase(BaseModel):
    name: str
    email: str
    phone: str
    user_type: int  # 1 = provider, 2 = client


class UserCreate(UserBase):
    password: str


class User(UserBase):
    id: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user_type: int
    user_data: User


class Login(BaseModel):
    email: str
    password: str


@app.get("/healthz")
async def health():
    return {"status": "ok", "service": "auth"}


def create_token(data: dict, expires: timedelta = timedelta(hours=24)) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + expires
    return jwt.encode(payload, SECRET, algorithm=ALGO)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> User:
    try:
        payload = jwt.decode(credentials.credentials, SECRET, algorithms=[ALGO])
        user_id: str | None = payload.get("sub")
    except JWTError:
        user_id = None
    if not user_id:
        raise HTTPException(status_code=401, detail="invalid token")
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="invalid token")
    return User(**user)


@app.post("/auth/register", response_model=Token)
async def register(data: UserCreate):
    if await db.users.find_one({"email": data.email}):
        raise HTTPException(status_code=400, detail="email already registered")
    user = User(
        id=str(uuid.uuid4()),
        name=data.name,
        email=data.email,
        phone=data.phone,
        user_type=data.user_type,
    )
    doc = user.dict()
    doc["hashed_password"] = pwd.hash(data.password)
    doc["created_at"] = datetime.utcnow()
    await db.users.insert_one(doc)
    token = create_token({"sub": user.id, "user_type": user.user_type})
    return Token(
        access_token=token,
        token_type="bearer",
        user_type=user.user_type,
        user_data=user,
    )


@app.post("/auth/login", response_model=Token)
async def login(data: Login):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not pwd.verify(data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="invalid credentials")
    token = create_token({"sub": user["id"], "user_type": user["user_type"]})
    user_obj = User(**{k: user[k] for k in ["id", "name", "email", "phone", "user_type"]})
    return Token(
        access_token=token,
        token_type="bearer",
        user_type=user["user_type"],
        user_data=user_obj,
    )


@app.get("/auth/me", response_model=User)
async def me(current: User = Depends(get_current_user)):
    return current
