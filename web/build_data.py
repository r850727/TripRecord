import os
import glob
import re
import json

def extract_float(s):
    if not s:
        return 0
    s = str(s).replace(',', '').strip()
    match = re.search(r'^[-+]?\d*\.?\d+', s)
    if match:
        return float(match.group())
    return 0

def parse_markdown(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    trip_data = {
        "id": os.path.basename(filepath).replace(".md", ""),
        "title": "",
        "date_range": "",
        "sections": [],
        "currencyName": "外幣"
    }

    lines = content.split('\n')
    
    current_section = None
    is_parsing_date = False
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        if line.startswith('# '):
            trip_data['title'] = line.replace('# ', '').strip()
            is_parsing_date = False
        elif line.startswith('## 旅行日期'):
            is_parsing_date = True
        elif is_parsing_date and line.startswith('* '):
            if '匯率' in line:
                trip_data['exchange_rate'] = line.replace('* ', '').strip()
                # Parse the multiplier
                nums = re.findall(r'\d+\.?\d*', trip_data['exchange_rate'])
                if nums:
                    trip_data['exchange_rate_value'] = float(nums[-1])
                else:
                    trip_data['exchange_rate_value'] = 1.0
            else:
                trip_data['date_range'] = line.replace('* ', '').strip()
        elif line.startswith('### '):
            is_parsing_date = False
            section_name = line.replace('### ', '').strip()
            current_section = {
                "name": section_name,
                "items": []
            }
            trip_data['sections'].append(current_section)
        elif line.startswith('|') and current_section:
            # Check if it's a header or separator
            if '---' in line:
                continue
            
            # parse row
            parts = [p.strip() for p in line.split('|')[1:-1]]
            
            # Save currency name from header
            if '項目' in line and len(parts) >= 3:
                trip_data['currencyName'] = parts[2].strip()
                continue
                
            if len(parts) >= 5:
                # 項目	台幣	日幣(或其他幣)	備註	類型
                name = parts[0].replace('<br>', '\n').strip()
                twd_str = parts[1]
                local_str = parts[2]
                note = parts[3].replace('<br>', '\n').strip()
                type_ = parts[4].strip()
                
                twd = extract_float(twd_str)
                local = extract_float(local_str)

                current_section['items'].append({
                    "name": name,
                    "twd": twd,
                    "local": local,
                    "note": note,
                    "type": type_
                })
                
    return trip_data

def main():
    directory = r"e:\自助旅行花費紀錄"
    web_dir = os.path.join(directory, "web")
    os.makedirs(web_dir, exist_ok=True)
    
    all_data = []
    
    for filepath in glob.glob(os.path.join(directory, "*.md")):
        data = parse_markdown(filepath)
        if data['title'] or data['sections']:
            all_data.append(data)
            
    # sort by id descending (assuming ids are like 2026-03, 2025-08)
    all_data.sort(key=lambda x: x['id'], reverse=True)
            
    output_path = os.path.join(web_dir, "data.js")
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("const travelData = ")
        f.write(json.dumps(all_data, ensure_ascii=False, indent=2))
        f.write(";\n")
        
    print(f"Successfully generated {output_path}")

if __name__ == "__main__":
    main()
