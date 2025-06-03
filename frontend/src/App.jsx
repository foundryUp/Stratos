import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { MessageSquare, TrendingUp, Menu } from 'lucide-react';
import GeneralAI from './components/GeneralChat';
import DefiChat from './components/DefiChat';
import Homepage from './components/Homepage';
import TokenPortfolio from './components/TokenPortfolio';
import IntentAI2 from "./components/TradingChatRSIAlgos.jsx"

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-gray-100">
        <main className="w-full">
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/general" element={<GeneralAI />} />
            <Route path="/trading" element={<IntentAI2 />} />
            <Route path="/defi" element={<DefiChat />} />
            <Route path="/tokenPortfolio" element={<TokenPortfolio />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;