#!/usr/bin/env python3
"""
Scrape apartment data from the original Alzamiliah admin panel.
"""
import requests
from bs4 import BeautifulSoup
import json
import re
import os
import sys
import time

BASE_URL = "https://alzamiliah.com"
EMAIL = "abdullah@alzamiliah.com"
PASSWORD = "Aa123456Aa"

session = requests.Session()
session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'ar,en;q=0.5',
})

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'scraped_data')
os.makedirs(OUTPUT_DIR, exist_ok=True)

def login():
    """Login to the Laravel admin panel"""
    # Get login page for CSRF token
    print("1. Getting login page...")
    r = session.get(f"{BASE_URL}/ar/admin")
    print(f"   Status: {r.status_code}")
    
    soup = BeautifulSoup(r.text, 'html.parser')
    token_input = soup.find('input', attrs={'name': '_token'})
    csrf = token_input['value'] if token_input else None
    print(f"   CSRF: {csrf}")
    
    if not csrf:
        print("   ERROR: No CSRF token found!")
        return False
    
    # Login
    print("2. Logging in...")
    r = session.post(f"{BASE_URL}/ar/admin/Login_admin", data={
        '_token': csrf,
        'email': EMAIL,
        'password': PASSWORD,
        'lang': 'ar',
    }, allow_redirects=True)
    print(f"   Status: {r.status_code}, Final URL: {r.url}")
    
    # Check success
    if r.status_code == 200 and ('Dashboard' in r.url or 'admin' in r.url.lower()):
        print("   ✅ Login successful!")
        return True
    
    # Try to check by accessing a protected page
    r2 = session.get(f"{BASE_URL}/ar/Dashboard/details_page")
    print(f"   Test access: {r2.status_code}")
    if r2.status_code == 200:
        soup2 = BeautifulSoup(r2.text, 'html.parser')
        tables = soup2.find_all('table')
        if tables:
            print(f"   ✅ Login confirmed! Found {len(tables)} tables on projects page")
            return True
    
    print("   ❌ Login failed")
    # Save response for debug
    with open(os.path.join(OUTPUT_DIR, 'login_response.html'), 'w') as f:
        f.write(r.text[:10000])
    return False

def scrape_apartment_page(project_id):
    """Scrape apartment details for a specific project"""
    url = f"{BASE_URL}/ar/Dashboard/add_details_pro?id={project_id}"
    print(f"\n📦 Scraping apartments for project {project_id}...")
    
    r = session.get(url)
    print(f"   Status: {r.status_code}")
    
    if r.status_code != 200:
        return None
    
    # Save raw HTML
    html_file = os.path.join(OUTPUT_DIR, f'apartments_p{project_id}.html')
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(r.text)
    print(f"   Saved HTML: {html_file}")
    
    soup = BeautifulSoup(r.text, 'html.parser')
    
    # Parse buildings and apartments
    result = {
        'project_id': project_id,
        'buildings': []
    }
    
    # Find all tables (each table is one building's apartments)
    tables = soup.find_all('table')
    print(f"   Found {len(tables)} tables")
    
    for t_idx, table in enumerate(tables):
        building = {
            'building_number': t_idx + 1,
            'apartments': []
        }
        
        rows = table.find_all('tr')
        if not rows:
            continue
            
        # Get headers from first row
        header_cells = rows[0].find_all(['th', 'td'])
        headers = [h.get_text(strip=True) for h in header_cells]
        print(f"   Table {t_idx+1}: {len(rows)-1} rows, headers: {headers[:8]}...")
        
        # Parse data rows
        for row in rows[1:]:
            cells = row.find_all('td')
            if len(cells) < 5:
                continue
            
            cell_texts = [c.get_text(strip=True) for c in cells]
            
            # Try to extract image
            img = cells[0].find('img') if cells else None
            img_url = img.get('src', '') if img else ''
            
            apt = {
                'raw_cells': cell_texts,
                'image_url': img_url
            }
            building['apartments'].append(apt)
        
        result['buildings'].append(building)
    
    # Also look for building sections by divs/headers
    # The original uses collapsible sections with headers like "أضف عدد الشقق لمبنى رقم (1)"
    building_headers = soup.find_all(text=re.compile(r'مبنى\s*رقم|عدد\s*الشقق'))
    print(f"   Found {len(building_headers)} building section headers")
    
    # Save parsed result
    json_file = os.path.join(OUTPUT_DIR, f'apartments_p{project_id}.json')
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"   Saved JSON: {json_file}")
    
    return result

def scrape_projects():
    """Get list of projects from admin"""
    url = f"{BASE_URL}/ar/Dashboard/details_page"
    print("\n📋 Scraping projects list...")
    r = session.get(url)
    print(f"   Status: {r.status_code}")
    
    if r.status_code != 200:
        return []
    
    html_file = os.path.join(OUTPUT_DIR, 'projects_list.html')
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(r.text)
    
    soup = BeautifulSoup(r.text, 'html.parser')
    
    # Find project rows/links
    projects = []
    links = soup.find_all('a', href=re.compile(r'add_details_pro|edit_pro'))
    for link in links:
        href = link.get('href', '')
        id_match = re.search(r'id=(\d+)', href)
        if id_match:
            pid = int(id_match.group(1))
            projects.append({'id': pid, 'url': href})
    
    # Also check table rows
    tables = soup.find_all('table')
    for table in tables:
        rows = table.find_all('tr')
        for row in rows:
            cells = row.find_all('td')
            if cells:
                texts = [c.get_text(strip=True) for c in cells]
                print(f"   Row: {texts[:5]}")
    
    print(f"   Found {len(projects)} project links")
    return projects

# Main
if __name__ == '__main__':
    if login():
        projects = scrape_projects()
        
        # Scrape apartments for each project
        project_ids = [28, 29, 30, 31, 32, 33, 34, 37]
        if projects:
            project_ids = list(set(project_ids + [p['id'] for p in projects]))
        
        all_data = {}
        for pid in sorted(project_ids):
            data = scrape_apartment_page(pid)
            if data:
                all_data[pid] = data
            time.sleep(1)  # Be nice to the server
        
        # Save all data
        with open(os.path.join(OUTPUT_DIR, 'all_apartments.json'), 'w', encoding='utf-8') as f:
            json.dump(all_data, f, ensure_ascii=False, indent=2)
        print(f"\n✅ All data saved to {OUTPUT_DIR}/all_apartments.json")
    else:
        print("\n❌ Cannot proceed without login")
