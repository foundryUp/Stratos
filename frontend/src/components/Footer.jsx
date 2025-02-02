import React from 'react';

function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-300 py-8 text-center mt-12">
      <p className="text-sm">
        &copy; {new Date().getFullYear()} Your Website. All rights reserved.
      </p>
      
      {/* Links Section */}
      <ul className="flex justify-center space-x-8 mt-6 text-lg">
        <li>
          <a href="/privacy-policy" className="hover:text-white transition duration-300 hover:underline">Privacy Policy</a>
        </li>
        <li>
          <a href="/documentation" className="hover:text-white transition duration-300 hover:underline">Documentation</a>
        </li>
        <li>
          <a href="/governance" className="hover:text-white transition duration-300 hover:underline">Governance</a>
        </li>
        <li>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition duration-300 hover:underline">
            GitHub
          </a>
        </li>
      </ul>

      {/* Social Media Links Section */}
      {/* <div className="flex justify-center space-x-6 mt-6">
        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-white transition duration-300">
          Twitter
        </a>
        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-white transition duration-300">
          LinkedIn
        </a>
        <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition duration-300">
          GitHub
        </a>
      </div> */}

      {/* Additional Info */}
      <div className="mt-6">
        <p className="text-xs text-gray-400">
          Crafted with ❤️ by our Team. Proudly built with Vite.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
