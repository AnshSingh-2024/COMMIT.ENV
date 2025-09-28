import os
import httpx
from bs4 import BeautifulSoup

async def find_single_amazon_asin(product_query: str):
    """
    Uses ScraperAPI to reliably fetch Amazon search results and find an ASIN.
    """
    if not product_query:
        return {"status": "error", "asin": None}, "Product query cannot be empty."

    # Get the API key from the environment variables
    api_key = os.getenv("SCRAPER_API_KEY")
    if not api_key:
        return {"status": "error", "asin": None}, "ScraperAPI key not found in .env file."

    search_term = product_query.replace(" ", "+")
    amazon_url = f"https://www.amazon.in/s?k={search_term}"

    # Construct the request URL for ScraperAPI
    scraper_url = f"http://api.scraperapi.com?api_key={api_key}&url={amazon_url}"

    try:
        async with httpx.AsyncClient() as client:
            # Make the request to ScraperAPI, not directly to Amazon
            response = await client.get(scraper_url, timeout=60.0)
            response.raise_for_status()

        # The rest of the parsing logic is the same as before
        soup = BeautifulSoup(response.text, "html.parser")
        search_results = soup.find_all("div", {"data-asin": True, "data-component-type": "s-search-result"})

        if not search_results:
            return {"status": "no_results_found", "asin": None}, "No products found on the page."

        first_asin_fallback = None
        best_seller_asin = None

        for item in search_results:
            asin = item.get("data-asin")
            if not asin:
                continue

            sponsored_tag = item.find("span", string=lambda text: text and "sponsored" in text.lower())
            if sponsored_tag:
                continue

            out_of_stock_tag = item.find("span", string=lambda text: text and "currently unavailable" in text.lower())
            if out_of_stock_tag:
                continue

            if not first_asin_fallback:
                first_asin_fallback = asin

            bestseller_badge = item.find("span", class_="a-badge-text")
            if bestseller_badge and "best seller" in bestseller_badge.text.lower():
                best_seller_asin = asin
                break

        if best_seller_asin:
            return {"status": "best_seller", "asin": best_seller_asin}, None
        elif first_asin_fallback:
            return {"status": "top_result", "asin": first_asin_fallback}, None
        else:
            return {"status": "no_in_stock_results_found", "asin": None}, "No in-stock, non-sponsored products found."

    except httpx.HTTPStatusError as e:
        return {"status": "error", "asin": None}, f"ScraperAPI request failed: {e.response.status_code}"
    except Exception as e:
        return {"status": "error", "asin": None}, f"An error occurred: {e}"