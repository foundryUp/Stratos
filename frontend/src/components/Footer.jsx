import React from 'react';

function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-300 py-6 text-center mt-10">
      <p>&copy; {new Date().getFullYear()} Your Website. All rights reserved.</p>
      <ul className="flex justify-center space-x-6 mt-4">
        <li>
          <a href="/privacy-policy" className="hover:text-white transition duration-300">Privacy Policy</a>
        </li>
        <li>
          <a href="/documentation" className="hover:text-white transition duration-300">Documentation</a>
        </li>
        <li>
          <a href="/governance" className="hover:text-white transition duration-300">Governance</a>
        </li>
        <li>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition duration-300">GitHub</a>
        </li>
      </ul>
    </footer>
  );
}

export default Footer;
