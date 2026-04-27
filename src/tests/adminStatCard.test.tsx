import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AdminStatCard } from '@/components/admin/AdminStatCard';

describe('AdminStatCard', () => {
  it('renders title and value', () => {
    render(<AdminStatCard title="Health" value="ok" />);
    expect(screen.getByText('Health')).toBeInTheDocument();
    expect(screen.getByText('ok')).toBeInTheDocument();
  });

  it('shows loading skeleton when loading', () => {
    render(<AdminStatCard title="Loading" value={0} loading />);
    const loadingEl = screen.getByLabelText('Loading');
    expect(loadingEl).toBeInTheDocument();
  });

  it('shows error when error prop provided', () => {
    render(<AdminStatCard title="Health" value="ok" error="Boom" />);
    expect(screen.getByText('Boom')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<AdminStatCard title="Profiles" value={12} subtitle="cached" />);
    expect(screen.getByText('cached')).toBeInTheDocument();
  });
});
