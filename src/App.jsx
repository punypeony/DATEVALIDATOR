import React, { useState } from 'react';
import './App.css'; 

export default function App() {
  const [inputValue, setInputValue] = useState('');
  const [result, setResult] = useState(null);

  const validateDateLogic = (dateStr) => {
    // Length check
    if (dateStr.length !== 8) {
      return { valid: false, message: "Date must be exactly 8 characters long (MM/DD/YY)." };
    }

    // Slash placement check
    if (dateStr[2] !== '/' || dateStr[5] !== '/') {
      return { valid: false, message: "Missing or misplaced slashes. Format must be MM/DD/YY." };
    }

    // Manual part extraction
    const monthStr = dateStr.substring(0, 2);
    const dayStr = dateStr.substring(3, 5);
    const yearStr = dateStr.substring(6, 8);

    // Ensure parts are numbers
    const isNumber = (str) => /^\d+$/.test(str);
    if (!isNumber(monthStr) || !isNumber(dayStr) || !isNumber(yearStr)) {
      return { valid: false, message: "Month, day, and year must contain only numbers." };
    }

    const m = parseInt(monthStr, 10);
    const d = parseInt(dayStr, 10);
    const y = parseInt(yearStr, 10);

    // Month bounds
    if (m < 1 || m > 12) {
      return { valid: false, message: "Month must be between 01 and 12." };
    }

    // Days calculation with leap year
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    
    const isLeapYear = y % 4 === 0;
    if (isLeapYear) {
      daysInMonth[1] = 29;
    }

    // Day bounds
    const maxDays = daysInMonth[m - 1];
    if (d < 1 || d > maxDays) {
      return { valid: false, message: `Invalid day. Month ${monthStr} in year 20${yearStr} has a max of ${maxDays} days.` };
    }

    return { valid: true, message: "Date format is perfectly valid!" };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setResult(validateDateLogic(inputValue));
  };

  return (
    <div className="app-container">
      <div className="validator-content">
        <h1 className="main-title">Date Format Validator</h1>
        <p className="main-subtitle">Strict MM/DD/YY Checker</p>

        <form onSubmit={handleSubmit} className="large-form">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="MM/DD/YY"
            className="large-input"
            maxLength={8}
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