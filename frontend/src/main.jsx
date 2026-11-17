import React from 'react';
import { createRoot } from 'react-dom/client';
import { FilterProvider } from './context/FilterContext';
import App from './App';
import './style.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <FilterProvider>
        <App />
      </FilterProvider>
    </React.StrictMode>
  );
}
