import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import DocsIndexPage from '@/app/docs/page';

jest.mock('fs', () => ({
  existsSync: () => true,
  readdirSync: () => ['api-contract.md', 'admin-dashboard.md'],
  readFileSync: (p: string) => {
    if (p.includes('api-contract')) return '# API Contract\nBody';
    if (p.includes('admin-dashboard')) return '# Admin Dashboard\nBody';
    return '# Unknown\n';
  }
}));

describe('DocsIndexPage', () => {
  it('renders documentation links', () => {
    render(<DocsIndexPage />);
    expect(screen.getByText('API Contract')).toBeInTheDocument();
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });
});
