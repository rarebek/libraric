import React, { useState } from 'react';
import { SunIcon, MoonIcon, PlusIcon, FolderIcon } from '@heroicons/react/24/outline';

interface headerProps {
  onAddBook: () => void;
  onScanDirectory: () => void;
  onToggleDarkMode: () => void;
  darkMode: boolean;
}

const Header: React.FC<headerProps> = ({ onAddBook, onScanDirectory, onToggleDarkMode, darkMode }) => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm py-4 px-6 flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <span className="text-primary-600 dark:text-primary-400 text-2xl font-bold">libraric</span>
        <span className="text-gray-400 dark:text-gray-500">|</span>
        <span className="text-gray-500 dark:text-gray-400 text-sm">your ebook library</span>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={onAddBook}
          className="flex items-center space-x-1 bg-primary-500 hover:bg-primary-600 text-white px-3 py-1.5 rounded-md text-sm transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          <span>add book</span>
        </button>

        <button
          onClick={onScanDirectory}
          className="flex items-center space-x-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded-md text-sm transition-colors"
        >
          <FolderIcon className="w-4 h-4" />
          <span>scan folder</span>
        </button>

        <button
          onClick={onToggleDarkMode}
          className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors"
        >
          {darkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
};

export default Header;
