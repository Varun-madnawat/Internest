import pdfplumber
"""
A function named:
    1. extract_text_pdf
    

1. Scanning the extension of received file.
2. If file found to have .pdf extension --> Call (extract_text_pdf) function
"""

def extract_text_pdf(user_file):
    text_in_file = ""
    
    with pdfplumber.open(user_file) as file:
        for page in file.pages:
            text_on_page = page.extract_text()
            

            if text_on_page:
                text_in_file += text_on_page + "\n"
                
    return text_in_file

def extract_text(user_file):
    if user_file.endswith('.pdf'):
        return extract_text_pdf(user_file)
    
    return ""
