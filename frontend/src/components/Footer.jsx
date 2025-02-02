import React from "react";
import { Link, useNavigate } from "react-router-dom";
import Documentation from './Documentation';

function Footer() {
  const navigate = useNavigate(); 

  return (
    <footer className="bg-gray-800 text-gray-300 py-8 text-center mt-12">
      <p className="text-sm">
        &copy; {new Date().getFullYear()} Your Website. All rights reserved.
      </p>

      {/* Links Section */}
      <ul className="flex justify-center space-x-8 mt-6 text-lg">
        <li>
          <Link
            to="/privacy-policy"
            className="hover:text-white transition duration-300 hover:underline"
          >
            Privacy Policy
          </Link>
        </li>

        {/* Use button for navigate */}
        <li>
          <button
            onClick={() => navigate("/documentation.jsx")}
            className="hover:text-white transition duration-300 hover:underline"
          >
            Documentation
          </button>
        </li>

        <li>
          <Link
            to="/governance"
            className="hover:text-white transition duration-300 hover:underline"
          >
            Governance
          </Link>
        </li>
        <li>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition duration-300 hover:underline"
          >
            GitHub
          </a>
        </li>
      </ul>

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
