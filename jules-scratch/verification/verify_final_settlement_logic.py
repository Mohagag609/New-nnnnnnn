import os
import re
from playwright.sync_api import sync_playwright, expect

def run_verification():
    """
    Verifies the final, corrected settlement logic, including 'paid by partner' expenses.
    """
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        file_path = "file://" + os.path.abspath("index.html")
        page.goto(file_path)
        page.wait_for_timeout(1000)

        # --- 1. Setup Data ---
        page.get_by_role("link", name="إدارة المشاريع").click()
        page.get_by_role("button", name="إضافة مشروع جديد").click()
        page.get_by_label("اسم المشروع").fill("Final Settlement Project")
        page.get_by_role("button", name="حفظ").click()
        expect(page.locator("#projectModal")).to_be_hidden()

        for name in ["Partner E", "Partner F"]:
            page.get_by_role("link", name="إدارة الشركاء").click()
            page.get_by_role("button", name="إضافة شريك جديد").click()
            expect(page.locator('#partner-project option:has-text("Final Settlement Project")')).to_be_attached()
            page.get_by_label("اسم الشريك").fill(name)
            page.locator("#partner-project").select_option(label="Final Settlement Project")
            page.get_by_role("button", name="حفظ").click()
            expect(page.locator("#partnerModal")).to_be_hidden()

        # --- 2. Create Contributions ---
        # Partner E: Normal contribution (Receipt)
        page.get_by_role("link", name="المعاملات والفواتير").click()
        page.get_by_role("button", name="إضافة معاملة جديدة").click()
        expect(page.locator('#transaction-partner option:has-text("Partner E")')).to_be_attached()
        page.get_by_label("نوع السند").select_option("قبض")
        page.get_by_label("المبلغ").fill("1000")
        page.get_by_label("إلى خزنة").select_option(label="خزنة التسويات")
        page.get_by_label("المشروع").select_option(label="Final Settlement Project")
        page.get_by_label("الشريك").select_option(label="Partner E")
        page.get_by_role("button", name="حفظ المعاملة").click()
        expect(page.locator("#transactionModal")).to_be_hidden()

        # Partner F: Expense paid on behalf of project
        page.get_by_role("button", name="إضافة معاملة جديدة").click()
        page.get_by_label("نوع السند").select_option("صرف")
        page.get_by_label("تم الدفع بواسطة").locator('input[value="partner"]').click()
        page.locator("#transaction-partner-payer").select_option(label="Partner F")
        page.get_by_label("المبلغ").fill("200")
        page.get_by_label("المشروع").select_option(label="Final Settlement Project")
        page.get_by_label("الوصف").fill("Marketing Expense")
        page.get_by_role("button", name="حفظ المعاملة").click()
        expect(page.locator("#transactionModal")).to_be_hidden()

        # --- 3. Verify Settlements Fix ---
        page.get_by_role("link", name="التسويات").click()
        expect(page.locator('#settlement-project-selector option:has-text("Final Settlement Project")')).to_be_attached()
        page.locator("#settlement-project-selector").select_option(label="Final Settlement Project")

        # Check the contributions table for correct data
        partner_e_row = page.locator('#settlement-partner-contributions-table tr:has-text("Partner E")')
        expect(partner_e_row).to_contain_text("1000.00")
        expect(partner_e_row).to_contain_text("دائن بمبلغ 400.00") # (1000 > 600 avg)

        partner_f_row = page.locator('#settlement-partner-contributions-table tr:has-text("Partner F")')
        expect(partner_f_row).to_contain_text("200.00")
        expect(partner_f_row).to_contain_text("مدين بمبلغ 400.00") # (200 < 600 avg)

        # --- 4. Screenshot ---
        screenshot_path = "jules-scratch/verification/settlement_calculation_verified.png"
        page.screenshot(path=screenshot_path)
        print("Screenshot saved.")

        browser.close()

if __name__ == "__main__":
    run_verification()
