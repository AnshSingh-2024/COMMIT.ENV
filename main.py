import os
import io
import json
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import dotenv
import google.generativeai as genai
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Body
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient
from PIL import Image
from models import UserInventory, InventoryItem, RecipePayload, User, UserCreate, UserLogin, get_password_hash, \
    verify_password
from fastapi.middleware.cors import CORSMiddleware
from bson import ObjectId

# --- Configuration & Initialization ---
creds = dotenv.dotenv_values(".env")
MONGO_URI = creds["mongoURI"]
GOOGLE_API_KEY = creds['apikey']

if not GOOGLE_API_KEY:
    raise ValueError("No GOOGLE_API_KEY set. Please set the environment variable.")
if not MONGO_URI:
    raise ValueError("No MONGO_URI set. Please set the environment variable.")

# Configure Gemini
genai.configure(api_key=GOOGLE_API_KEY)

# This is a dictionary that will hold our database connection
db = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    # On startup, connect to the database
    db["client"] = AsyncIOMotorClient(MONGO_URI)
    db["inventory_db"] = db["client"].inventoryDB  # Database named inventoryDB
    print("Successfully connected to MongoDB.")
    yield
    # On shutdown, close the connection
    db["client"].close()
    print("MongoDB connection closed.")


app = FastAPI(
    title="Gemini Vision Inventory API with MongoDB",
    description="Upload an image to identify items and maintain a persistent user inventory.",
    version="1.2.0",
    lifespan=lifespan  # Use the lifespan context manager
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# --- Gemini Model ---
model = genai.GenerativeModel('gemini-2.5-flash')


# --- User Authentication Endpoints ---

@app.post("/signup", summary="Create a new user", response_description="User created successfully.")
async def signup(user_data: UserCreate):
    users_collection = db["inventory_db"].users
    existing_user = await users_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user_data.password)
    # Pydantic model dump is not directly insertable, need to convert to dict
    user_dict = user_data.model_dump()
    user_dict['password'] = hashed_password

    result = await users_collection.insert_one(user_dict)

    return {"message": "User created successfully", "user_id": str(result.inserted_id)}


@app.post("/login", summary="Login a user", response_description="Login successful.")
async def login(user_data: UserLogin):
    users_collection = db["inventory_db"].users
    user = await users_collection.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return {"message": "Login successful", "user_id": str(user["_id"]), "name": user["name"]}


@app.get("/user/{user_id}", summary="Get user details")
async def get_user_details(user_id: str):
    users_collection = db["inventory_db"].users
    try:
        # Convert string user_id to ObjectId for MongoDB query
        user_object_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID format.")

    user = await users_collection.find_one({"_id": user_object_id})
    if user:
        return {
            "name": user.get("name"),
            "email": user.get("email"),
            "dietary_preference": user.get("dietary_preference"),
        }
    raise HTTPException(status_code=404, detail="User not found")


# --- API Endpoints ---
@app.post("/inventory/{user_id}",
          summary="Add items to inventory from an image",
          response_description="Confirmation message and updated item count.")
async def update_inventory_from_image(user_id: str, file: UploadFile = File(...)):
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File is not an image.")

    try:
        image_bytes = await file.read()
        img = Image.open(io.BytesIO(image_bytes))

        # --- Gemini API Interaction ---
        prompt = [
            "Analyze this image as an inventory scanner. Identify each distinct item and count its quantity",
            "Return the output as a clean JSON object with a single key 'inventory', which holds an array of objects.",
            "Each object must have two keys: 'item_name' (string) and 'quantity' (integer)",
            "Use generic classification meaning if there are two products of different brands dont show them as different products just use generic names and accordingly adjust the quantity",
            "Do not include any text outside of the JSON object.",
            img
        ]
        response = model.generate_content(prompt, stream=False)

        # --- Clean and Parse Gemini Response ---
        response_text = response.text
        json_string = response_text.strip().replace("```json", "").replace("```", "")
        gemini_data = json.loads(json_string)
        new_items = gemini_data.get("inventory", [])

        if not new_items:
            return JSONResponse(content={"message": "No items were identified in the image."}, status_code=200)

        # --- Database Logic ---
        inventory_collection = db["inventory_db"].inventories
        user_inventory = await inventory_collection.find_one({"user_id": user_id})

        if user_inventory:
            for item_data in new_items:
                item = InventoryItem(**item_data)
                result = await inventory_collection.update_one(
                    {"user_id": user_id, "items.item_name": item.item_name},
                    {"$inc": {"items.$.quantity": item.quantity}}
                )
                if result.matched_count == 0:
                    await inventory_collection.update_one(
                        {"user_id": user_id},
                        {"$push": {"items": item.model_dump()}}
                    )
        else:
            new_inventory = UserInventory(user_id=user_id, items=new_items)
            await inventory_collection.insert_one(new_inventory.model_dump(by_alias=True))

        return JSONResponse(
            content={"message": f"Inventory for {user_id} updated successfully.", "items_processed": len(new_items)})

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@app.get("/inventory/{user_id}",
         summary="Get a user's full inventory",
         response_model=UserInventory)
async def get_user_inventory(user_id: str):
    inventory_collection = db["inventory_db"].inventories
    inventory = await inventory_collection.find_one({"user_id": user_id})
    if inventory:
        return inventory
    raise HTTPException(status_code=404, detail=f"Inventory for user '{user_id}' not found.")


@app.post("/recipes/{user_id}", summary="Generate Recipes based on Inventory and other related parameters.")
async def get_recipes(user_id: str, payload: RecipePayload):
    inventory_collection = db["inventory_db"].inventories
    inventory = await inventory_collection.find_one({"user_id": user_id})

    if not inventory or not inventory.get("items"):
        raise HTTPException(status_code=404, detail=f"Inventory for user '{user_id}' is empty or not found.")

    if '_id' in inventory:
        inventory['_id'] = str(inventory['_id'])

    prompt = f"""
    Based on the following inventory and user preferences, generate two or three meal/dish recipes.

    User Inventory:
    {json.dumps(inventory.get("items", []), indent=2)}

    User Preferences:
    - Difficulty: {payload.Difficulty}
    - Diet: {payload.Diet}
    - Cuisine: {payload.Cuisine}
    - Servings: {payload.Serving}
    - Time Available: {payload.TimeAvailable} minutes
    - Willing to shop for extra ingredients: {'Yes' if payload.Shopping else 'No'}


    Please return the recipes as a clean JSON object with a single key 'Recipes'.
    The value of 'Recipes' should be an array of recipe objects. Each recipe object should have the following keys:
    - "name": The name of the dish.
    - "description": A brief description of the dish.
    - "ingredients": An array of strings, listing the ingredients.
    - "instructions": An array of strings, with step-by-step instructions.
    - "prep_time_minutes": An integer for the preparation time.
    - "cook_time_minutes": An integer for the cooking time.

    Do not return any text outside of the main JSON object.
    """
    try:
        response = model.generate_content(prompt, stream=False)
        response_text = response.text
        json_string = response_text.strip().replace("```json", "").replace("```", "")
        return json.loads(json_string)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate recipes: {e}")