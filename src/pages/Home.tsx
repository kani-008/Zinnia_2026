import React from 'react';
import { Link } from 'react-router-dom';

export const HomePage: React.FC = () => {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-3xl font-bold text-white">ZINNIA 2026</h1>
        <p className="text-slate-400 mt-1">
          Department of Computer Science & Engineering &bull; Government College of Engineering, Salem
        </p>
      </div>

      <div className="space-y-4">
        <p className="text-slate-300">
          National Level Technical Symposium &bull; 17 September 2026
        </p>

        <div className="flex gap-4 pt-2">
          <Link
            to="/register"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-sm transition-colors"
          >
            Register
          </Link>
          <Link
            to="/events"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg text-sm transition-colors"
          >
            View Events
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
