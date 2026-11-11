import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import { bindDocumentToSettings } from './store/settingsStore';
import './styles.css';

bindDocumentToSettings();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
