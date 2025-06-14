import React, { useEffect, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { book } from '../types'

interface bookCardProps {
  book: book
  onSelect: (book: book) => void
}

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

const BookCard: React.FC<bookCardProps> = ({ book, onSelect }) => {
  const [thumb, setThumb] = useState<string | null>(book.coverPath ?? null)

  useEffect(() => {
    // check cache first
    const cached = localStorage.getItem(`thumb_${book.id}`)
    if (cached) {
      setThumb(cached)
      return
    }

    if (thumb || book.format.toLowerCase() !== 'pdf') return
    ;(async () => {
      const { GetFileContent } = await import('../../wailsjs/go/main/App')
      try {
        const data = await GetFileContent(book.filePath)
        const pdfData = data
        const loadingTask = pdfjs.getDocument({
          data: atob(pdfData.split(',')[1]),
        })
        const pdf = await loadingTask.promise
        const page = await pdf.getPage(1)
        const desiredWidth = 300
        const viewport = page.getViewport({ scale: 1 })
        const scaleFactor = desiredWidth / viewport.width
        const scaledViewport = page.getViewport({
          scale: 1 * scaleFactor * window.devicePixelRatio,
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
        console.error('thumbnail gen failed', e)
      }
    })()
  }, [thumb, book])

  const coverImage =
    thumb ||
    `https://placehold.co/200x300/darkblue/white?text=${encodeURIComponent(
      book.title
    )}`

  return (
    <div
      className="relative group bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer"
      onClick={() => onSelect(book)}
    >
      <div className="aspect-[2/3] relative overflow-hidden">
        {thumb ? (
          <img
            src={thumb}
            alt={book.title}
            className="object-cover w-full h-full transition-all duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
          <div className="text-white">
            <p className="text-xs font-medium uppercase tracking-wider">
              {book.format}
            </p>
          </div>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-gray-900 dark:text-gray-100 font-medium text-sm line-clamp-1">
          {book.title}
        </h3>
        {book.author && (
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
            {book.author}
          </p>
        )}
      </div>
    </div>
  )
}

export default BookCard
