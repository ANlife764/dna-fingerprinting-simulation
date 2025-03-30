# DNA Fingerprinting Simulation

## Project Overview
A full-stack web application that simulates DNA fingerprinting through restriction enzyme digestion and gel electrophoresis visualization. The system consists of:

- **Backend**: Flask server (Python) that processes DNA sequences and generates simulated gel images
- **Frontend**: React interface that allows users to input DNA sequences, select enzymes, and view results

## Features

### Core Functionality
- DNA sequence input with validation (A,T,G,C only)
- Multiple restriction enzyme selection
- Automatic random DNA sequence generation
- Restriction site visualization in input sequence
- Simulated gel electrophoresis image generation
- Fragment length analysis and display

### Technical Highlights
- Interactive sequence visualization with highlighted cut sites
- Multi-enzyme digestion support
- Customizable sequence length for random DNA generation
- Downloadable gel images
- Responsive design for various screen sizes

## Installation

### Prerequisites
- Node.js (v14+)
- Python (v3.7+)
- npm/yarn

### Backend Setup
1. Navigate to backend directory:
   cd backend/
   
2. Install Python dependencies:
   pip install flask flask-cors numpy opencv-python

3. Run the Flask server:
   python app.py
   

### Frontend Setup
1. Navigate to frontend directory:
   cd frontend/
   
2. Install dependencies:
   npm install
   
3. Start the development server:
   npm start
   

## Usage

1. **Input DNA Sequence**:
   - Paste a DNA sequence (A,T,G,C characters only)
   - OR generate a random sequence of specified length

2. **Select Restriction Enzymes**:
   - Choose one or multiple enzymes from the dropdown
   - Ctrl/Cmd-click to select multiple enzymes

3. **Run Simulation**:
   - Click "Run Simulation" to process the DNA
   - View digestion results and gel image

4. **View Results**:
   - Original sequence with highlighted cut sites
   - List of fragments sorted by size
   - Simulated gel electrophoresis image
   - Download option for gel image

## API Endpoints

### Backend API
- `GET /enzymes` - List available restriction enzymes
- `POST /simulate_fingerprint` - Process DNA sequence with selected enzymes
- `GET /static/<filename>` - Serve generated gel images

## Project Structure

```
dna-fingerprinting/
├── backend/
│   ├── app.py            # Flask server implementation
│   └── static/           # Generated gel images storage
└── frontend/
    ├── public/
    ├── src/
    │   ├── App.js        # Main React component
    │   ├── App.css       # Component styles
    │   └── ...           # Other React files
    └── package.json
```

## Technologies Used

### Backend
- Python 3
- Flask (web framework)
- OpenCV (image generation)
- NumPy (array processing)

### Frontend
- React (UI framework)
- Axios (HTTP client)
- CSS (styling)

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Future Enhancements
- Support for more restriction enzymes
- Additional visualization options
- Mobile-friendly interface improvements
- Export results as PDF report
- User authentication for saving simulations