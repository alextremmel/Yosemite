import React from 'react';
import { NavLink } from 'react-router-dom';

function Navbar({ onAddContentClick }) {
  return (
    <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">My App</h1>
            <nav className="flex items-center space-x-6">
                <NavLink 
                  to="/" 
                  className={({ isActive }) => 
                    isActive ? "text-indigo-600 font-semibold" : "text-gray-600 hover:text-indigo-600 font-medium"
                  }
                >
                  Library
                </NavLink>
                <NavLink 
                  to="/phrases" 
                  className={({ isActive }) => 
                    isActive ? "text-indigo-600 font-semibold" : "text-gray-600 hover:text-indigo-600 font-medium"
                  }
                >
                  Phrases
                </NavLink>
            </nav>
        </div>
    </header>
  );
}

export default Navbar;
