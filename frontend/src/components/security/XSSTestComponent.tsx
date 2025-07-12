/**
 * XSS Test Component - Security Validation
 * EbroValley Digital - Test sanitization effectiveness
 * 
 * ONLY FOR DEVELOPMENT - DO NOT INCLUDE IN PRODUCTION BUILDS
 */

import React, { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { sanitizeHtml, sanitizeText, sanitizeUserInput, SANITIZE_PRESETS } from '../../utils/sanitize';

interface XSSTestResult {
  input: string;
  sanitized: string;
  dangerous: boolean;
  blocked: boolean;
}

const XSSTestComponent: React.FC = () => {
  const [testInput, setTestInput] = useState('');
  const [results, setResults] = useState<XSSTestResult[]>([]);

  // Common XSS attack vectors for testing
  const xssTestVectors = [
    '<script>alert("XSS")</script>',
    '<img src="x" onerror="alert(\'XSS\')">',
    'javascript:alert("XSS")',
    '<svg onload="alert(\'XSS\')">',
    '<iframe src="javascript:alert(\'XSS\')"></iframe>',
    '<link rel="stylesheet" href="javascript:alert(\'XSS\')">',
    '<object data="javascript:alert(\'XSS\')">',
    '<embed src="javascript:alert(\'XSS\')">',
    '<form><button formaction="javascript:alert(\'XSS\')">',
    '<input onfocus="alert(\'XSS\')" autofocus>',
    '"><script>alert("XSS")</script>',
    '\'"--></style></script><script>alert("XSS")</script>',
    '<META HTTP-EQUIV="refresh" CONTENT="0;url=javascript:alert(\'XSS\')">',
    '<TABLE BACKGROUND="javascript:alert(\'XSS\')">',
    '<DIV STYLE="background-image: url(javascript:alert(\'XSS\'))">',
    '<IMG SRC="jav&#x09;ascript:alert(\'XSS\');">',
    '<IMG SRC="jav&#x0A;ascript:alert(\'XSS\');">',
    '<IMG SRC="jav&#x0D;ascript:alert(\'XSS\');">',
    '<IMG SRC=" &#14;  javascript:alert(\'XSS\');">',
    '<IMG SRC="javascript:alert(String.fromCharCode(88,83,83))">',
    '<IMG SRC=&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;&#97;&#108;&#101;&#114;&#116;&#40;&#39;&#88;&#83;&#83;&#39;&#41;>',
    '<IMG SRC=&#0000106&#0000097&#0000118&#0000097&#0000115&#0000099&#0000114&#0000105&#0000112&#0000116&#0000058&#0000097&#0000108&#0000101&#0000114&#0000116&#0000040&#0000039&#0000088&#0000083&#0000083&#0000039&#0000041>',
    '<IMG SRC="jav\u0000ascript:alert(\'XSS\');">',
    '<IMG SRC="jav\u0001ascript:alert(\'XSS\');">',
    '<IMG SRC="javascript:alert(\'XSS\')" width="0" height="0">'
  ];

  const testSanitization = (input: string, preset: keyof typeof SANITIZE_PRESETS = 'STRICT') => {
    const sanitized = sanitizeHtml(input, SANITIZE_PRESETS[preset]);
    const isDangerous = /(<script|javascript:|on\w+\s*=|<iframe|<object|<embed)/i.test(input);
    const wasBlocked = input !== sanitized;

    const result: XSSTestResult = {
      input,
      sanitized,
      dangerous: isDangerous,
      blocked: wasBlocked
    };

    setResults(prev => [...prev, result]);
    return result;
  };

  const runAllTests = () => {
    setResults([]);
    
    xssTestVectors.forEach(vector => {
      testSanitization(vector);
    });

    // Test with custom input if provided
    if (testInput.trim()) {
      testSanitization(testInput);
    }
  };

  const runSingleTest = () => {
    if (testInput.trim()) {
      const result = testSanitization(testInput);
      console.log('XSS Test Result:', result);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  // Only render in development
  if (import.meta.env.PROD) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 rounded-lg border border-gray-200">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Shield className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-bold text-gray-900">XSS Security Testing</h2>
          <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
            DEV ONLY
          </span>
        </div>
        <p className="text-gray-600 text-sm">
          Test the effectiveness of input sanitization against XSS attacks. 
          This component is only available in development mode.
        </p>
      </div>

      {/* Manual Test Input */}
      <div className="mb-6">
        <label htmlFor="testInput" className="block text-sm font-medium text-gray-700 mb-2">
          Test Custom Input:
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            id="testInput"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter potentially malicious input to test..."
          />
          <button
            onClick={runSingleTest}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
          >
            Test
          </button>
        </div>
      </div>

      {/* Test Controls */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={runAllTests}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500"
        >
          Run All XSS Tests ({xssTestVectors.length} vectors)
        </button>
        <button
          onClick={clearResults}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:ring-2 focus:ring-gray-500"
        >
          Clear Results
        </button>
      </div>

      {/* Results Display */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Test Results ({results.length})
          </h3>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                <span className="font-medium text-red-900">Dangerous Inputs</span>
              </div>
              <p className="text-2xl font-bold text-red-600">
                {results.filter(r => r.dangerous).length}
              </p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="font-medium text-green-900">Blocked</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {results.filter(r => r.blocked).length}
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-blue-600 mr-2" />
                <span className="font-medium text-blue-900">Success Rate</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {Math.round((results.filter(r => r.dangerous && r.blocked).length / Math.max(results.filter(r => r.dangerous).length, 1)) * 100)}%
              </p>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="space-y-2">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  result.dangerous && !result.blocked
                    ? 'bg-red-50 border-red-200'
                    : result.dangerous && result.blocked
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    {result.dangerous && !result.blocked ? (
                      <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                    ) : result.dangerous && result.blocked ? (
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    ) : (
                      <Shield className="h-4 w-4 text-gray-400 mr-2" />
                    )}
                    <span className="text-sm font-medium">
                      Test #{index + 1}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {result.dangerous && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                        Dangerous
                      </span>
                    )}
                    {result.blocked && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        Blocked
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <span className="text-xs font-medium text-gray-500">INPUT:</span>
                    <code className="block mt-1 p-2 bg-gray-100 rounded text-xs break-all">
                      {result.input}
                    </code>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-500">SANITIZED:</span>
                    <code className="block mt-1 p-2 bg-gray-100 rounded text-xs break-all">
                      {result.sanitized}
                    </code>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default XSSTestComponent;