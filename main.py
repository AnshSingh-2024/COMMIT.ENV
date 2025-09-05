import os
import io
import json
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import google.generativeai as genai
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Body
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from PIL import Image
from models import (
    UserInventory, InventoryItem, RecipePayload, User, UserCreate, UserLogin,
    get_password_hash, verify_password, PasswordUpdate, PreferenceUpdate, InventoryItemUpdate
)

# --- Configuration & Initialization ---
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not GOOGLE_API_KEY or not MONGO_URI:
    raise ValueError("API keys not set. Please create a .env file with GOOGLE_API_KEY and MONGO_URI.")

genai.configure(api_key=GOOGLE_API_KEY)

db = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    db["client"] = AsyncIOMotorClient(MONGO_URI)
    db["inventory_db"] = db["client"].inventoryDB
    print("Successfully connected to MongoDB.")
    yield
    db["client"].close()
    print("MongoDB connection closed.")


app = FastAPI(
    title="HomeHarvest AI API",
    description="API for user management, inventory tracking, and recipe generation.",
    version="1.3.0",
    lifespan=lifespan
)

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = genai.GenerativeModel('gemini-2.5-flash')


# --- User & Auth Endpoints ---
@app.post("/signup", summary="Create a new user")
async def signup(user_data: UserCreate):
    users_collection = db["inventory_db"].users
    existing_user = await users_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        hashed_password=hashed_password,
        dietary_preference=user_data.dietary_preference
    )
    await users_collection.insert_one(new_user.model_dump(by_alias=True))
    return {"message": "User created successfully"}


@app.post("/login", summary="User login")
async def login(user_data: UserLogin):
    users_collection = db["inventory_db"].users
    user = await users_collection.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    return {"user_id": str(user["_id"]), "name": user["name"]}


@app.get("/user/{user_id}", summary="Get user details")
async def get_user(user_id: str):
    users_collection = db["inventory_db"].users
    user = await users_collection.find_one({"_id": user_id})
    if user:
        return {"name": user["name"], "email": user["email"],
                "dietary_preference": user.get("dietary_preference", "Veg")}
    raise HTTPException(status_code=404, detail="User not found")


@app.put("/user/{user_id}/update", summary="Update user password or preferences")
async def update_user(user_id: str, payload: dict):
    users_collection = db["inventory_db"].users
    user = await users_collection.find_one({"_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if "current_password" in payload and "new_password" in payload:
        update_data = PasswordUpdate(**payload)
        if not verify_password(update_data.current_password, user["hashed_password"]):
            raise HTTPException(status_code=400, detail="Incorrect current password")
        new_hashed_password = get_password_hash(update_data.new_password)
        await users_collection.update_one({"_id": user_id}, {"$set": {"hashed_password": new_hashed_password}})
        return {"message": "Password updated successfully"}

    elif "dietary_preference" in payload:
        update_data = PreferenceUpdate(**payload)
        await users_collection.update_one({"_id": user_id},
                                          {"$set": {"dietary_preference": update_data.dietary_preference}})
        return {"message": "Dietary preference updated successfully"}

    else:
        raise HTTPException(status_code=400, detail="Invalid update payload")


# --- Inventory & Recipe Endpoints ---
@app.post("/inventory/{user_id}", summary="Add items from image to inventory")
async def update_inventory_from_image(user_id: str, file: UploadFile = File(...)):
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File is not an image.")

    try:
        image_bytes = await file.read()
        img = Image.open(io.BytesIO(image_bytes))
        prompt = [
            "Analyze this image as an inventory scanner. Identify each distinct item and count its quantity.",
            "Return the output as a clean JSON object with a single key 'inventory', which holds an array of objects.",
            "Each object must have two keys: 'item_name' (string) and 'quantity' (integer). Use generic names.",
            "Do not include any text outside of the JSON object.",
            img
        ]
        response = model.generate_content(prompt, stream=False)
        json_string = response.text.strip().replace("```json", "").replace("```", "")
        gemini_data = json.loads(json_string)
        new_items = gemini_data.get("inventory", [])
        if not new_items:
            return JSONResponse(content={"message": "No items were identified in the image."}, status_code=200)

        inventory_collection = db["inventory_db"].inventories
        user_inventory_doc = await inventory_collection.find_one({"user_id": user_id})

        if user_inventory_doc:
            current_items = {item['item_name']: item['quantity'] for item in user_inventory_doc['items']}
            for item_data in new_items:
                item_name = item_data['item_name']
                quantity = item_data['quantity']
                current_items[item_name] = current_items.get(item_name, 0) + quantity

            updated_items_list = [{"item_name": name, "quantity": qty} for name, qty in current_items.items()]
            await inventory_collection.update_one({"user_id": user_id}, {"$set": {"items": updated_items_list}})
        else:
            new_inventory = UserInventory(user_id=user_id, items=new_items)
            await inventory_collection.insert_one(new_inventory.model_dump(by_alias=True))

        return JSONResponse(content={"message": f"Inventory updated for {user_id}.", "items_processed": len(new_items)})

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@app.put("/inventory/{user_id}/update-item", summary="Update quantity of a single inventory item")
async def update_inventory_item(user_id: str, item_update: InventoryItemUpdate):
    inventory_collection = db["inventory_db"].inventories

    # Use $inc to modify the quantity of the item
    result = await inventory_collection.update_one(
        {"user_id": user_id, "items.item_name": item_update.item_name},
        {"$inc": {"items.$.quantity": item_update.change}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail=f"Item '{item_update.item_name}' not found in inventory.")

    # After updating, remove any items with quantity 0 or less
    await inventory_collection.update_one(
        {"user_id": user_id},
        {"$pull": {"items": {"quantity": {"$lte": 0}}}}
    )

    return {"message": f"'{item_update.item_name}' updated successfully."}


@app.get("/inventory/{user_id}", response_model=UserInventory, summary="Get a user's full inventory")
async def get_user_inventory(user_id: str):
    inventory = await db["inventory_db"].inventories.find_one({"user_id": user_id})
    if inventory:
        return inventory
    raise HTTPException(status_code=404, detail="Inventory not found")


@app.post("/recipes/{user_id}", summary="Generate recipes based on inventory")
async def get_recipes(user_id: str, payload: RecipePayload):
    inventory = await db["inventory_db"].inventories.find_one({"user_id": user_id})
    if not inventory or not inventory.get("items"):
        raise HTTPException(status_code=404, detail="Inventory is empty or not found.")

    inventory_json = json.dumps({"items": inventory["items"]})
    prompt = f"""
        Based on the user's inventory: {inventory_json}, generate two or three recipes.
        Adhere to these preferences:
        - Diet: {payload.Diet}
        - Cuisine: {payload.Cuisine}
        - Difficulty: {payload.Difficulty}
        - Max Time: {payload.TimeAvailable} minutes
        - Servings: {payload.Serving}
        - Willing to shop for extras: {'Yes' if payload.Shopping else 'No'}

        Return a clean JSON object with a single key 'Recipes'. This key should contain an array of recipe objects.
        Each recipe object must include: 'name' (string), 'description' (string), 'prep_time_minutes' (integer), 'cook_time_minutes' (integer), 'ingredients' (array of strings), and 'instructions' (array of strings).
        Do not include any text outside the JSON object.
    """
    response = model.generate_content(prompt, stream=False)
    json_string = response.text.strip().replace("```json", "").replace("```", "")
    return json.loads(json_string)