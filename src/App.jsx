import React, { useState } from 'react';
import './App.css';
import { validateDate } from './dateDfa.js';

export default function App() {
  const [inputValue, setInputValue] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setResult(validateDate(inputValue));
  };

  return (
    <div className="app-container">
      <div className="validator-content">
        <h1 className="main-title">Date Format Validator</h1>
        <p className="main-subtitle">Strict MM/DD/YYYY Checker</p>

        <form onSubmit={handleSubmit} className="large-form">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="MM/DD/YYYY"
            className="large-input"
            maxLength={10}
          />
          <button type="submit" className="large-button">
            Verify Date
          </button>
        </form>

        {result && (
          <div className={`result-container ${result.valid ? 'success-bg' : 'error-bg'}`}>
            <h2>{result.valid ? 'Valid!' : 'Error!'}</h2>
            <p>{result.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}