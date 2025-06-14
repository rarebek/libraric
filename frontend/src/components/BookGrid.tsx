import React from 'react'
import BookCard from './BookCard'
import { book } from '../types'

interface bookGridProps {
  books: book[]
  onSelectBook: (book: book) => void
}

const BookGrid: React.FC<bookGridProps> = ({ books, onSelectBook }) => {
  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="text-5xl mb-4 text-gray-300 dark:text-gray-600">📚</div>
        <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
          no books yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          add your first book by clicking the "add books" button or drag and
          drop files here.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
      {books.map((book) => (
        <BookCard key={book.id} book={book} onSelect={onSelectBook} />
      ))}
    </div>
  )
}

export default BookGrid
