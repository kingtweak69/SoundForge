import React from 'react';

// Reusable studio knob component (rotary control)
export default function Knob({ value = 0.5, min = 0, max = 1, label = '', size = 48, onChange, accent = 'cyan' }) {
  const angle = -135 + (value - min) / (max - min) * 270;
  const accentColor = accent === 'purple' ? 'hsl(270 91% 65%)' : accent === 'magenta' ? 'hsl(315 100% 56%)' : 'hsl(186 100% 50%)';

  return (
    <div className="flex flex-col items-center gap-1.5 select-none">
      <div
        className="relative rounded-full border-2 border-studio-border bg-gradient-to-b from-studio-panel2 to-studio-bg cursor-pointer"
        style={{ width: size, height: size, boxShadow: `inset 0 2px 8px rgba(0,0,0,0.6)` }}
        onPointerDown={(e) => {
          e.preventDefault();
          const startY = e.clientY;
          const startVal = value;
          const move = (ev) => {
            const dy = startY - ev.clientY;
            const next = Math.max(min, Math.min(max, startVal + (dy / 100) * (max - min)));
            onChange && onChange(next);
          };
          const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
          window.addEventListener('pointermove', move);
          window.addEventListener('pointerup', up);
        }}
      >
        <div className="absolute inset-1 rounded-full bg-gradient-to-b from-zinc-800 to-black border border-zinc-700/40" />
        <div
          className="absolute inset-0 grid place-items-center"
          style={{ transform: `rotate(${angle}deg)` }}
        >
          <div
            className="w-[3px] h-[40%] rounded-full origin-bottom"
            style={{ background: accentColor, boxShadow: `0 0 6px ${accentColor}` }}
          />
        </div>
      </div>
      {label && <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</span>}
    </div>
  );
}