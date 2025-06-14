import React, { useState } from 'react'
import {
  XMarkIcon,
  CheckIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline'
import { OpenFilePicker } from '../../wailsjs/go/main/App'

interface addBookModalProps {
  onClose: () => void
  onSubmit: (
    title: string,
    author: string,
    filePath: string,
    description: string,
    format: string
  ) => void
}

const AddBookModal: React.FC<addBookModalProps> = ({ onClose, onSubmit }) => {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [filePath, setFilePath] = useState('')
  const [description, setDescription] = useState('')
  const [format, setFormat] = useState('pdf')
  const [filePickerOpen, setFilePickerOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(title, author, filePath, description, format)
  }

  const handleFileSelect = async () => {
    try {
      setFilePickerOpen(true)
      const selectedPath = await OpenFilePicker()

      if (selectedPath) {
        setFilePath(selectedPath)

        // extract format from file extension
        const ext = selectedPath.split('.').pop()?.toLowerCase() || ''
        if (['pdf', 'epub', 'mobi', 'azw', 'azw3'].includes(ext)) {
          setFormat(ext)
        }

        // if title is empty, use filename without extension
        if (!title) {
          const filename = selectedPath.split(/[\\/]/).pop() || ''
          const filenameWithoutExt = filename.replace(/\.[^/.]+$/, '')
          setTitle(filenameWithoutExt)
        }
      }
    } catch (error) {
      console.error('error selecting file:', error)
    } finally {
      setFilePickerOpen(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden max-w-md w-full">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            add new book
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="file-path"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                file
              </label>
              <div className="flex">
                <input
                  id="file-path"
                  type="text"
                  value={filePath}
                  onChange={(e) => setFilePath(e.target.value)}
                  className="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md shadow-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="path to your ebook file"
                  required
                />
                <button
                  type="button"
                  onClick={handleFileSelect}
                  disabled={filePickerOpen}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-r-md flex items-center justify-center disabled:opacity-50"
                >
                  <ArrowUpTrayIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                placeholder="book title"
                required
              />
            </div>

            <div>
              <label
                htmlFor="author"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                author
              </label>
              <input
                id="author"
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                placeholder="book author"
              />
            </div>

            <div>
              <label
                htmlFor="format"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                format
              </label>
              <select
                id="format"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="pdf">pdf</option>
                <option value="epub">epub</option>
                <option value="mobi">mobi</option>
                <option value="azw">azw</option>
                <option value="azw3">azw3</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                placeholder="short description of the book"
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              className="w-full flex justify-center items-center space-x-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-md transition-colors"
            >
              <CheckIcon className="w-5 h-5" />
              <span>add book</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddBookModal
