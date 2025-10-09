import requests
import trafilatura

def get_bscscan_contract_data():
    """
    Get contract data from BSCScan
    """
    url = "https://bscscan.com/token/0x83E17aeB148d9b4b7Be0Be7C87dd73531a5a5738"
    
    try:
        # Fetch the page content
        downloaded = trafilatura.fetch_url(url)
        text = trafilatura.extract(downloaded)
        
        if text:
            print("BSCScan Token Data:")
            print("="*50)
            print(text)
            
            # Look for total supply specifically
            lines = text.split('\n')
            for i, line in enumerate(lines):
                if 'total supply' in line.lower() or 'totalsupply' in line.lower():
                    print(f"\nFound supply info at line {i}: {line}")
                    # Print surrounding lines for context
                    start = max(0, i-2)
                    end = min(len(lines), i+3)
                    print("Context:")
                    for j in range(start, end):
                        marker = ">>> " if j == i else "    "
                        print(f"{marker}{lines[j]}")
        else:
            print("No text extracted from BSCScan")
            
    except Exception as e:
        print(f"Error fetching BSCScan data: {e}")

if __name__ == "__main__":
    get_bscscan_contract_data()