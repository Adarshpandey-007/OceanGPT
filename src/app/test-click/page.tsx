"use client";
import { useState } from 'react';

export default function TestClickPage() {
  const [clickCount, setClickCount] = useState(0);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">React Click Test</h1>
        
        <div className="space-y-4">
          <p className="text-gray-600">
            This is a minimal test page to verify React events are working.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <p className="text-sm font-medium text-blue-900 mb-2">
              Click count: <span className="text-2xl font-bold">{clickCount}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              console.log('TEST: Button clicked!');
              alert('Button click handler fired!');
              setClickCount(c => c + 1);
            }}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Click Me (Should alert + increment counter)
          </button>

          <button
            type="button"
            onClick={() => {
              console.log('TEST: Second button clicked');
              const input = document.createElement('input');
              input.type = 'file';
              input.onchange = () => console.log('File selected:', input.files?.[0]?.name);
              input.click();
            }}
            className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Test Programmatic File Picker
          </button>

          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>Expected behavior:</strong></p>
            <ul className="list-disc list-inside pl-2 space-y-1">
              <li>First button: Alert box + counter increases</li>
              <li>Second button: File picker opens</li>
              <li>Browser console: Log messages appear</li>
            </ul>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            If nothing happens when clicking, check browser console for errors.
            Open DevTools (F12) → Console tab before clicking.
          </p>
        </div>
      </div>
    </div>
  );
}
