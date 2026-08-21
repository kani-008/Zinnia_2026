import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const WebsiteNavbar: React.FC = () => {
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Events', path: '/events' },
    { name: 'About', path: '/story' },
    { name: 'Register', path: '/register' },
    { name: 'Pass', path: '/passport' }
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-6 py-3">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link to="/" className="font-bold text-white text-base">
          ZINNIA 2026
        </Link>

        <nav className="flex gap-5 text-xs">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`hover:text-white transition-colors ${
                location.pathname === link.path ? 'text-indigo-400 font-semibold' : 'text-slate-400'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
};
