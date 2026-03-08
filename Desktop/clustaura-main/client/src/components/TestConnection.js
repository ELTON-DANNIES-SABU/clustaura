
import React, { useEffect, useState } from 'react';

const TestConnection = () => {
    const [status, setStatus] = useState('Testing...');
    const [error, setError] = useState('');

    useEffect(() => {
        testConnection();
    }, []);

    const testConnection = async () => {
        try {
            const response = await fetch('/api/test');
            if (response.ok) {
                const data = await response.json();
                setStatus(`Connected: ${data.message}`);
            } else {
                setStatus('Connection failed');
                setError(`Status: ${response.status}`);
            }
        } catch (err) {
            setStatus('Connection error');
            setError(err.message);
        }
    };

    return (
        <div style={{ 
            padding: '20px', 
            margin: '20px', 
            border: '1px solid #ccc',
            borderRadius: '8px'
        }}>
            <h3>Backend Connection Test</h3>
            <p><strong>Status:</strong> {status}</p>
            {error && <p><strong>Error:</strong> {error}</p>}
            <button onClick={testConnection}>Test Again</button>
        </div>
    );
};

export default TestConnection;
