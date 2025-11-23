"use client";

import Sidebar from "@/components/sidebar/Sidebar";
import React, { useState } from "react";
import { Play, Stop, RotateCcw, Copy, Check, AlertCircle, Loader2 } from "lucide-react";

interface ApiResponse {
  status: number;
  data: any;
  timestamp: string;
  duration: number;
}

interface ApiTest {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  body?: string;
  headers?: Record<string, string>;
  description: string;
}

const API_TESTS: ApiTest[] = [
  {
    id: 'health',
    name: 'Health Check',
    method: 'GET',
    endpoint: '/health',
    description: 'Check if the backend is running'
  },
  {
    id: 'login',
    name: 'User Login',
    method: 'POST',
    endpoint: '/api/auth/login',
    body: JSON.stringify({
      email: 'demo@airguard.com',
      password: 'demo123'
    }, null, 2),
    headers: { 'Content-Type': 'application/json' },
    description: 'Authenticate with demo credentials'
  },
  {
    id: 'metrics',
    name: 'Dashboard Metrics',
    method: 'GET',
    endpoint: '/api/dashboard/metrics',
    headers: { 'Authorization': 'Bearer {{token}}' },
    description: 'Get dashboard metrics (requires auth)'
  },
  {
    id: 'devices',
    name: 'Get All Devices',
    method: 'GET',
    endpoint: '/api/devices',
    headers: { 'Authorization': 'Bearer {{token}}' },
    description: 'Get all user devices (requires auth)'
  },
  {
    id: 'create-device',
    name: 'Create Device',
    method: 'POST',
    endpoint: '/api/devices',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer {{token}}'
    },
    body: JSON.stringify({
      name: 'Test Device #001',
      deviceType: 'Environmental Monitor',
      firmwareVersion: 'v1.0.0',
      latitude: 33.8938,
      longitude: 35.5018,
      locationDescription: 'Test Location'
    }, null, 2),
    description: 'Create a new device (requires auth)'
  },
  {
    id: 'simulation-start',
    name: 'Start Simulation',
    method: 'POST',
    endpoint: '/api/simulation/start',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer {{token}}'
    },
    body: JSON.stringify({ intervalMs: 30000 }, null, 2),
    description: 'Start device simulation (requires auth)'
  },
  {
    id: 'simulation-stop',
    name: 'Stop Simulation',
    method: 'POST',
    endpoint: '/api/simulation/stop',
    description: 'Stop device simulation'
  }
];

