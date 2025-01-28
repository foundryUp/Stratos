import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { MessageSquare, TrendingUp, Menu } from 'lucide-react';
import GeneralChat from './components/GeneralChat';
import TradingChat from './components/TradingChat';
import Homepage from './components/Homepage';

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-gray-100">
        <nav className="bg-gray-800 border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <NavLink to="/" className="text-xl font-bold text-blue-500 hover:text-blue-400 transition-colors">
                  IntentAI
                </NavLink>
              </div>
              
              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="text-gray-400 hover:text-white"
                >
                  <Menu size={24} />
                </button>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex space-x-4">
                <NavLink
                  to="/general"
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2 rounded-md ${
                      isActive
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`
                  }
                >
                  <MessageSquare className="mr-2" size={20} />
                  General
                </NavLink>
                <NavLink
                  to="/trading"
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2 rounded-md ${
                      isActive
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`
                  }
                >
                  <TrendingUp className="mr-2" size={20} />
                  Trading
                </NavLink>
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'}`}>
            <div className="px-2 pt-2 pb-3 space-y-1">
              <NavLink
                to="/general"
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 rounded-md ${
                    isActive
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`
                }
                onClick={() => setIsMenuOpen(false)}
              >
                <MessageSquare className="mr-2" size={20} />
                General
              </NavLink>
              <NavLink
                to="/trading"
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 rounded-md ${
                    isActive
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`
                }
                onClick={() => setIsMenuOpen(false)}
              >
                <TrendingUp className="mr-2" size={20} />
                Trading
              </NavLink>
            </div>
          </div>
        </nav>

        <main className="w-full">
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/general" element={<GeneralChat />} />
            <Route path="/trading" element={<TradingChat />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;