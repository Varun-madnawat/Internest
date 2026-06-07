import pdfplumber
from collections import Counter

"""
This file will basically find text from pdf using pdfplumer
and gets their fontsize, font name, positions and other details.
This will be used to find the sections in the pdf.
Then those section will be sent to layer 2 for further processing.

"""


def styled_text(user_file):
    lines_with_style = []
    
    with pdfplumber.open(user_file) as pdf:
        for page_num, page in enumerate(pdf.pages, start = 1):
            words = page.extract_words(extra_attrs = ["fontname", "size"], x_tolerance=2)
            
            # Sort words by vertical position then horizontal
            words_sorted = sorted(words, key = lambda w: (w['top'], w['x0']))
            
            line_groups = []
            for w in words_sorted:
                if line_groups and abs(w['top'] - line_groups[-1][-1]['top']) <= 3:
                    line_groups[-1].append(w)
                else:
                    line_groups.append([w])
            
            for line_words in line_groups:
                raw_text = ' '.join(w['text'] for w in line_words)
                # Replace unicode bullet characters with •
                text = raw_text.replace('\uf06c', '•').replace('\uf0b7', '•')
                avg_font_size = sum(w['size'] for w in line_words) / len(line_words)
                is_bold = any("Bold" in w['fontname'] for w in line_words if w.get('fontname'))
                y = round(line_words[0]['top'])
                x0 = line_words[0]['x0']
                
                
                lines_with_style.append({
                    'text': text,
                    'font_size': avg_font_size,
                    'is_bold': is_bold,
                    'y': y,
                    'x0': x0,
                    "page": page_num
                })
    
    # Sort by page then y for correct reading order
    lines_with_style.sort(key = lambda l: (l['page'], l['y']))
    
    # Remove duplicate lines (same text on same page = overlapping PDF layers)
    seen = set()
    unique_lines = []
    for line in lines_with_style:
        key = (line['text'], line['page'])
        if key not in seen:
            seen.add(key)
            unique_lines.append(line)
    
    return unique_lines


def body_font_lines(lines):
    sizes = [round(line['font_size']) for line in lines]
    return Counter(sizes).most_common(1)[0][0]


if __name__ == "__main__":
    import sys
    lines = styled_text(r"Backend\Varun Madnawat_dA.pdf")
    body_size = body_font_lines(lines)
    print(body_size)
    print(lines)