export default function ApiTestPage() {
  const [responses, setResponses] = useState<Record<string, ApiResponse>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [authToken, setAuthToken] = useState<string>('');
  const [baseUrl, setBaseUrl] = useState<string>('http://localhost:3001');
  const [copied, setCopied] = useState<string>('');

  const runTest = async (test: ApiTest) => {
    setLoading(prev => ({ ...prev, [test.id]: true }));
    
    try {
      const startTime = Date.now();
      
      // Replace token placeholder
      const headers = { ...test.headers };
      if (headers['Authorization']) {
        headers['Authorization'] = headers['Authorization'].replace('{{token}}', authToken);
      }
      
      const response = await fetch(`${baseUrl}${test.endpoint}`, {
        method: test.method,
        headers: headers,
        body: test.body
      });
      
      const data = await response.json();
      const duration = Date.now() - startTime;
      
      setResponses(prev => ({
        ...prev,
        [test.id]: {
          status: response.status,
          data,
          timestamp: new Date().toISOString(),
          duration
        }
      }));
      
      // Auto-save token from login response
      if (test.id === 'login' && response.ok && data.data?.accessToken) {
        setAuthToken(data.data.accessToken);
      }
      
    } catch (error) {
      setResponses(prev => ({
        ...prev,
        [test.id]: {
          status: 0,
          data: { error: error instanceof Error ? error.message : 'Network error' },
          timestamp: new Date().toISOString(),
          duration: 0
        }
      }));
    } finally {
      setLoading(prev => ({ ...prev, [test.id]: false }));
    }
  };

  const runAllTests = async () => {
    for (const test of API_TESTS) {
      await runTest(test);
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const clearResponses = () => {
    setResponses({});
  };

  const copyResponse = async (testId: string) => {
    const response = responses[testId];
    if (response) {
      await navigator.clipboard.writeText(JSON.stringify(response, null, 2));
      setCopied(testId);
      setTimeout(() => setCopied(''), 2000);
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-400';
    if (status >= 400 && status < 500) return 'text-yellow-400';
    if (status >= 500) return 'text-red-400';
    return 'text-gray-400';
  };

  return (
    <>
      <Sidebar />
      <div className="ag-main-content min-h-screen bg-gradient-to-br from-ag-black via-ag-black to-ag-black/95 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8 mt-12 lg:mt-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-ag-white text-center md:text-left mb-2">
              API Testing Console
            </h1>
            <p className="text-ag-white/60 text-sm sm:text-base text-center md:text-left">
              Test and debug your Airguard backend APIs
            </p>
          </div>

          {/* Configuration */}
          <div className="bg-ag-black/50 backdrop-blur-sm border border-ag-green/20 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-ag-white mb-4">Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-ag-white/70 text-sm mb-2">Base URL</label>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-ag-black/40 border border-ag-white/20 rounded-lg text-ag-white focus:outline-none focus:border-ag-lime/50"
                  placeholder="http://localhost:3001"
                />
              </div>
              <div>
                <label className="block text-ag-white/70 text-sm mb-2">Auth Token</label>
                <input
                  type="text"
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                  className="w-full px-3 py-2 bg-ag-black/40 border border-ag-white/20 rounded-lg text-ag-white focus:outline-none focus:border-ag-lime/50"
                  placeholder="JWT token (auto-filled after login)"
                />
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={runAllTests}
              disabled={Object.values(loading).some(Boolean)}
              className="flex items-center gap-2 px-4 py-2 bg-ag-lime text-ag-black font-medium rounded-lg hover:bg-ag-lime/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Play className="w-4 h-4" />
              Run All Tests
            </button>
            <button
              onClick={clearResponses}
              className="flex items-center gap-2 px-4 py-2 bg-ag-black/40 border border-ag-white/20 text-ag-white rounded-lg hover:bg-ag-green/20 hover:border-ag-green/40 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Clear Results
            </button>
          </div>

          {/* API Tests Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {API_TESTS.map((test) => (
              <div key={test.id} className="bg-ag-black/50 backdrop-blur-sm border border-ag-green/20 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        test.method === 'GET' ? 'bg-blue-500/20 text-blue-400' :
                        test.method === 'POST' ? 'bg-green-500/20 text-green-400' :
                        test.method === 'PUT' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {test.method}
                      </span>
                      <h3 className="text-lg font-semibold text-ag-white">{test.name}</h3>
                    </div>
                    <p className="text-ag-white/60 text-sm mb-2">{test.description}</p>
                    <code className="text-xs text-ag-lime bg-ag-black/40 px-2 py-1 rounded">
                      {test.endpoint}
                    </code>
                  </div>
                  <button
                    onClick={() => runTest(test)}
                    disabled={loading[test.id]}
                    className="flex items-center gap-2 px-3 py-1.5 bg-ag-green/20 text-ag-white rounded-lg hover:bg-ag-green/30 disabled:opacity-50 transition-colors"
                  >
                    {loading[test.id] ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    Test
                  </button>
                </div>

                {/* Request Body */}
                {test.body && (
                  <div className="mb-4">
                    <label className="block text-ag-white/70 text-sm mb-2">Request Body</label>
                    <pre className="text-xs bg-ag-black/40 p-3 rounded border border-ag-white/10 text-ag-white/80 overflow-x-auto">
                      {test.body}
                    </pre>
                  </div>
                )}

                {/* Response */}
                {responses[test.id] && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-ag-white/70 text-sm">Response</label>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${getStatusColor(responses[test.id].status)}`}>
                          {responses[test.id].status} • {responses[test.id].duration}ms
                        </span>
                        <button
                          onClick={() => copyResponse(test.id)}
                          className="p-1 text-ag-white/60 hover:text-ag-white transition-colors"
                        >
                          {copied === test.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <pre className="text-xs bg-ag-black/40 p-3 rounded border border-ag-white/10 text-ag-white/80 overflow-x-auto max-h-48 overflow-y-auto">
                      {JSON.stringify(responses[test.id].data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-ag-black/30 border border-ag-green/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-ag-white mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-ag-lime" />
              How to Use
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-ag-white/70">
              <div>
                <h4 className="font-medium text-ag-white mb-2">Getting Started</h4>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Make sure your backend is running on the configured URL</li>
                  <li>Start with the "Health Check" to verify connectivity</li>
                  <li>Run "User Login" to get an auth token (auto-saved)</li>
                  <li>Test authenticated endpoints with the saved token</li>
                </ol>
              </div>
              <div>
                <h4 className="font-medium text-ag-white mb-2">Tips</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Use "Run All Tests" to test the entire API suite</li>
                  <li>Copy responses to clipboard for debugging</li>
                  <li>Check the status code and response time</li>
                  <li>Start simulation to see real-time data updates</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 