import requests
from bs4 import BeautifulSoup
import random
import httpx

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1"
]


# --- Helper Function for Scraping (Now Async) ---
async def find_single_amazon_asin(product_query: str):
    """
    Asynchronously searches Amazon.in for a product and returns a single ASIN,
    ignoring sponsored and out-of-stock items. It prioritizes the first
    non-sponsored 'Best Seller'. If none exist, it returns the ASIN of the
    first non-sponsored, in-stock product.

    Args:
        product_query (str): The product to search for (e.g., "laptop").

    Returns:
        dict: A dictionary containing the status and the single ASIN.
        str: An error message if the scraping fails.
    """
    if not product_query:
        return {"status": "error", "asin": None}, "Product query cannot be empty."

    search_term = product_query.replace(" ", "+")
    url = f"https://www.amazon.in/s?k={search_term}"

    headers = {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
        "Connection": "keep-alive"
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers, timeout=20.0)
            response.raise_for_status()

        soup = BeautifulSoup(response.content, "html.parser")
        search_results = soup.find_all("div", {"data-asin": True})

        if not search_results:
            return {"status": "no_results_found", "asin": None}, "No products found on the page."

        first_asin_fallback = None
        best_seller_asin = None

        for item in search_results:
            asin = item.get("data-asin")
            if not asin:
                continue

            # Filter 1: Skip sponsored items
            sponsored_tag = item.find("span", string=lambda text: text and "sponsored" in text.lower())
            if sponsored_tag:
                continue

            # Filter 2: Skip out-of-stock items
            out_of_stock_tag = item.find("span", string=lambda text: text and "currently unavailable" in text.lower())
            if out_of_stock_tag:
                continue

            # If we're here, the item is organic and in-stock.

            # Save the first valid item as a fallback.
            if not first_asin_fallback:
                first_asin_fallback = asin

            # Check if this valid item is also a "Best Seller".
            bestseller_badge = item.find("span", class_="a-badge-text")
            if bestseller_badge and "best seller" in bestseller_badge.text.lower():
                best_seller_asin = asin
                break # Found our top priority, no need to search further.

        if best_seller_asin:
            return {"status": "best_seller", "asin": best_seller_asin}, None
        elif first_asin_fallback:
            return {"status": "top_result", "asin": first_asin_fallback}, None
        else:
            return {"status": "no_in_stock_results_found", "asin": None}, "No in-stock, non-sponsored products found."

    except httpx.RequestError as e:
        return {"status": "error", "asin": None}, f"HTTP Request failed: {e}"
    except Exception as e:
        return {"status": "error", "asin": None}, f"An error occurred: {e}"
