const style = document.createElement('style');
style.textContent = `
  @keyframes scaleIn {
    0% { opacity: 0; transform: scale(0.6); }
    100% { opacity: 1; transform: scale(1); }
  }

  @keyframes slideIn {
    0% { opacity: 0; transform: translateY(-8px); }
    100% { opacity: 1; transform: translateY(0); }
  }

  @keyframes toastIn {
    0% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
    100% { opacity: 1; transform: translateX(-50%) translateY(0); }
  }

  @keyframes hoverPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(167,139,250,0); }
    50% { box-shadow: 0 0 0 3px rgba(167,139,250,0.2); }
  }

  *::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  *::-webkit-scrollbar-track {
    background: transparent;
  }

  *::-webkit-scrollbar-thumb {
    background: #334155;
    border-radius: 3px;
    transition: background 0.15s ease;
  }

  *::-webkit-scrollbar-thumb:hover {
    background: #a78bfa;
  }

  * {
    scrollbar-width: thin;
    scrollbar-color: #334155 transparent;
  }

  button:hover {
    filter: brightness(1.1);
  }

  button:active {
    transform: scale(0.97);
  }

  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    background: transparent;
    cursor: pointer;
  }

  input[type="range"]::-webkit-slider-runnable-track {
    background: #334155;
    height: 4px;
    border-radius: 2px;
    transition: background 0.15s ease;
  }

  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #a78bfa;
    margin-top: -5px;
    box-shadow: 0 0 0 2px #0f0f1a;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  input[type="range"]:hover::-webkit-slider-thumb {
    transform: scale(1.15);
    box-shadow: 0 0 0 2px #0f0f1a, 0 0 10px rgba(167,139,250,0.6);
  }

  input[type="range"]::-moz-range-track {
    background: #334155;
    height: 4px;
    border-radius: 2px;
  }

  input[type="range"]::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #a78bfa;
    border: 2px solid #0f0f1a;
  }

  input[type="text"]:focus,
  input[type="color"]:focus {
    outline: none;
    border-color: #a78bfa !important;
    box-shadow: 0 0 0 2px rgba(167,139,250,0.15);
  }
`;
document.head.appendChild(style);

export {};
