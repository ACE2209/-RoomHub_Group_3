import React from 'react';
import ReactDOM from 'react-dom/client';
import './i18n';
import './index.css';
import App from './App';
import GlobalAlert, { installGlobalAlert } from './components/common/GlobalAlert';

// Replace every existing alert(...) / window.alert(...) with the custom modal.
installGlobalAlert();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
    <GlobalAlert />
  </React.StrictMode>
);
