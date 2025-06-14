import { useEffect, useState } from 'react'
import { useSettings } from './hooks/useSettings'
import { uiSettings } from './types'
import './App.css'
import Header from './components/Header'
import BookGrid from './components/BookGrid'
import BookDetail from './components/BookDetail'
import BookReader from './components/BookReader'
import AddBookModal from './components/AddBookModal'
import DirectoryScanModal from './components/DirectoryScanModal'
import SettingsModal from './components/SettingsModal'
import {
  GetBooks,
  AddBook,
  RemoveBook,
  OpenBook,
  ScanDirectory,
} from '../wailsjs/go/main/App'
import { book } from './types'

function App() {
  const {
    settings,
    loading: settingsLoading,
    update: updateSettings,
  } = useSettings()

  const [darkMode, setDarkMode] = useState(false)
  const [books, setBooks] = useState<book[]>([])
  const [selectedBook, setSelectedBook] = useState<book | null>(null)
  const [readerBook, setReaderBook] = useState<book | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isScanModalOpen, setIsScanModalOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // apply settings once loaded
  useEffect(() => {
    if (settingsLoading) return

    // theme
    setDarkMode(settings.theme === 'dark')

    // font family detection
    const requestedFamily = settings.font.family.trim()
    const cssFamily = /\s/.test(requestedFamily)
      ? `"${requestedFamily}"`
      : requestedFamily
    document.body.style.fontFamily = `${cssFamily}, system-ui, sans-serif`
    document.documentElement.style.fontSize = settings.font.size

    // set color scheme css variables
    const scheme = settings.colorScheme[settings.theme]
    Object.entries(scheme).forEach(([key, val]) => {
      document.documentElement.style.setProperty(`--${key}-color`, val)
    })

    // apply background and foreground directly
    document.body.style.backgroundColor = scheme.background
    document.body.style.color = scheme.foreground
  }, [settings, settingsLoading])

  // load books on mount
  useEffect(() => {
    loadBooks()
  }, [])

  // toggle dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    updateSettings({
      theme: newMode ? 'dark' : 'light',
    } as Partial<uiSettings>)
  }

  const loadBooks = async () => {
    try {
      setLoading(true)
      const booksData = await GetBooks()
      setBooks(booksData as book[])
    } catch (error) {
      console.error('failed to load books:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectBook = (book: book) => {
    setSelectedBook(book)
  }

  const handleCloseBookDetail = () => {
    setSelectedBook(null)
  }

  const handleCloseBookReader = () => {
    setReaderBook(null)
  }

  const handleOpenBook = async (id: string) => {
    try {
      // Mark the book as opened in the backend
      await OpenBook(id)

      // Find the book in our local state and open it in the reader
      const bookToOpen = books.find((b) => b.id === id)
      if (bookToOpen) {
        setReaderBook(bookToOpen)
        setSelectedBook(null) // close the detail view
      }

      // refresh books to update last opened time
      loadBooks()
    } catch (error) {
      console.error('failed to open book:', error)
      // todo: show error message
    }
  }

  const handleRemoveBook = async (id: string) => {
    try {
      await RemoveBook(id)
      setSelectedBook(null)
      loadBooks()
    } catch (error) {
      console.error('failed to remove book:', error)
      // todo: show error message
    }
  }

  const handleAddBook = async (
    title: string,
    author: string,
    filePath: string,
    description: string,
    format: string
  ) => {
    try {
      await AddBook(title, author, filePath, description, format)
      setIsAddModalOpen(false)
      loadBooks()
    } catch (error) {
      console.error('failed to add book:', error)
      // todo: show error message
    }
  }

  const handleScanDirectory = async (path: string) => {
    try {
      await ScanDirectory(path)
      setIsScanModalOpen(false)
      loadBooks()
    } catch (error) {
      console.error('failed to scan directory:', error)
      // todo: show error message
    }
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{
        backgroundColor: 'var(--background-color)',
        color: 'var(--foreground-color)',
      }}
    >
      <Header
        onAddBook={() => setIsAddModalOpen(true)}
        onScanDirectory={() => setIsScanModalOpen(true)}
        onToggleDarkMode={toggleDarkMode}
        onOpenSettings={() => setIsSettingsOpen(true)}
        darkMode={darkMode}
      />

      <main className="flex-grow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <BookGrid books={books} onSelectBook={handleSelectBook} />
        )}
      </main>

      {selectedBook && (
        <BookDetail
          book={selectedBook}
          onClose={handleCloseBookDetail}
          onOpen={handleOpenBook}
          onRemove={handleRemoveBook}
        />
      )}

      {readerBook && (
        <BookReader
          book={readerBook}
          onClose={handleCloseBookReader}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
        />
      )}

      {isAddModalOpen && (
        <AddBookModal
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddBook}
        />
      )}

      {isScanModalOpen && (
        <DirectoryScanModal
          onClose={() => setIsScanModalOpen(false)}
          onSubmit={handleScanDirectory}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onClose={() => setIsSettingsOpen(false)}
          onSave={(updates) => updateSettings(updates)}
        />
      )}
    </div>
  )
}

export default App
