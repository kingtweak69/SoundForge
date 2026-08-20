import React from 'react';
import Sidebar from './Sidebar';

export default function StudioLayout({ children }) {
  return (
    <div className="min-h-screen flex bg-studio-bg">
      <Sidebar />
      <main className="flex-1 min-w-0 h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  );
}