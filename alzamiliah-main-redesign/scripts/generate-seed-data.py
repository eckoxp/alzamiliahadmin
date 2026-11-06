#!/usr/bin/env python3
"""
Parse the downloaded HTML and generate a TypeScript seed file with real apartment data.
"""
from bs4 import BeautifulSoup
import json
import re

HTML_FILE = '/Users/muhamed/Desktop/alzamiliah-website/alzamiliah-com-source/alzamiliah-admin/download/اضافة تفاصيل للمشروع رقم 28.html'

with open(HTML_FILE, 'r', encoding='utf-8') as f:
    html = f.read()

soup = BeautifulSoup(html, 'html.parser')
tables = soup.find_all('table')

# Map local file names to type-based image names for our public folder
IMAGE_MAP = {}

ts_lines = []
ts_lines.append('// Auto-generated from original site data')
ts_lines.append('export const project28Apartments = [')

for t_idx, table in enumerate(tables):
    building_num = t_idx + 1
    rows = table.find_all('tr')
    
    for row in rows[1:]:
        cells = row.find_all('td')
        if len(cells) < 20:
            continue
        
        name = cells[0].get_text(strip=True)
        
        # Image
        img = cells[1].find('img')
        img_src = ''
        if img:
            src = img.get('src', '')
            # Extract filename from path like ./xxx_files/a.jpg
            fname = src.split('/')[-1] if '/' in src else src
            img_src = f'/images/apartments/{fname}'
        
        # Type
        inp = cells[2].find('input')
        apt_type = inp.get('value', 'A') if inp else 'A'
        
        # Price (remove commas)
        inp = cells[3].find('input')
        price_str = (inp.get('value', '0') if inp else '0').replace(',', '')
        try:
            price = float(price_str)
        except:
            price = 0
        
        # Apartment number
        inp = cells[4].find('input')
        apt_num_str = (inp.get('value', '0') if inp else '0').replace(',', '')
        try:
            apt_num = int(apt_num_str)
        except:
            apt_num = 0
        
        # Status (select)
        sel = cells[5].find('select')
        status = 'available'
        if sel:
            selected = sel.find('option', selected=True)
            if selected:
                val = selected.get('value', '0')
                if val == '1':
                    status = 'sold'
                elif val == '2':
                    status = 'reserved'
                else:
                    status = 'available'
        
        # Private roof
        inp = cells[6].find('input')
        private_roof = inp.get('value', '0') if inp else '0'
        
        # Area
        inp = cells[7].find('input')
        area_str = (inp.get('value', '0') if inp else '0').replace(',', '')
        try:
            area = float(area_str)
        except:
            area = 0
        
        # Bathrooms
        inp = cells[8].find('input')
        bathrooms = int(inp.get('value', '0') or '0' if inp else '0') if inp else 0
        
        # Living room
        inp = cells[9].find('input')
        living = int(inp.get('value', '0') or '0' if inp else '0') if inp else 0
        
        # Kitchen
        inp = cells[10].find('input')
        kitchen = int(inp.get('value', '0') or '0' if inp else '0') if inp else 0
        
        # Bedrooms
        inp = cells[11].find('input')
        bedrooms = int(inp.get('value', '0') or '0' if inp else '0') if inp else 0
        
        # Maid room
        inp = cells[12].find('input')
        maid = int(inp.get('value', '0') or '0' if inp else '0') if inp else 0
        
        # Driver room
        inp = cells[13].find('input')
        driver = int(inp.get('value', '0') or '0' if inp else '0') if inp else 0
        
        # Storage
        inp = cells[14].find('input')
        storage = int(inp.get('value', '0') or '0' if inp else '0') if inp else 0
        
        # Two entrances
        inp = cells[15].find('input')
        two_entrances = int(inp.get('value', '0') or '0' if inp else '0') if inp else 0
        
        # Majlis
        inp = cells[16].find('input')
        majlis = int(inp.get('value', '0') or '0' if inp else '0') if inp else 0
        
        # Balcony
        inp = cells[17].find('input')
        balcony = int(inp.get('value', '0') or '0' if inp else '0') if inp else 0
        
        # Parking
        inp = cells[18].find('input')
        parking = int(inp.get('value', '0') or '0' if inp else '0') if inp else 0
        
        # Garden
        inp = cells[19].find('input')
        garden_str = inp.get('value', '0') if inp else '0'
        garden = int(garden_str or '0') if garden_str.strip() else 0
        
        # Entrance (checkbox)
        inp = cells[20].find('input')
        entrance = 1 if (inp and inp.has_attr('checked')) else 0
        
        ts_lines.append(f'  {{ nameAr: "{name}", buildingName: "مبنى رقم ({building_num})", type: "{apt_type}", price: {price}, apartmentNumber: {apt_num}, status: "{status}", area: {area}, bathrooms: {bathrooms}, livingRoom: {living}, kitchen: {kitchen}, bedrooms: {bedrooms}, maidRoom: {maid}, driverRoom: {driver}, storage: {storage}, entrance: {entrance}, majlis: {majlis}, balcony: {balcony}, parking: {parking}, garden: {garden}, cars: {parking}, image: "{img_src}" }},')

ts_lines.append('];')

output = '\n'.join(ts_lines)
OUT_FILE = '/Users/muhamed/Desktop/alzamiliah-website/alzamiliah-com-source/alzamiliah-nextjs/prisma/project28-data.ts'
with open(OUT_FILE, 'w', encoding='utf-8') as f:
    f.write(output)

print(f'✅ Generated {OUT_FILE}')
print(f'Total lines: {len(ts_lines)}')
