import React, { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  info?: ReactNode;
  backAction?: ReactNode;
}

export default function PageHeader({ title, subtitle, actions, info, backAction }: PageHeaderProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          {backAction && (
            <div className="flex-shrink-0">
              {backAction}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3 justify-end flex-wrap">
          {info}
          {actions}
        </div>
      </div>
    </div>
  );
}