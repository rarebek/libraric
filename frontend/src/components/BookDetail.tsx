import React, { useEffect, useState } from 'react'
import { XMarkIcon, BookOpenIcon, TrashIcon } from '@heroicons/react/24/outline'
import { book } from '../types'
import { pdfjs } from 'react-pdf'
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface bookDetailProps {
  book: book
  onClose: () => void
  onOpen: (id: string) => void
  onRemove: (id: string) => void
}

const BookDetail: React.FC<bookDetailProps> = ({
  book,
  onClose,
  onOpen,
  onRemove,
}) => {
  const [thumb, setThumb] = useState<string | null>(book.coverPath ?? null)

  useEffect(() => {
    const cached = localStorage.getItem(`thumb_${book.id}`)
    if (cached) {
      setThumb(cached)
      return
    }
    if (book.format.toLowerCase() !== 'pdf') return
    ;(async () => {
      const { GetFileContent } = await import('../../wailsjs/go/main/App')
      try {
        const data = await GetFileContent(book.filePath)
        const base64 = data.split(',')[1]
        const loadingTask = pdfjs.getDocument({ data: atob(base64) })
        const pdf = await loadingTask.promise
        const page = await pdf.getPage(1)
        const viewport = page.getViewport({ scale: 1 })
        const scaleFactor = 450 / viewport.height
        const scaledViewport = page.getViewport({
          scale: scaleFactor * window.devicePixelRatio,
        })
        const canvas = document.createElement('canvas')
        canvas.width = scaledViewport.width
        canvas.height = scaledViewport.height
        const ctx = canvas.getContext('2d')
        await page.render({
          canvasContext: ctx as any,
          viewport: scaledViewport,
        }).promise
        const url = canvas.toDataURL()
        setThumb(url)
        localStorage.setItem(`thumb_${book.id}`, url)
      } catch (e) {
        console.error('thumb gen failed', e)
      }
    })()
  }, [thumb, book])

  // format date if available
  const formatDate = (dateString: string) => {
    if (!dateString) return 'never'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString()
    } catch (e) {
      return 'invalid date'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {book.title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-grow">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3 flex-shrink-0">
              {thumb ? (
                <img
                  src={thumb}
                  alt={book.title}
                  className="w-full h-auto rounded-lg shadow-md object-cover"
                />
              ) : (
                <div className="w-full h-[450px] bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
              )}
            </div>

            <div className="w-full md:w-2/3">
              {book.author && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    author
                  </h3>
                  <p className="text-gray-900 dark:text-gray-100">
                    {book.author}
                  </p>
                </div>
              )}

              {book.description && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    description
                  </h3>
                  <p className="text-gray-900 dark:text-gray-100 whitespace-pre-line">
                    {book.description}
                  </p>
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  format
                </h3>
                <p className="text-gray-900 dark:text-gray-100">
                  {book.format.toUpperCase()}
                </p>
              </div>

              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  added on
                </h3>
                <p className="text-gray-900 dark:text-gray-100">
                  {formatDate(book.addedAt)}
                </p>
              </div>

              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  last opened
                </h3>
                <p className="text-gray-900 dark:text-gray-100">
                  {formatDate(book.lastOpenedAt)}
                </p>
              </div>

              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  file path
                </h3>
                <p className="text-gray-900 dark:text-gray-100 text-sm break-all">
                  {book.filePath}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <button
            onClick={() => onRemove(book.id)}
            className="flex items-center space-x-1 px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md transition-colors"
          >
            <TrashIcon className="w-5 h-5" />
            <span>remove book</span>
          </button>

          <button
            onClick={() => onOpen(book.id)}
            className="flex items-center space-x-1 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-md transition-colors"
          >
            <BookOpenIcon className="w-5 h-5" />
            <span>open book</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default BookDetail
