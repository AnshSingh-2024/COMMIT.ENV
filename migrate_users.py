# migrate_users.py

from pymongo import MongoClient
import os
from dotenv import load_dotenv

# Load environment variables (like your MONGO_URI)
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    print("Error: MONGO_URI not found in .env file.")
else:
    print("Connecting to database...")
    client = MongoClient(MONGO_URI)
    db = client.inventoryDB
    users_collection = db.users

    # This command finds all user documents where the 'points' field does NOT exist
    # and sets it to 0.
    result = users_collection.update_many(
        {"points": {"$exists": False}},
        {"$set": {"points": 0}}
    )

    print(f"Migration complete. Updated {result.modified_count} user documents.")
    client.close()