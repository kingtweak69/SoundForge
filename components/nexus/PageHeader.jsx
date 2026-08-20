import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PageHeader({ icon: Icon, title, subtitle, action }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="w-11 h-11 grid place-items-center rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 box-glow-cyan">
            <Icon size={20} className="text-neon-cyan" />
          </div>
        )}
        <div>
          <h1 className="font-display font-bold text-2xl tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}