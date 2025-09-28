import requests
import json
import argparse
import os
from pymongo import MongoClient
from dotenv import load_dotenv
from bson import ObjectId
import certifi

API_BASE_URL = 'http://127.0.0.1:8000'


def get_user_by_email(email: str):
    """Finds a user in the database by their email and returns their ID and name."""
    load_dotenv()
    MONGO_URI = os.getenv("MONGO_URI")
    if not MONGO_URI:
        print("❌ Error: MONGO_URI not found in .env file.")
        return None, None

    try:
        client = MongoClient(MONGO_URI,tlsCAFile=certifi.where())
        db = client.inventoryDB
        user = db.users.find_one({"email": email})
        client.close()
        if user:
            return str(user["_id"]), user["name"]
        return None, None
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        return None, None


def upload_recipes(file_path: str, author_email: str):
    """Reads recipes from a JSON file and uploads them via the API."""
    print(f"Attempting to upload recipes for user: {author_email}")

    # 1. Get the author's ID and name from the database
    author_id, author_name = get_user_by_email(author_email)
    if not author_id:
        print(f"❌ Error: Could not find a user with the email '{author_email}'. Aborting.")
        return

    print(f"Found user '{author_name}' with ID: {author_id}")

    # 2. Read the recipes from the JSON file
    try:
        with open(file_path, 'r') as f:
            recipes = json.load(f)
        print(f"Found {len(recipes)} recipes in '{file_path}'.")
    except Exception as e:
        print(f"❌ Error reading or parsing JSON file: {e}")
        return

    # 3. Loop through and upload each recipe
    success_count = 0
    failure_count = 0
    for recipe in recipes:
        # Add the author's name to the recipe payload
        recipe['author_name'] = author_name

        endpoint = f"{API_BASE_URL}/community/recipes/{author_id}"

        try:
            response = requests.post(endpoint, json=recipe)
            if response.status_code == 200:
                print(f"✅ Successfully uploaded '{recipe['recipe_name']}'")
                success_count += 1
            else:
                print(
                    f"❌ Failed to upload '{recipe['recipe_name']}'. Status: {response.status_code}, Info: {response.text}")
                failure_count += 1
        except requests.exceptions.RequestException as e:
            print(f"❌ Network error while uploading '{recipe['recipe_name']}': {e}")
            failure_count += 1

    print("\n--- Upload Complete ---")
    print(f"Successfully uploaded: {success_count}")
    print(f"Failed: {failure_count}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Bulk upload community recipes from a JSON file.")
    parser.add_argument("--file", required=True, help="Path to the JSON file containing recipes.")
    parser.add_argument("--email", required=True, help="Email address of the recipe author.")

    args = parser.parse_args()

    # Before running, ensure you have the necessary packages
    try:
        import requests
        from pymongo import MongoClient
        from dotenv import load_dotenv
    except ImportError:
        print("Dependencies missing. Please run: pip install requests pymongo python-dotenv")
    else:
        upload_recipes(args.file, args.email)