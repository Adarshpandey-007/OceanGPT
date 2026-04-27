import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  breadcrumb?: { label: string; href?: string }[];
  dense?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, children, breadcrumb, dense }) => {
  return (
    <div className={`relative overflow-hidden ${dense ? 'pt-12 pb-10' : 'pt-16 pb-14'} px-6`}>      
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-floatchat-primary via-floatchat-secondary to-floatchat-primary" />
      <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_25%_30%,rgba(0,240,255,0.06),transparent_60%)]" />

      <div className="max-w-7xl mx-auto relative space-y-6">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="text-xs font-medium text-slate-500 flex flex-wrap gap-1" aria-label="Breadcrumb">
            {breadcrumb.map((b, i) => (
              <span key={i} className="flex items-center gap-1">
                {b.href ? (
                  <a href={b.href} className="hover:text-cyan-400 transition-colors rounded px-0.5">
                    {b.label}
                  </a>
                ) : (
                  <span className="text-white" aria-current="page">{b.label}</span>
                )}
                {i < breadcrumb.length - 1 && <span className="opacity-40">/</span>}
              </span>
            ))}
          </nav>
        )}
        <div className="flex flex-col md:flex-row md:items-end gap-6 md:gap-10">
          <div className="flex-1 space-y-4">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              {title}
            </h1>
            {subtitle && (
              <p className="max-w-2xl text-slate-400 text-sm md:text-base leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          {children && (
            <div className="flex flex-wrap gap-3 items-center">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
