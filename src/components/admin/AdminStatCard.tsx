"use client";
import React from 'react';
import clsx from 'clsx';

interface AdminStatCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  status?: 'ok' | 'warn' | 'error' | 'neutral';
  loading?: boolean;
  error?: string | null;
}

const statusRing: Record<string, string> = {
  ok: 'ring-green-400/60',
  warn: 'ring-amber-400/60',
  error: 'ring-red-500/60',
  neutral: 'ring-ocean-300/40'
};

export function AdminStatCard({ title, value, subtitle, status = 'neutral', loading, error }: AdminStatCardProps) {
  return (
    <div className={clsx(
      'relative rounded-2xl p-5 bg-white/80 backdrop-blur border border-ocean-200/60 shadow-sm',
      'ring-1', statusRing[status],
      'flex flex-col gap-1 min-h-[110px]'
    )}>
      <div className="text-xs font-medium tracking-wide text-ocean-500 uppercase">{title}</div>
      {loading ? (
        <div className="mt-2 h-6 w-24 rounded bg-ocean-200/40 animate-pulse" aria-label="Loading" />
      ) : error ? (
        <div className="mt-1 text-sm text-red-600">{error}</div>
      ) : (
        <div className="text-2xl font-semibold text-ocean-900">{value}</div>
      )}
      {subtitle && (
        <div className="text-xs text-ocean-600/70 line-clamp-2">{subtitle}</div>
      )}
    </div>
  );
}

export default AdminStatCard;
