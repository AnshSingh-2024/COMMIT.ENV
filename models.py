from pydantic import BaseModel, Field
from bson import ObjectId # <--- ADD THIS IMPORT
from typing import Optional, List
from passlib.context import CryptContext
from datetime import datetime # <--- ADD THIS IMPORT

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
    points: int = 0
    role: str = "user"  # <-- Add role field (e.g., "user", "moderator")
    anonymous_alias: str = ""  # <-- Add field for anonymous name

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

# --- Garden Models ---

class PlantRecommendation(BaseModel):
    title: str
    steps: List[str]
    purchasable_items: Optional[List[str]] = []

class PlantHistoryEntry(BaseModel):
    entry_id: str = Field(default_factory=lambda: str(ObjectId()))
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    image_path: str
    diagnosis: str
    recommendations: List[PlantRecommendation]

class Plant(BaseModel):
    id: str = Field(alias="_id", default_factory=lambda: str(ObjectId()))
    user_id: str
    plant_name: str
    history: List[PlantHistoryEntry] = []

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


class InventoryItemUpdate(BaseModel):
    item_name: str
    change: int


class IngredientsList(BaseModel):
    ingredients: List[str]

class PlantCreate(BaseModel):
    plant_name: str

class CommunityRecipeIngredient(BaseModel):
    name: str
    quantity: str

class CommunityRecipe(BaseModel):
    id: str = Field(alias="_id", default_factory=lambda: str(ObjectId()))
    user_id: str
    author_name: str
    recipe_name: str
    description: str
    diet_type: str  # "Veg", "Non-Veg", etc.
    ingredients: List[CommunityRecipeIngredient]
    instructions: List[str]
    upvotes: int = 0
    upvoted_by: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class ForumAnswer(BaseModel):
    id: str = Field(alias="_id", default_factory=lambda: str(ObjectId()))
    user_id: str
    author_alias: str  # <-- Changed from author_name
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ForumPost(BaseModel):
    id: str = Field(alias="_id", default_factory=lambda: str(ObjectId()))
    user_id: str
    author_alias: str
    title: str
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    answers: List[ForumAnswer] = []

class Config:
    populate_by_name = True
    json_encoders = {ObjectId: str}

class CommunityRecipeCreate(BaseModel):
    author_name: str
    recipe_name: str
    description: str
    diet_type: str
    ingredients: List[CommunityRecipeIngredient]
    instructions: List[str]

class ForumPostCreate(BaseModel):
    title: str
    content: str

class ForumAnswerCreate(BaseModel):
    content: str

class GardenChatPayload(BaseModel):
    prompt: str

class MealPlanEntry(BaseModel):
    day_of_week: str  # e.g., "Monday"
    meal_type: str    # e.g., "Lunch"
    recipe_name: str
    recipe_ingredients: List[str] # Storing ingredients for the shopping list

class MealPlan(BaseModel):
    id: str = Field(alias="_id", default_factory=lambda: str(ObjectId()))
    user_id: str
    entries: List[MealPlanEntry] = []

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

