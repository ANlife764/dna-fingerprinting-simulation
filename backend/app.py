from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import random
import numpy as np
import cv2
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Configuration
STATIC_DIR = os.path.join(os.path.dirname(__file__), 'static')
os.makedirs(STATIC_DIR, exist_ok=True)

# Enzyme database (now synced with frontend)
ENZYMES = {
    "EcoRI": "GAATTC",
    "HindIII": "AAGCTT",
    "BamHI": "GGATCC",
    "PstI": "CTGCAG"
}

# Standard DNA ladder sizes (in bp)
DNA_LADDER = [1000, 500, 200, 100, 50]

@app.route('/enzymes', methods=['GET'])
def get_enzymes():
    return jsonify({
        "enzymes": [{"name": name, "sequence": seq} for name, seq in ENZYMES.items()],
        "default": "EcoRI"
    })

def generate_dna_sequence(length=100):
    """Generate random DNA sequence with optional enzyme sites."""
    bases = ['A', 'T', 'G', 'C']
    return ''.join(
        random.choice(ENZYMES[random.choice(list(ENZYMES.keys()))]) 
        if random.random() < 0.15  # 15% chance to insert enzyme site
        else random.choice(bases) 
        for _ in range(length)
    )

def cut_dna(sequence, enzymes):
    """Cut DNA with one or more enzymes. Returns sorted fragments (longest first)."""
    if isinstance(enzymes, str):
        enzymes = [enzymes]
    
    cut_positions = []
    for enzyme in enzymes:
        enzyme_seq = ENZYMES.get(enzyme, "")
        if enzyme_seq:
            cut_positions.extend([
                i + len(enzyme_seq) 
                for i in range(len(sequence)) 
                if sequence.startswith(enzyme_seq, i)
            ])
    
    cut_positions = sorted(list(set(cut_positions)))  # Remove duplicates
    fragments = [
        sequence[i:j] 
        for i, j in zip([0] + cut_positions, cut_positions + [None])
        if sequence[i:j]  # Skip empty fragments
    ]
    return sorted(fragments, key=len, reverse=True)

def generate_gel_image(fragments, enzymes, ladder=DNA_LADDER):
    """Generate a gel image with experimental and ladder lanes."""
    img = np.ones((400, 600, 3), dtype=np.uint8) * 255  # White background
    
    # Draw gel apparatus
    cv2.rectangle(img, (50, 50), (550, 350), (240, 240, 240), -1)
    
    # Draw wells
    cv2.rectangle(img, (80, 70), (120, 90), (200, 200, 200), -1)  # Experimental
    cv2.rectangle(img, (480, 70), (520, 90), (200, 200, 200), -1)  # Ladder
    
    # Draw experimental bands
    if fragments:
        max_len = max(len(frag) for frag in fragments)
        for i, frag in enumerate(fragments):
            band_height = max(5, int(30 * (len(frag)/max_len)))
            y_pos = 100 + i * 40
            cv2.rectangle(img, (150, y_pos), (300, y_pos + band_height), 
                         (0, 0, 150), -1)  # Blue bands
            cv2.putText(img, f"{len(frag)}bp", (310, y_pos + band_height//2),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 200), 1)
    
    # Draw ladder bands
    for i, size in enumerate(ladder):
        y_pos = 100 + i * 50
        cv2.rectangle(img, (400, y_pos), (450, y_pos + 10), (0, 0, 0), -1)
        cv2.putText(img, f"{size}bp", (460, y_pos + 5), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)
    
    # Label lanes
    cv2.putText(img, f"{'+'.join(enzymes)} Digest", (150, 380), 
               cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 2)
    cv2.putText(img, "DNA Ladder", (400, 380), 
               cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 2)
    
    # Save image
    filename = f"gel_{datetime.now().strftime('%Y%m%d%H%M%S')}.png"
    cv2.imwrite(os.path.join(STATIC_DIR, filename), img)
    return filename

@app.route('/simulate_fingerprint', methods=['POST'])
def simulate_fingerprint():
    data = request.json
    dna_sequence = data.get('dna_sequence', '').upper().replace(" ", "")
    enzyme_input = data.get('enzyme', 'EcoRI')
    sequence_length = data.get('length', 100)  # New: customizable length
    
    # Validate input
    if not dna_sequence:
        dna_sequence = generate_dna_sequence(sequence_length)
    elif not all(c in 'ATGC' for c in dna_sequence):
        return jsonify({"error": "Invalid DNA sequence (only A, T, G, C allowed)"}), 400
    
    # Handle single enzyme or list
    enzymes = [enzyme_input] if isinstance(enzyme_input, str) else enzyme_input
    invalid_enzymes = [e for e in enzymes if e not in ENZYMES]
    if invalid_enzymes:
        return jsonify({"error": f"Invalid enzymes: {', '.join(invalid_enzymes)}"}), 400
    
    # Process digestion
    fragments = cut_dna(dna_sequence, enzymes)
    gel_image = generate_gel_image(fragments, enzymes)
    
    return jsonify({
        "dna_sequence": dna_sequence,
        "fragments": fragments,
        "gel_image": gel_image,
        "enzyme_used": enzymes,
        "ladder_sizes": DNA_LADDER
    })

@app.route('/static/<filename>')
def serve_gel_image(filename):
    return send_from_directory(STATIC_DIR, filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)