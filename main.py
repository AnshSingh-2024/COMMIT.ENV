import os
import io
import json
import random
from typing import Optional
import certifi
import requests
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import google.generativeai as genai
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Body, APIRouter
from fastapi.responses import JSONResponse,StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from PIL import Image
import shutil
from pathlib import Path
from datetime import datetime
from models import Plant, PlantCreate, PlantHistoryEntry, PlantRecommendation, CommunityRecipe, ForumAnswer, ForumPost, \
    CommunityRecipeCreate, GardenChatPayload, MealPlan, MealPlanEntry
from bson import ObjectId
from fastapi.staticfiles import StaticFiles
from models import (
    UserInventory, InventoryItem, RecipePayload, User, UserCreate, UserLogin,
    get_password_hash, verify_password, PasswordUpdate, PreferenceUpdate, InventoryItemUpdate,IngredientsList,ForumPostCreate, ForumAnswerCreate
)
from Amazon_Scraper import find_single_amazon_asin
import httpx


# --- Configuration & Initialization ---
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
AMAZON_CART_BASE_URL=os.getenv("AMAZON_CART_BASE_URL")
if not GOOGLE_API_KEY or not MONGO_URI:
    raise ValueError("API keys not set. Please create a .env file with GOOGLE_API_KEY and MONGO_URI.")

genai.configure(api_key=GOOGLE_API_KEY)


db = {}



@asynccontextmanager
async def lifespan(app: FastAPI):
    db["client"] = AsyncIOMotorClient(MONGO_URI, tlsCAFile=certifi.where())

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
Path("static/plant_images").mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

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

    # Include the user's role in the session data
    return {"user_id": str(user["_id"]), "name": user["name"], "role": user.get("role", "user")}

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

        return JSONResponse(content={"message": f"Inventory updated successfully", "items_processed": len(new_items)})

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
    inventory_data = await db["inventory_db"].inventories.find_one({"user_id": user_id})
    if inventory_data:
        # Manually convert the ObjectId to a string before validation
        inventory_data["_id"] = str(inventory_data["_id"])
        return UserInventory(**inventory_data)
    raise HTTPException(status_code=404, detail="Inventory not found")


