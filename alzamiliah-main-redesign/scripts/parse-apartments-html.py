#!/usr/bin/env python3
"""
Parse the downloaded original page HTML to extract all apartment data for project 28.
"""
from bs4 import BeautifulSoup
import json
import re

HTML_FILE = '/Users/muhamed/Desktop/alzamiliah-website/alzamiliah-com-source/alzamiliah-admin/download/اضافة تفاصيل للمشروع رقم 28.html'

with open(HTML_FILE, 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')

tables = soup.find_all('table')
print(f'Found {len(tables)} tables (buildings)\n')

all_buildings = []

for t_idx, table in enumerate(tables):
    building = {
        'building_number': t_idx + 1,
        'apartments': []
    }
    
    rows = table.find_all('tr')
    # Skip header row
    for row in rows[1:]:
        cells = row.find_all('td')
        if len(cells) < 20:
            continue
        
        apt = {}
        
        # Cell 0: Apartment name text
        apt['name'] = cells[0].get_text(strip=True)
        
        # Cell 1: Image - look for img tag
        img = cells[1].find('img')
        apt['image'] = img.get('src', '') if img else ''
        
        # Cell 2: Type - look for input
        inp = cells[2].find('input')
        apt['type'] = inp.get('value', 'A') if inp else 'A'
        
        # Cell 3: Price
        inp = cells[3].find('input')
        apt['price'] = inp.get('value', '0') if inp else '0'
        
        # Cell 4: Apartment number
        inp = cells[4].find('input')
        apt['apartmentNumber'] = inp.get('value', '0') if inp else '0'
        
        # Cell 5: Availability (select)
        sel = cells[5].find('select')
        if sel:
            selected = sel.find('option', selected=True)
            apt['status'] = selected.get('value', 'available') if selected else 'available'
        else:
            apt['status'] = 'available'
        
        # Cell 6: Private roof (سطح خاص)
        inp = cells[6].find('input')
        apt['privateRoof'] = inp.get('value', '0') if inp else '0'
        
        # Cell 7: Area (المساحه)
        inp = cells[7].find('input')
        apt['area'] = inp.get('value', '0') if inp else '0'
        
        # Cell 8: Bathrooms
        inp = cells[8].find('input')
        apt['bathrooms'] = inp.get('value', '0') if inp else '0'
        
        # Cell 9: Living room (صالة عائلية)
        inp = cells[9].find('input')
        apt['livingRoom'] = inp.get('value', '0') if inp else '0'
        
        # Cell 10: Kitchen
        inp = cells[10].find('input')
        apt['kitchen'] = inp.get('value', '0') if inp else '0'
        
        # Cell 11: Bedrooms
        inp = cells[11].find('input')
        apt['bedrooms'] = inp.get('value', '0') if inp else '0'
        
        # Cell 12: Maid room
        inp = cells[12].find('input')
        apt['maidRoom'] = inp.get('value', '0') if inp else '0'
        
        # Cell 13: Driver room
        inp = cells[13].find('input')
        apt['driverRoom'] = inp.get('value', '0') if inp else '0'
        
        # Cell 14: Storage
        inp = cells[14].find('input')
        apt['storage'] = inp.get('value', '0') if inp else '0'
        
        # Cell 15: Two entrances (مدخلين)
        inp = cells[15].find('input')
        apt['twoEntrances'] = inp.get('value', '0') if inp else '0'
        
        # Cell 16: Majlis
        inp = cells[16].find('input')
        apt['majlis'] = inp.get('value', '0') if inp else '0'
        
        # Cell 17: Balcony/Terrace (شرفة)
        inp = cells[17].find('input')
        apt['balcony'] = inp.get('value', '0') if inp else '0'
        
        # Cell 18: Parking (موقف سيارات)
        inp = cells[18].find('input')
        apt['parking'] = inp.get('value', '0') if inp else '0'
        
        # Cell 19: Garden (حديقة خلفية)
        inp = cells[19].find('input')
        apt['garden'] = inp.get('value', '0') if inp else '0'
        
        # Cell 20: Private entrance (مدخل خاص) - checkbox
        inp = cells[20].find('input')
        if inp:
            apt['entrance'] = 1 if inp.has_attr('checked') else 0
        else:
            apt['entrance'] = 0
        
        building['apartments'].append(apt)
    
    all_buildings.append(building)
    print(f'Building {t_idx+1}: {len(building["apartments"])} apartments')
    # Print first 3 apartments
    for a in building['apartments'][:3]:
        print(f'  {a["name"]}: type={a["type"]}, price={a["price"]}, area={a["area"]}, bed={a["bedrooms"]}, bath={a["bathrooms"]}, living={a["livingRoom"]}, kitchen={a["kitchen"]}, maid={a["maidRoom"]}, driver={a["driverRoom"]}, majlis={a["majlis"]}, balcony={a["balcony"]}, parking={a["parking"]}, garden={a["garden"]}, img={a["image"][:60] if a["image"] else "none"}')

# Save all data
output = {
    'project_id': 28,
    'buildings': all_buildings
}

OUTPUT_FILE = '/Users/muhamed/Desktop/alzamiliah-website/alzamiliah-com-source/alzamiliah-nextjs/scraped_data/project28_real.json'
import os
os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f'\n✅ Saved to {OUTPUT_FILE}')
total = sum(len(b['apartments']) for b in all_buildings)
print(f'Total apartments: {total}')

# Count images
img_count = sum(1 for b in all_buildings for a in b['apartments'] if a['image'])
print(f'Apartments with images: {img_count}')
