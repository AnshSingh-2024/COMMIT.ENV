# migrate_users.py
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    print("Error: MONGO_URI not found in .env file.")
else:
    print("Connecting to database...")
    client = MongoClient(MONGO_URI)
    db = client.inventoryDB
    users_collection = db.users

    # Update users missing the 'role' field
    role_result = users_collection.update_many(
        {"role": {"$exists": False}},
        {"$set": {"role": "user"}}
    )
    print(f"Added 'role' to {role_result.modified_count} user documents.")

    # Update users missing the 'anonymous_alias' field
    alias_result = users_collection.update_many(
        {"anonymous_alias": {"$exists": False}},
        {"$set": {"anonymous_alias": ""}}
    )
    print(f"Added 'anonymous_alias' to {alias_result.modified_count} user documents.")

    print("Migration complete.")
    client.close()