from pydantic import BaseModel, Field
from bson import ObjectId
from typing import Optional
from passlib.context import CryptContext

# --- Password Hashing ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


# --- Database Models ---
class User(BaseModel):
    id: str = Field(alias="_id", default_factory=lambda: str(ObjectId()))
    name: str
    email: str
    hashed_password: str
    dietary_preference: Optional[str] = "Veg"

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


class InventoryItem(BaseModel):
    item_name: str
    quantity: int


class UserInventory(BaseModel):
    id: str = Field(alias="_id", default_factory=lambda: str(ObjectId()))
    user_id: str
    items: list[InventoryItem] = []

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


# --- API Payload Models ---
class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    dietary_preference: Optional[str] = "Veg"


class UserLogin(BaseModel):
    email: str
    password: str


class RecipePayload(BaseModel):
    Diet: Optional[str] = "Veg"
    Cuisine: Optional[str] = "Indian"
    Difficulty: Optional[str] = "Medium"
    TimeAvailable: Optional[int] = 30
    Shopping: Optional[bool] = False
    Serving: Optional[int] = 1


class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str


class PreferenceUpdate(BaseModel):
    dietary_preference: str