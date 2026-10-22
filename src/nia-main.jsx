import React from 'react';
import { createRoot } from 'react-dom/client';
import NiaApp from './NiaApp';
import './index.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <NiaApp />
  </React.StrictMode>
);
