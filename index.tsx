import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { NexusProvider } from './contexts/NexusContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ApiKeyModal from './components/ApiKeyModal';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Internal component to consume Auth Context
const SystemOverlay = () => {
    const { isModalOpen, saveKey } = useAuth();
    return <ApiKeyModal isOpen={isModalOpen} onSave={saveKey} />;
};

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
        <NexusProvider>
            <App />
            <SystemOverlay />
        </NexusProvider>
    </AuthProvider>
  </React.StrictMode>
);