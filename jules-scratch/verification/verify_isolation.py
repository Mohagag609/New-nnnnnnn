import os
from playwright.sync_api import sync_playwright, expect

def run_verification():
    """
    Verifies that the rest of the app works when settlements.js is disabled.
    """
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        file_path = "file://" + os.path.abspath("index.html")
        page.goto(file_path)
        page.wait_for_timeout(500)

        # Click on the "Partners" link
        page.get_by_role("link", name="إدارة الشركاء").click()

        # Assert that the partners section header is visible
        header = page.get_by_role("heading", name="إدارة الشركاء")
        expect(header).to_be_visible()

        print("Verification successful: Partners page is accessible.")

        browser.close()

if __name__ == "__main__":
    run_verification()
