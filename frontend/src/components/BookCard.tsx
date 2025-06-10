import React from 'react';
import { book } from '../types';

interface bookCardProps {
  book: book;
  onSelect: (book: book) => void;
}

const BookCard: React.FC<bookCardProps> = ({ book, onSelect }) => {
  // fallback cover image if none provided
  const coverImage = book.coverPath || `https://placehold.co/200x300/darkblue/white?text=${encodeURIComponent(book.title)}`;

  return (
    <div
      className="relative group bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer"
      onClick={() => onSelect(book)}
    >
      <div className="aspect-[2/3] relative overflow-hidden">
        <img
          src={coverImage}
          alt={book.title}
          className="object-cover w-full h-full transition-all duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
          <div className="text-white">
            <p className="text-xs font-medium uppercase tracking-wider">{book.format}</p>
          </div>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-gray-900 dark:text-gray-100 font-medium text-sm line-clamp-1">{book.title}</h3>
        {book.author && <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">{book.author}</p>}
      </div>
    </div>
  );
};

export default BookCard;
