import React from 'react';
import { useAuth } from '@/lib/AuthContext';

export default function StudioLogo({ collapsed = false }) {
  const { user } = useAuth();
  return (
    <div className="flex items-center gap-3">
      <div className="relative w-11 h-11 shrink-0 grid place-items-center rounded-xl bg-gradient-to-br from-neon-cyan/30 to-neon-purple/30 border border-neon-cyan/40 box-glow-cyan">
        <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
          <path d="M4 16c2 0 2-8 4-8s2 8 4 8 2-8 4-8 2 8 4 8" stroke="hsl(186 100% 50%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="11" stroke="hsl(270 91% 65%)" strokeWidth="1" opacity="0.5" />
        </svg>
      </div>
      {!collapsed && (
        <div className="leading-tight">
          <h1 className="font-display font-bold text-lg tracking-tight">
            <span className="neon-cyan text-glow-cyan">NEXUS</span> <span className="text-foreground/80">DAW</span>
          </h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Hybrid AI Studio</p>
        </div>
      )}
    </div>
  );
}