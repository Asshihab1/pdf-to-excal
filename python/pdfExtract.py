import sys
import json
import camelot
import pdfplumber
import os

def extract_with_camelot(pdf_path):
    try:
        tables = camelot.read_pdf(pdf_path, pages='all', flavor='stream')  
        all_data = []
        for table in tables:
            df = table.df
            headers = df.iloc[0].tolist()
            for _, row in df.iloc[1:].iterrows():
                row_dict = dict(zip(headers, row.tolist()))
                all_data.append(row_dict)
        if all_data:
            return all_data
    except Exception as e:
        print(f"Camelot error: {e}", file=sys.stderr)
    return []

def extract_with_pdfplumber(pdf_path):
    all_data = []
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                tables = page.extract_tables()
                for table in tables:
                    if len(table) < 2:
                        continue
                    headers = table[0]
                    for row in table[1:]:
                        if len(row) == len(headers):
                            row_dict = dict(zip(headers, row))
                            all_data.append(row_dict)
        return all_data
    except Exception as e:
        print(f"pdfplumber error: {e}", file=sys.stderr)
        return []

def main():
    if len(sys.argv) < 2:
        print("Usage: python smart_pdf_table_extractor.py <pdf_file>")
        return

    pdf_path = sys.argv[1]
    if not os.path.exists(pdf_path):
        print("PDF file not found.")
        return


    data = extract_with_camelot(pdf_path)


    if not data:
        data = extract_with_pdfplumber(pdf_path)


    print(json.dumps({
        "file": os.path.basename(pdf_path),
        "tables": data
    }, indent=2))

if __name__ == "__main__":
    main()
