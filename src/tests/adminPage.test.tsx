import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminPage from '@/app/admin/page';

// Mock fetch globally
const mockFetch = (responses: Record<string, any>) => {
  global.fetch = jest.fn((input: RequestInfo) => {
    const url = typeof input === 'string' ? input : input.url;
    const match = Object.keys(responses).find(k => url.includes(k));
    const body = responses[match || ''] || {};
    return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
  }) as any;
};

describe('Admin Dashboard Page', () => {
  beforeEach(() => {
    mockFetch({
      '/api/health': { status: 'ok', timestamp: new Date().toISOString() },
      '/api/real/floats': { files: [{ id: '1901745' }], count: 1, dataDir: './ARGO-DATA' },
      '/api/real/profiles': { floats: ['1901745'], total: 1, cacheDir: './data/derived/profiles' }
    });
  });

  it('renders stat cards with fetched data', async () => {
    render(<AdminPage />);
    await waitFor(() => expect(screen.getByText(/Admin Dashboard/i)).toBeInTheDocument());
    // Wait for loading skeletons to disappear
    await waitFor(() => expect(screen.queryAllByLabelText('Loading').length).toBeLessThan(3));
    expect(screen.getByText(/Health/i)).toBeInTheDocument();
    expect(screen.getByText('ok')).toBeInTheDocument(); // health status
  // There are two '1' values (floats + profile caches); assert both present
  const ones = screen.getAllByText('1');
  expect(ones.length).toBeGreaterThanOrEqual(2);
  });
});