@app.post("/recipes/{user_id}", summary="Generate recipes based on inventory")
async def get_recipes(user_id: str, payload: RecipePayload):
    inventory = await db["inventory_db"].inventories.find_one({"user_id": user_id})
    if not inventory or not inventory.get("items"):
        raise HTTPException(status_code=404, detail="Inventory is empty or not found.")

    inventory_json = json.dumps({"items": inventory["items"]})

    # This prompt is now more specific to fix the formatting and matching issues
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
        Each recipe object must include: 'name', 'description', 'prep_time_minutes', 'cook_time_minutes', 'ingredients', 'instructions', and 'nutritional_info'.
        You are to assume that some basic things like water are already available.

        IMPORTANT FORMATTING RULES for the 'ingredients' array:
        1. Each item in the array must be a simple, descriptive string of the ingredient and its quantity (e.g., "1 cup Basmati Rice" or "2 large onions, chopped").
        2. Use the most generic names possible for ingredients (e.g., use "rice" instead of "Basmati Rice", "oil" instead of "extra virgin olive oil").
        3. DO NOT add any extra labels, parentheses, or annotations like '(from inventory)' or '(shopping)' to the ingredient strings.

        Each 'nutritional_info' object must have keys 'calories', 'protein', 'carbs', and 'fats', all as strings.
        Do not include any text outside the main JSON object.
    """
    try:
        response = model.generate_content(prompt, stream=False)
        json_string = response.text.strip().replace("```json", "").replace("```", "")
        return json.loads(json_string)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI processing failed: {e}")
@app.post("/shopping",summary = "Returns a link with all the items required")
async def get_shopping(items : dict):
    #Items structure={"item_name":Quantity}
    ASINsFound=[]
    i=1

    items=items["additionalProp1"]
    for itemName in items.keys():
        result, error = await find_single_amazon_asin(itemName)
        if error:
            raise HTTPException(status_code=503, detail={"error": error, **result})

        asin=f"&ASIN.{i}="+(result["asin"])+f"&Quantity.{i}="+str(items[itemName])
        print(items[itemName])
        i+=1
        ASINsFound.append(asin)
    cart_url=AMAZON_CART_BASE_URL+''.join(ASINsFound)
    return {"cart_url": cart_url}


@app.get("/meal-plan/{user_id}", response_model=MealPlan, summary="Get a user's meal plan")
async def get_meal_plan(user_id: str):
    meal_plan_data = await db["inventory_db"].meal_plans.find_one({"user_id": user_id})
    if meal_plan_data:
        # Manually convert the ObjectId to a string before validation
        meal_plan_data["_id"] = str(meal_plan_data["_id"])
        return MealPlan(**meal_plan_data)
    # Return an empty plan if none exists
    return MealPlan(user_id=user_id, entries=[])

@app.post("/meal-plan/{user_id}", summary="Save a user's meal plan")
async def save_meal_plan(user_id: str, plan: MealPlan):
    await db["inventory_db"].meal_plans.update_one(
        {"user_id": user_id},
        {"$set": plan.model_dump()},
        upsert=True
    )
    return {"message": "Meal plan saved successfully."}


@app.get("/shopping-list/{user_id}", summary="Generate a smart shopping list")
async def get_shopping_list(user_id: str):
    # Fetch meal plan and inventory
    meal_plan_doc = await db["inventory_db"].meal_plans.find_one({"user_id": user_id})
    inventory_doc = await db["inventory_db"].inventories.find_one({"user_id": user_id})

    if not meal_plan_doc or not meal_plan_doc.get("entries"):
        return {"shopping_list": []}

    # Consolidate all ingredients from the meal plan
    required_ingredients = [ing for entry in meal_plan_doc["entries"] for ing in entry["recipe_ingredients"]]

    # Get current inventory items (lowercase for case-insensitive comparison)
    inventory_items = {item['item_name'].lower() for item in inventory_doc.get("items", [])}

    # Use AI to clean the descriptive list from the meal plan
    cleaned_items_response = await clean_ingredients(IngredientsList(ingredients=required_ingredients))

    # Filter out items the user already has
    shopping_list = {
        item: qty for item, qty in cleaned_items_response.items()
        if item.lower() not in inventory_items
    }

    return {"shopping_list": shopping_list}

@app.post("/clean-ingredients", summary="Cleans a list of descriptive ingredients into a simple format")
async def clean_ingredients(payload: IngredientsList):
    descriptive_list = ", ".join(payload.ingredients)
    prompt = f"""
    Analyze the following list of recipe ingredients: [{descriptive_list}].
    Your task is to convert this list into a simple JSON object.
    The keys must be the generic, searchable name of the ingredient (e.g., "1 tbsp olive oil" becomes "olive oil").
    The values must be the quantity as an integer. If a quantity is not explicitly mentioned (like "a pinch of salt" or "water"), assume the quantity is 1.
    Return ONLY the raw JSON object, with no markdown formatting or extra text.
    Assume water is always present.
    and also ignore if the input says from inventory
    Example input: ["2 large onions, chopped", "a pinch of salt", "water for boiling"]
    Example output: {{"onion": 2, "salt": 1}}
    """

    try:
        response = model.generate_content(prompt)
        json_string = response.text.strip().replace("```json", "").replace("```", "")
        cleaned_data = json.loads(json_string)
        return cleaned_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI processing failed: {str(e)}")

@app.post("/garden/{user_id}", summary="Add a new plant to the garden")
async def add_plant_to_garden(user_id: str, plant_name: str = Body(...), file: UploadFile = File(...)):
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image.")

    # Save the image
    file_extension = Path(file.filename).suffix
    unique_filename = f"{ObjectId()}{file_extension}"
    image_path = Path("static/plant_images") / unique_filename
    with open(image_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # --- CORRECTED INITIAL HISTORY ENTRY ---
    # Create a valid PlantRecommendation object
    initial_recommendation = PlantRecommendation(
        title="Initial Monitoring",
        steps=["Monitor for initial growth and watering needs."],
        purchasable_items=[]
    )

    # Create the initial history entry using the valid object
    initial_entry = PlantHistoryEntry(
        image_path=str(image_path),
        diagnosis="Plant registered successfully.",
        recommendations=[initial_recommendation] # Pass it as a list of objects
    )

    # Create new plant document
    new_plant = Plant(
        user_id=user_id,
        plant_name=plant_name,
        history=[initial_entry]
    )

    await db["inventory_db"].plants.insert_one(new_plant.model_dump(by_alias=True))
    return {"message": f"'{plant_name}' added to your garden.", "plant": new_plant.model_dump()}

@app.get("/garden/{user_id}", summary="Get all plants in a user's garden")
async def get_garden(user_id: str):
    plants_cursor = db["inventory_db"].plants.find({"user_id": user_id})
    plants = await plants_cursor.to_list(length=None)
    return plants

@app.post("/garden/diagnose/{plant_id}", summary="Diagnose a plant from a new image")
async def diagnose_plant(plant_id: str, file: UploadFile = File(...)):
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image.")

    plant = await db["inventory_db"].plants.find_one({"_id": plant_id})
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found.")

    image_bytes = await file.read()

    file_extension = Path(file.filename).suffix
    unique_filename = f"{ObjectId()}{file_extension}"
    image_path = Path("static/plant_images") / unique_filename
    with open(image_path, "wb") as buffer:
        buffer.write(image_bytes)

    img = Image.open(io.BytesIO(image_bytes))

    # --- CORRECTED HISTORY CONTEXT LOGIC ---
    history_entries = []
    for entry in plant.get('history', []):
        # Check for the new format (list of dicts) vs the old (list of strings)
        rec_titles = []
        for rec in entry.get('recommendations', []):
            if isinstance(rec, dict):
                rec_titles.append(rec.get('title', ''))  # Use the title from the object
            elif isinstance(rec, str):
                rec_titles.append(rec)  # Use the string directly for old data

        recommendations_str = ", ".join(filter(None, rec_titles))  # Join the titles/strings
        entry_timestamp = entry['timestamp'].strftime('%Y-%m-%d')
        entry_diagnosis = entry['diagnosis']
        history_entries.append(
            f"- On {entry_timestamp}, the diagnosis was: '{entry_diagnosis}' with recommendations: {recommendations_str}"
        )
    history_context = "\n".join(history_entries)

    prompt = f"""
        You are a plant health expert. Analyze the provided image of a '{plant['plant_name']}' plant.
        Here is the plant's history for context:
        {history_context}

        Based on the new image and the plant's history, provide a concise diagnosis and actionable recommendations.
        Return a clean JSON object with two keys: 'diagnosis' (string) and 'recommendations' (an array of objects).
        Each recommendation object must have three keys:
        1. 'title': A brief, one-line summary of the action (e.g., "Apply Neem Oil").
        2. 'steps': An array of strings containing the detailed step-by-step guide for the action.
        3. 'purchasable_items': An array of strings listing any generic, searchable product names needed for this action (e.g., ["neem oil", "perlite"]). If no items are needed, return an empty array.

        Do not include any text outside the main JSON object.
    """

    try:
        response = model.generate_content([prompt, img])
        json_string = response.text.strip().replace("```json", "").replace("```", "")
        ai_data = json.loads(json_string)

        # We must now use PlantRecommendation when creating the entry
        new_recommendations = [PlantRecommendation(**rec) for rec in ai_data.get("recommendations", [])]

        new_history_entry = PlantHistoryEntry(
            image_path=str(image_path),
            diagnosis=ai_data.get("diagnosis", "No diagnosis provided."),
            recommendations=new_recommendations
        )

        await db["inventory_db"].plants.update_one(
            {"_id": plant_id},
            {"$push": {"history": new_history_entry.model_dump()}}
        )
        return {"message": "Diagnosis complete.", "new_entry": new_history_entry.model_dump()}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI processing failed: {e}")

@app.delete("/garden/plant/{plant_id}/{user_id}", summary="Remove a plant from a user's garden")
async def remove_plant_from_garden(plant_id: str, user_id: str):
    plants_collection = db["inventory_db"].plants

    # Find the plant to ensure it exists and belongs to the user
    plant = await plants_collection.find_one({"_id": plant_id})
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found.")

    # Security check: Ensure the user owns this plant
    if plant.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="You do not have permission to delete this plant.")

    # Delete the associated images from the server
    for entry in plant.get("history", []):
        image_path = entry.get("image_path")
        if image_path and os.path.exists(image_path):
            try:
                os.remove(image_path)
            except OSError as e:
                # Log this error in a real application
                print(f"Error deleting file {image_path}: {e}")

    # Delete the plant from the database
    result = await plants_collection.delete_one({"_id": plant_id})

    if result.deleted_count == 1:
        return {"message": "Plant removed successfully."}

    raise HTTPException(status_code=500, detail="Failed to remove the plant.")

    # Make sure to import ForumPostCreate and ForumAnswerCreate from models.


# --- Community & Gamification Endpoints ---

# 1. Create a new router with a prefix
community_router = APIRouter(
    prefix="/community",
    tags=["Community"],
)


# 2. Change all decorators from @app to @community_router and simplify the paths

@community_router.get("/recipes", summary="Get all shared recipes")
@community_router.get("/recipes", summary="Get all shared recipes with pagination and search")
async def get_all_community_recipes(page: int = 1, limit: int = 9, search: Optional[str] = None):
    recipes_collection = db["inventory_db"].community_recipes

    query = {"hidden": {"$ne": True}}
    if search:
        # This new logic uses a case-insensitive regex search for substrings
        search_regex = {"$regex": search, "$options": "i"}
        query["$or"] = [
            {"recipe_name": search_regex},
            {"author_name": search_regex}
        ]

    skip = (page - 1) * limit
    total_items = await recipes_collection.count_documents(query)
    total_pages = (total_items + limit - 1) // limit

    recipes_cursor = recipes_collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
    recipes = await recipes_cursor.to_list(length=limit)

    return {"items": recipes, "total_pages": total_pages, "current_page": page}


@community_router.get("/forum", summary="Get all visible forum posts with pagination and search")
async def get_all_forum_posts(page: int = 1, limit: int = 10, search: Optional[str] = None):
    posts_collection = db["inventory_db"].forum_posts

    query = {"hidden": {"$ne": True}}
    if search:
        # This new logic uses a case-insensitive regex search for substrings
        search_regex = {"$regex": search, "$options": "i"}
        query["$or"] = [
            {"title": search_regex},
            {"content": search_regex},
            {"author_alias": search_regex}
        ]

    skip = (page - 1) * limit
    total_items = await posts_collection.count_documents(query)
    total_pages = (total_items + limit - 1) // limit

    posts_cursor = posts_collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
    posts = await posts_cursor.to_list(length=limit)

    for post in posts:
        if "answers" in post:
            post["answers"] = [ans for ans in post["answers"] if not ans.get("hidden", False)]

    return {"items": posts, "total_pages": total_pages, "current_page": page}

@community_router.get("/leaderboard", summary="Get the user leaderboard")
async def get_leaderboard():
    users_cursor = db["inventory_db"].users.find().sort("points", -1).limit(10)
    leaderboard = await users_cursor.to_list(length=10)
    return [{"name": user["name"], "points": user["points"]} for user in leaderboard]

@community_router.post("/recipes/{user_id}", summary="Post a new recipe")
async def create_community_recipe(user_id: str, recipe_data: CommunityRecipeCreate):
    users_collection = db["inventory_db"].users
    await users_collection.update_one({"_id": user_id}, {"$inc": {"points": 5}})

    new_recipe = CommunityRecipe(user_id=user_id, **recipe_data.model_dump())

    await db["inventory_db"].community_recipes.insert_one(new_recipe.model_dump(by_alias=True))
    return {"message": "Recipe shared successfully! You earned 5 points."}

@community_router.post("/recipes/{recipe_id}/toggle_upvote/{user_id}", summary="Toggle upvote on a recipe")
async def toggle_upvote_recipe(recipe_id: str, user_id: str):
    recipes_collection = db["inventory_db"].community_recipes
    users_collection = db["inventory_db"].users

    recipe = await recipes_collection.find_one({"_id": recipe_id})
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found.")

    author_id = recipe.get("user_id")

    if user_id in recipe.get("upvoted_by", []):
        await recipes_collection.update_one(
            {"_id": recipe_id},
            {"$inc": {"upvotes": -1}, "$pull": {"upvoted_by": user_id}}
        )
        if author_id and author_id != user_id:
            # This new logic ensures the score cannot go below 0
            await users_collection.update_one(
                {"_id": author_id},
                [{"$set": {"points": {"$max": [0, {"$subtract": ["$points", 1]}]}}}]
            )
        return {"message": "Upvote removed."}
    else:
        await recipes_collection.update_one(
            {"_id": recipe_id},
            {"$inc": {"upvotes": 1}, "$push": {"upvoted_by": user_id}}
        )
        if author_id and author_id != user_id:
            await users_collection.update_one({"_id": author_id}, {"$inc": {"points": 1}})
        return {"message": "Recipe upvoted!"}

@community_router.post("/forum/{user_id}", summary="Create a new forum post")
async def create_forum_post(user_id: str, post_data: ForumPostCreate):
    author_alias = await get_or_create_anonymous_alias(user_id)
    new_post = ForumPost(
        user_id=user_id,
        author_alias=author_alias,
        **post_data.model_dump()
    )
    await db["inventory_db"].forum_posts.insert_one(new_post.model_dump(by_alias=True))
    return {"message": "Post created successfully."}

@community_router.post("/forum/{post_id}/answer/{user_id}", summary="Add an answer to a post")
async def add_forum_answer(post_id: str, user_id: str, answer_data: ForumAnswerCreate):
    author_alias = await get_or_create_anonymous_alias(user_id)
    new_answer = ForumAnswer(
        user_id=user_id,
        author_alias=author_alias,
        **answer_data.model_dump()
    )
    result = await db["inventory_db"].forum_posts.update_one(
        {"_id": post_id},
        {"$push": {"answers": new_answer.model_dump()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Post not found.")
    return {"message": "Answer posted successfully."}

@community_router.post("/forum/{post_id}/report", summary="Report a post")
async def report_post(post_id: str):
    result = await db["inventory_db"].forum_posts.update_one(
        {"_id": post_id},
        {"$inc": {"reports": 1}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Post not found.")
    return {"message": "Post reported. A moderator will review it shortly."}

@community_router.put("/forum/{post_id}/hide/{user_id}", summary="Hide a post (Moderator only)")
async def hide_post(post_id: str, user_id: str):
    user = await db["inventory_db"].users.find_one({"_id": user_id})
    if not user or user.get("role") != "moderator":
        raise HTTPException(status_code=403, detail="You do not have permission to perform this action.")

    result = await db["inventory_db"].forum_posts.update_one(
        {"_id": post_id},
        {"$set": {"hidden": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Post not found.")
    return {"message": "Post has been hidden."}

@community_router.post("/garden/chat/{plant_id}", summary="Chat with the AI about a specific plant, with streaming")
async def garden_chat(plant_id: str, payload: GardenChatPayload):
    plant = await db["inventory_db"].plants.find_one({"_id": plant_id})
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found.")

    history_context = "\n".join([
        f"- On {entry['timestamp'].strftime('%Y-%m-%d')}, the diagnosis was: '{entry['diagnosis']}'"
        for entry in plant.get('history', [])
    ])

    prompt = f"""
        You are a master gardener and botanist. A user wants advice about their '{plant['plant_name']}' plant.
        Here is the plant's recent history:
        {history_context}
        The user's goal is: "{payload.prompt}"
        Based on the plant's history and the user's goal, provide clear, actionable suggestions and a step-by-step guide to help them achieve this result. Format your response in markdown.
    """

    async def stream_generator():
        try:
            response_stream = model.generate_content(prompt, stream=True)
            for chunk in response_stream:
                yield chunk.text
        except Exception as e:
            yield f"Error: Could not get a response from the AI. {e}"

    # Add headers to explicitly disable buffering
    headers = {
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no"  # Specifically for Nginx/some reverse proxies
    }

    return StreamingResponse(stream_generator(), headers=headers)

@community_router.delete("/recipes/{recipe_id}/{user_id}", summary="Delete a community recipe (Owner or Moderator only)")
async def delete_community_recipe(recipe_id: str, user_id: str):
    recipes_collection = db["inventory_db"].community_recipes
    users_collection = db["inventory_db"].users

    recipe_to_delete = await recipes_collection.find_one({"_id": recipe_id})
    requesting_user = await users_collection.find_one({"_id": user_id})

    if not recipe_to_delete:
        raise HTTPException(status_code=404, detail="Recipe not found.")
    if not requesting_user:
        raise HTTPException(status_code=404, detail="Requesting user not found.")

    is_owner = recipe_to_delete.get("user_id") == user_id
    is_moderator = requesting_user.get("role") == "moderator"

    if not is_owner and not is_moderator:
        raise HTTPException(status_code=403, detail="You do not have permission to delete this recipe.")

    author_id = recipe_to_delete.get("user_id")
    if author_id:
        points_to_remove = 5 + recipe_to_delete.get("upvotes", 0)
        # This new logic ensures the score cannot go below 0
        await users_collection.update_one(
            {"_id": author_id},
            [{"$set": {"points": {"$max": [0, {"$subtract": ["$points", points_to_remove]}]}}}]
        )

    await recipes_collection.delete_one({"_id": recipe_id})
    return {"message": "Recipe has been successfully deleted."}
# --- Helper for Anonymous Alias ---
async def get_or_create_anonymous_alias(user_id: str):
    users_collection = db["inventory_db"].users
    user = await users_collection.find_one({"_id": user_id})
    if user.get("anonymous_alias"):
        return user["anonymous_alias"]

    # Create a new alias if one doesn't exist
    new_alias = f"Gardener_{random.randint(1000, 9999)}"
    # In a real-world app, you'd check for uniqueness here
    await users_collection.update_one({"_id": user_id}, {"$set": {"anonymous_alias": new_alias}})
    return new_alias

app.include_router(community_router)