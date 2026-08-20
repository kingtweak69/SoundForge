import React from 'react';

// Lightweight fake audio waveform rendered as bars
export default function Waveform({ data = [], color = '#00f0ff', height = 40, bars = 60, animate = false, glow = true }) {
  const values = data.length ? data.slice(0, bars) : Array.from({ length: bars }, () => Math.random() * 0.7 + 0.2);
  const shadow = glow ? `0 0 8px ${color}66` : 'none';
  return (
    <div className="flex items-end gap-[2px] w-full h-full" style={{ height }}>
      {values.map((v, i) => (
        <div
          key={i}
          className={`flex-1 rounded-sm ${animate ? 'animate-meter' : ''}`}
          style={{
            height: `${Math.max(4, v * 100)}%`,
            background: color,
            boxShadow: shadow,
            animationDelay: animate ? `${(i % 8) * 0.06}s` : undefined,
            minHeight: 3,
          }}
        />
      ))}
    </div>
  );
}