import React, { useState } from 'react';
import { XMarkIcon, CheckIcon, FolderIcon } from '@heroicons/react/24/outline';
import { OpenDirectoryPicker } from '../../wailsjs/go/main/App';

interface directoryScanModalProps {
  onClose: () => void;
  onSubmit: (path: string) => void;
}

const DirectoryScanModal: React.FC<directoryScanModalProps> = ({ onClose, onSubmit }) => {
  const [directoryPath, setDirectoryPath] = useState('');
  const [dirPickerOpen, setDirPickerOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(directoryPath);
  };

  const handleDirectorySelect = async () => {
    try {
      setDirPickerOpen(true);
      const selectedPath = await OpenDirectoryPicker();

      if (selectedPath) {
        setDirectoryPath(selectedPath);
      }
    } catch (error) {
      console.error('error selecting directory:', error);
    } finally {
      setDirPickerOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden max-w-md w-full">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">scan directory for ebooks</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              select a directory to scan for ebook files (pdf, epub, mobi, azw, azw3). all found ebooks will be added to your library.
            </p>

            <label htmlFor="directory-path" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              directory path
            </label>
            <div className="flex">
              <input
                id="directory-path"
                type="text"
                value={directoryPath}
                onChange={(e) => setDirectoryPath(e.target.value)}
                className="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md shadow-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                placeholder="path to your ebooks folder"
                required
              />
              <button
                type="button"
                onClick={handleDirectorySelect}
                disabled={dirPickerOpen}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-r-md flex items-center justify-center disabled:opacity-50"
              >
                <FolderIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              className="w-full flex justify-center items-center space-x-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-md transition-colors"
            >
              <CheckIcon className="w-5 h-5" />
              <span>scan directory</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DirectoryScanModal;
