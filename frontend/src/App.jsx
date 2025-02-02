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