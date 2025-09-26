import argparse
import os
from pymongo import MongoClient
from dotenv import load_dotenv


def set_user_as_moderator(email: str):
    """
    Finds a user by their email address and updates their role to 'moderator'.
    """
    # Load environment variables from .env file
    load_dotenv()
    MONGO_URI = os.getenv("MONGO_URI")

    if not MONGO_URI:
        print("❌ Error: MONGO_URI not found in your .env file.")
        return

    try:
        # Connect to the database
        client = MongoClient(MONGO_URI)
        db = client.inventoryDB
        users_collection = db.users

        print(f"Searching for user with email: {email}...")

        # The document to find
        user_filter = {"email": email}

        # The changes to apply
        new_values = {"$set": {"role": "moderator"}}

        # Perform the update operation
        result = users_collection.update_one(user_filter, new_values)

        # Provide feedback based on the result
        if result.matched_count == 0:
            print(f"❌ Error: No user found with the email '{email}'.")
        elif result.modified_count == 0 and result.matched_count == 1:
            print(f"✅ User '{email}' is already a moderator. No changes made.")
        else:
            print(f"✅ Success! User '{email}' has been promoted to moderator.")

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        if 'client' in locals():
            client.close()


if __name__ == "__main__":
    # Set up command-line argument parsing
    parser = argparse.ArgumentParser(description="Promote a user to a moderator role.")
    parser.add_argument("email", type=str, help="The email address of the user to promote.")

    args = parser.parse_args()

    set_user_as_moderator(args.email)