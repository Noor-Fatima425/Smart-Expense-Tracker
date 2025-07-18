from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import pytesseract
import os
import re

app = Flask(__name__)
CORS(app)

pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

@app.route('/api/ocr-upload', methods=['POST'])
def ocr_upload():
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400

    image_file = request.files['image']
    image = Image.open(image_file)

    text = pytesseract.image_to_string(image)
    print("OCR Output:\n", text)
    lines = text.split('\n')
    amount = None
    description = None
    for line in lines:
        if re.search(r'\b(total|total amount|total payable)\b', line, re.IGNORECASE):
            # Look for amounts after the "total" line
            for part in line.split():
                if '₹' in part or 'RS' in part or '$' in part:
                    match = re.search(r'[\d,]+(?:\.\d{1,2})?', part)
                    if match:
                        amount = match.group(0)
                        break
        
        elif re.search(r'\b(security|maintenance)\b', line, re.IGNORECASE):
            description = line.strip()

    if not amount:
        for line in lines:
            if '₹' in line or 'RS' in line or '$' in line:
                if '₹' in line:
                    parts = line.split('₹')
                elif 'RS' in line:
                    parts = line.split('RS')
                elif '$' in line:
                    parts = line.split('$')
                
                match = re.search(r'[\d,]+(?:\.\d{1,2})?', parts[1].strip())
                if match:
                    amount = match.group(0)
                    break

    return jsonify({
        'amount': amount or '',
        'description': description or 'Bill Payment'
    })

@app.route('/')
def index():
    return 'OCR server is up and running!'

if __name__ == '__main__':
    app.run(port=8000, debug=True)
