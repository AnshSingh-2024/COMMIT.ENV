from pydantic import BaseModel, Field, EmailStr
from bson import ObjectId
from typing import Optional
from passlib.context import CryptContext

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

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
        arbitrary_types_allowed = True


class RecipePayload(BaseModel):
    Diet: Optional[str] = "Veg"
    Cuisine: Optional[str] = "Indian"
    Difficulty: Optional[str] = "Medium"
    TimeAvailable: Optional[int] = 30  # Expected in minutes
    Shopping: Optional[bool] = False
    Serving: Optional[int] = 1

class User(BaseModel):
    id: str = Field(alias="_id", default_factory=lambda: str(ObjectId()))
    name: str
    email: EmailStr
    password: str
    dietary_preference: str # Veg/Non-Veg/Custom

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}
        arbitrary_types_allowed = True

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    dietary_preference: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)
