import React, { useState } from 'react';
import { createApiInstance } from '../utils/apiConfig';

const ApiTest = () => {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testBackendConnection = async () => {
    setLoading(true);
    setResult('Testing...');
    
    try {
      console.log('Creating API instance...');
      const api = createApiInstance();
      console.log('API instance created:', api.defaults);
      
      // Test the docs endpoint first
      console.log('Testing /docs endpoint...');
      const docsResponse = await api.get('/docs');
      console.log('Docs response:', docsResponse.status);
      
      setResult(`✅ Backend connection successful!\nDocs endpoint: ${docsResponse.status}\nBase URL: ${api.defaults.baseURL}`);
      
    } catch (error) {
      console.error('Backend connection failed:', error);
      setResult(`❌ Backend connection failed:\n${error.message}\n${error.response?.status || 'No response'}`);
    } finally {
      setLoading(false);
    }
  };

  const testRegistration = async () => {
    setLoading(true);
    setResult('Testing registration...');
    
    try {
      const api = createApiInstance();
      
      const testData = {
        userName: 'reacttest' + Date.now(),
        email: `reacttest${Date.now()}@example.com`,
        password: 'testpass123',
        firstName: 'React',
        lastName: 'Test',
        phone: '555-0123',
        addressLine1: '123 React St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        timezone: 'America/New_York'
      };
      
      console.log('Testing registration with data:', testData);
      const response = await api.post('/api/auth/register', testData);
      console.log('Registration response:', response.data);
      
      setResult(`✅ Registration successful!\nUser ID: ${response.data.user_id}\nMessage: ${response.data.message}`);
      
    } catch (error) {
      console.error('Registration failed:', error);
      setResult(`❌ Registration failed:\n${error.message}\nStatus: ${error.response?.status}\nDetail: ${error.response?.data?.detail || 'No detail'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>API Test Component</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testBackendConnection} 
          disabled={loading}
          style={{ marginRight: '10px', padding: '10px' }}
        >
          Test Backend Connection
        </button>
        
        <button 
          onClick={testRegistration} 
          disabled={loading}
          style={{ padding: '10px' }}
        >
          Test Registration
        </button>
      </div>
      
      <pre style={{ 
        background: '#f5f5f5', 
        padding: '15px', 
        border: '1px solid #ddd',
        whiteSpace: 'pre-wrap',
        minHeight: '100px'
      }}>
        {result || 'Click a button to test the API...'}
      </pre>
    </div>
  );
};

export default ApiTest;
