# reset_scores.py
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    print("Error: MONGO_URI not found.")
else:
    client = MongoClient(MONGO_URI)
    db = client.inventoryDB
    users_collection = db.users

    # Find all users with points less than 0 and set their points to 0
    result = users_collection.update_many(
        {"points": {"$lt": 0}},
        {"$set": {"points": 0}}
    )
    print(f"Reset scores for {result.modified_count} user(s).")
    client.close()