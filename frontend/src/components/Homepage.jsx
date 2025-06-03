import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Brain, Zap, MessageSquare, TrendingUp, ArrowRight, Coins } from 'lucide-react';
import Footer from './Footer.jsx'; // Ensure correct path and default import

function Homepage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`,
            }}
          >
            <Sparkles
              size={20 + Math.random() * 30}
              className="text-blue-500 opacity-30"
            />
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10">
        {/* Hero section */}
        <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
          <div className="animate-bounce-slow mb-8">
            <Brain size={80} className="text-blue-500" />
          </div>
          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse">
            Stratos
          </h1>
          <p className="text-xl md:text-2xl mb-12 max-w-2xl text-gray-300">
            Unleash the power of intelligent conversations with our next-generation AI assistant
          </p>

          {/* Feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
            <div
              onClick={() => navigate('/general')}
              className="group p-6 bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-2xl border border-gray-700 hover:border-blue-500 cursor-pointer transform hover:scale-105 transition-all duration-300"
            >
              <div className="flex items-center mb-4">
                <MessageSquare className="text-blue-500 mr-3" size={24} />
                <h3 className="text-xl font-semibold">General Assistant</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Your all-purpose AI companion for any task or conversation
              </p>
              <div className="flex items-center text-blue-500 group-hover:translate-x-2 transition-transform">
                Try Now <ArrowRight className="ml-2" size={20} />
              </div>
            </div>

            <div
              onClick={() => navigate('/trading')}
              className="group p-6 bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-2xl border border-gray-700 hover:border-green-500 cursor-pointer transform hover:scale-105 transition-all duration-300"
            >
              <div className="flex items-center mb-4">
                <TrendingUp className="text-green-500 mr-3" size={24} />
                <h3 className="text-xl font-semibold">Trading Assistant</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Expert analysis and insights for your trading decisions
              </p>
              <div className="flex items-center text-green-500 group-hover:translate-x-2 transition-transform">
                Start Trading <ArrowRight className="ml-2" size={20} />
              </div>
            </div>

            <div
              onClick={() => navigate('/defi')}
              className="group p-6 bg-gray-800 bg-opacity-50 backdrop-blur-lg rounded-2xl border border-gray-700 hover:border-purple-500 cursor-pointer transform hover:scale-105 transition-all duration-300"
            >
              <div className="flex items-center mb-4">
                <Coins className="text-purple-500 mr-3" size={24} />
                <h3 className="text-xl font-semibold">DeFi Assistant</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Interact with Aave protocol - deposit, borrow, repay, and withdraw
              </p>
              <div className="flex items-center text-purple-500 group-hover:translate-x-2 transition-transform">
                Start DeFi <ArrowRight className="ml-2" size={20} />
              </div>
            </div>
          </div>

          {/* Floating features */}
          <div className="absolute bottom-10 left-0 right-0 flex justify-center space-x-8 animate-float">
            <div className="flex items-center text-blue-400">
              <Zap size={20} className="mr-2" />
              <span>Real-time Responses</span>
            </div>
            <div className="flex items-center text-purple-400">
              <Brain size={20} className="mr-2" />
              <span>Advanced AI</span>
            </div>
            <div className="flex items-center text-pink-400">
              <Sparkles size={20} className="mr-2" />
              <span>24/7 Availability</span>
            </div>
          </div>
        </div>
      </div>
      <div>
       <Footer />
      </div>
    </div>
  );
}

export default Homepage;