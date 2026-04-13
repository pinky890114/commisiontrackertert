import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PawPrint, Home as HomeIcon, Settings } from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-ragdoll-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-ragdoll-sea-blue p-2 rounded-xl group-hover:rotate-12 transition-transform">
                <PawPrint className="text-white w-6 h-6" />
              </div>
              <span className="font-bold text-xl tracking-tight text-ragdoll-seal">布偶貓繪圖委託</span>
            </Link>
            
            <nav className="flex items-center gap-4">
              <Link to="/" className="p-2 hover:bg-ragdoll-cream rounded-xl transition-colors">
                <HomeIcon className="w-5 h-5" />
              </Link>
              <Link to="/admin" className="p-2 hover:bg-ragdoll-cream rounded-xl transition-colors">
                <Settings className="w-5 h-5" />
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="bg-white border-t border-ragdoll-cream py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-ragdoll-seal/60 text-sm">
          <p>© 2024 布偶貓繪圖委託管理系統. All rights reserved.</p>
          <p className="mt-1 flex items-center justify-center gap-1">
            Made with <PawPrint className="w-3 h-3" /> for Ragdoll Lovers
          </p>
        </div>
      </footer>
    </div>
  );
}
