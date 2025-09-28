Of course. Here is the complete and final version of the `README.md` file, structured like a professional project document. It includes a detailed file structure and a clear setup process as requested.

# 🌱 HomeHarvest AI

_From Garden to Table, Powered by AI_

HomeHarvest AI is a full-stack web application that combines sustainable living with artificial intelligence. It helps users manage their kitchen inventory, grow their own food with AI-powered guidance, and connect with a like-minded community, seamlessly bridging the gap between their garden and their table.

## ✨ Key Features

The platform is built on three core pillars, each enhanced with powerful generative AI capabilities:

#### 🧑‍🍳 My Kitchen
- **AI Pantry Scanner:** Instantly digitize your pantry items by taking a photo.
- **Inventory Management:** Easily track and adjust the quantity of your ingredients.
- **AI Recipe Generation:** Get custom recipes based on the ingredients you already have, complete with nutritional analysis.
- **Weekly Meal Planner:** Organize your meals for the week with a drag-and-drop interface.
- **Smart Shopping List:** Automatically generate a list of missing ingredients from your meal plan and create an Amazon search link for them.

#### 🌿 Smart Garden
- **AI Plant Doctor:** Diagnose plant diseases and health issues by uploading a photo.
- **Garden Management:** Keep a visual log of your plants and their health history.
- **Contextual AI Chat:** Have a real-time, streaming conversation with an AI gardener to get personalized advice for your specific plants and goals.
- **Care Recommendations:** Receive actionable care tips based on AI diagnoses.

#### 💬 Community Hub
- **Recipe Sharing:** Publish your own recipes and discover new ones from the community.
- **Gamification:** Earn points and climb the leaderboard by sharing recipes and receiving upvotes.
- **Anonymous Discussion Forum:** Ask questions and share tips in a safe, anonymous environment with moderator support.
- **Scalable Content:** The community sections are fully equipped with pagination and a powerful substring search to handle a large amount of content.

---

## 🛠️ Tech Stack

- **Backend:** Python, FastAPI, Uvicorn, Motor (Async MongoDB Driver), Pydantic
- **Database:** MongoDB
- **AI:** Google Gemini API (for vision, generative text, and streaming chat)
- **Frontend:** Vanilla JavaScript (ES6+), Tailwind CSS, HTML5
- **Deployment (Recommended):** Render (for Web Service + Static Site), MongoDB Atlas

---

## 📁 File Structure

Here is an overview of the key files and directories in the project:

```

/HomeHarvest-AI
│
├── static/
│   └── plant\_images/      \# Uploaded images for the Smart Garden feature are stored here.
│
├── .env                   \# (You must create this) Stores all secret keys and environment variables.
├── about.html             \# The static 'About Us' page.
├── account.html           \# The user account management page.
├── Amazon\_Scraper.py      \# The module for interacting with the scraping API (ScraperAPI).
├── community.html         \# The UI for the Community Hub.
├── garden.html            \# The UI for the Smart Garden feature.
├── index.html             \# The main landing page.
├── kitchen.html           \# The UI for the My Kitchen feature.
├── login.html             \# The login and signup page.
├── main.py                \# The core FastAPI backend application with all API endpoints.
├── migrate\_users.py       \# A one-time script to update user data schemas.
├── models.py              \# Contains all Pydantic data models for the application.
├── README.md              \# This file.
├── requirements.txt       \# A list of all Python dependencies for the backend.
├── script.js              \# The single, comprehensive JavaScript file for all frontend logic.
├── set\_moderator.py       \# A utility script to grant moderator privileges to a user.
├── style.css              \# Custom CSS and Tailwind @apply directives.
└── theme-loader.js        \# A small script to prevent "flash of incorrect theme" on page load.

````

---

## 🚀 Getting Started: Local Setup

Follow these steps to get the project running on your local machine.

### Prerequisites

- Python 3.10+
- `pip` and `venv`
- MongoDB installed and running locally, or a MongoDB Atlas cluster.

### 1. Clone the Repository

```bash
git clone [https://github.com/your-username/HomeHarvest-AI.git](https://github.com/your-username/HomeHarvest-AI.git)
cd HomeHarvest-AI
````

### 2\. Setup Backend

1.  **Create and activate a virtual environment:**

    ```bash
    # For macOS/Linux
    python3 -m venv .venv
    source .venv/bin/activate

    # For Windows
    python -m venv .venv
    .venv\Scripts\activate
    ```

2.  **Install dependencies:**

    ```bash
    pip install -r requirements.txt
    ```

3.  **Set up your Environment Variables:**
    Create a file named `.env` in the root of the project. Copy the content below and replace the placeholder values with your actual keys.

    ```
    # .env file

    # Your MongoDB connection string (local or from Atlas)
    MONGO_URI="mongodb://localhost:27017/"

    # Your API key from Google AI Studio
    GOOGLE_API_KEY="YOUR_GOOGLE_API_KEY"

    # Your API key from scraperapi.com (for the Amazon feature)
    SCRAPER_API_KEY="YOUR_SCRAPERAPI_KEY"
    
    # AMAZON_CART_BASE_URL="https://www.amazon.in/gp/aws/cart/add.html?AssociateTag=amazon"

    ```

4.  **Run the Backend Server:**

    ```bash
    uvicorn main:app --reload
    ```

    The API will now be running at `http://127.0.0.1:8000`. You can see the interactive documentation at `http://127.0.0.1:8000/docs`.

### 3\. Setup Frontend

The frontend is composed of static files. Simply open the `index.html` file in your browser to get started. Most modern code editors (like VS Code with the "Live Server" extension) can serve the files for you, which is recommended for development.

-----

## 🔗 API Endpoints

The FastAPI backend automatically generates interactive API documentation. Once the server is running, you can view and test all available endpoints here:

  * **[http://127.0.0.1:8000/docs](https://www.google.com/url?sa=E&source=gmail&q=http://127.0.0.1:8000/docs)**

<!-- end list -->

```
```