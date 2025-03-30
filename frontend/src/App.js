import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [dnaSequence, setDnaSequence] = useState("");
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [enzymes, setEnzymes] = useState([]); // Now stores {name, sequence} objects
  const [selectedEnzymes, setSelectedEnzymes] = useState(["EcoRI"]);
  const [sequenceLength, setSequenceLength] = useState(100);

  // Fetch enzymes from backend on startup
  useEffect(() => {
    axios.get("http://localhost:5000/enzymes")
      .then(res => {
        setEnzymes(res.data.enzymes);
        setSelectedEnzymes([res.data.default]);
      })
      .catch(err => setError("Failed to load enzymes"));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await axios.post("http://localhost:5000/simulate_fingerprint", {
        dna_sequence: dnaSequence,
        enzyme: selectedEnzymes,
        length: sequenceLength
      });
      
      setResponse({
        ...res.data,
        fragments: res.data.fragments.sort((a, b) => b.length - a.length)
      });
      
    } catch (err) {
      setError(err.response?.data?.error || "Error processing request");
    } finally {
      setIsLoading(false);
    }
  };

  const generateRandomSequence = () => {
    setDnaSequence(generateRandomDNA(sequenceLength));
  };

  const generateRandomDNA = (length) => {
    const bases = ['A', 'T', 'G', 'C'];
    return Array(length).fill(0).map(() => 
      Math.random() < 0.15 && enzymes.length > 0 ? 
      enzymes[Math.floor(Math.random() * enzymes.length)].sequence :
      bases[Math.floor(Math.random() * 4)]
    ).join('');
  };

  const downloadGelImage = () => {
    if (!response?.gel_image) return;
    const link = document.createElement('a');
    link.href = `http://localhost:5000/static/${response.gel_image}`;
    link.download = `dna_fingerprint_${selectedEnzymes.join('+')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const highlightCutSites = (sequence, enzymeNames) => {
    // Get recognition sequences for selected enzymes
    const enzymeSeqs = enzymeNames.map(name => {
      const enzyme = enzymes.find(e => e.name === name);
      return enzyme ? enzyme.sequence : null;
    }).filter(Boolean);

    if (enzymeSeqs.length === 0) {
      return sequence.split('').map((base, i) => (
        <span key={i} className={`base-${base.toLowerCase()}`}>{base}</span>
      ));
    }

    // Split sequence by all enzyme sites
    const parts = sequence.split(new RegExp(`(${enzymeSeqs.join('|')})`));
    
    return parts.map((part, i) => {
      if (enzymeSeqs.includes(part)) {
        return <span key={i} className="cut-site">[{part}]</span>;
      }
      return (
        <span key={i} className="sequence-part">
          {part.split('').map((base, j) => (
            <span key={j} className={`base-${base.toLowerCase()}`}>{base}</span>
          ))}
        </span>
      );
    });
  };

  return (
    <div className="app-container">
      <h1>DNA Fingerprinting Simulator</h1>
      
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>DNA Sequence (A,T,G,C only):</label>
          <textarea
            value={dnaSequence}
            onChange={(e) => setDnaSequence(e.target.value.toUpperCase())}
            placeholder="e.g., GGATCCAGCT..."
            rows={5}
          />
        </div>
        
        <div className="controls">
          <div className="enzyme-selector">
            <label>Restriction Enzyme(s):</label>
            <select 
              multiple
              value={selectedEnzymes}
              onChange={(e) => 
                setSelectedEnzymes(
                  Array.from(e.target.selectedOptions, opt => opt.value)
                )
              }
              size={4}
            >
              {enzymes.map(enzyme => (
                <option key={enzyme.name} value={enzyme.name}>
                  {enzyme.name} ({enzyme.sequence})
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>Sequence Length (for random DNA):</label>
            <input
              type="number"
              min="50"
              max="10000"
              value={sequenceLength}
              onChange={(e) => setSequenceLength(Math.max(50, parseInt(e.target.value) || 100))}
            />
          </div>
          
          <div className="button-group">
            <button type="button" onClick={generateRandomSequence}>
              Random DNA
            </button>
            <button type="button" onClick={() => setDnaSequence("")}>
              Clear
            </button>
            <button type="submit" disabled={isLoading}>
              {isLoading ? "Processing..." : "Run Simulation"}
            </button>
          </div>
        </div>
      </form>

      {error && <div className="error">{error}</div>}

      {response && (
        <div className="results">
          <div className="result-section">
            <h2>Results for {response.enzyme_used.join(' + ')} Digestion</h2>
            <div className="sequence-box">
              <h3>Original Sequence ({response.dna_sequence.length} bp):</h3>
              <div className="sequence-display">
                {highlightCutSites(response.dna_sequence, response.enzyme_used)}
              </div>
            </div>
          </div>

          <div className="result-section">
            <h3>Restriction Fragments ({response.fragments.length}):</h3>
            <div className="fragments-list">
              {response.fragments.map((frag, i) => (
                <div key={i} className="fragment-item">
                  <div className="fragment-info">
                    <span className="fragment-label">Fragment {i+1}:</span>
                    <span className="fragment-length">{frag.length} bp</span>
                  </div>
                  <div className="fragment-sequence">
                    {frag.substring(0, 15)}...{frag.substring(frag.length - 15)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="result-section">
            <h3>Gel Electrophoresis</h3>
            <div className="gel-comparison">
              <div className="gel-image-container">
                <img 
                  src={`http://localhost:5000/static/${response.gel_image}`} 
                  alt={`Gel for ${response.enzyme_used.join('+')}`}
                  className="gel-image"
                />
                <div className="download-btn-container">
                  <button onClick={downloadGelImage} className="download-btn">
                    Download Gel Image
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;