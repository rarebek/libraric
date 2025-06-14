import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  XMarkIcon,
  SunIcon,
  MoonIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  MinusIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CursorArrowRaysIcon,
  HandRaisedIcon,
  Bars3BottomLeftIcon,
} from '@heroicons/react/24/outline'
import { Document, Page, pdfjs } from 'react-pdf'
import ePub, { Rendition, Book as EpubBook } from 'epubjs'
import { book } from '../types'
import { GetFileContent } from '../../wailsjs/go/main/App'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// set worker source
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface bookReaderProps {
  book: book
  onClose: () => void
  darkMode: boolean
  toggleDarkMode: () => void
}

const BookReader: React.FC<bookReaderProps> = ({
  book,
  onClose,
  darkMode,
  toggleDarkMode,
}) => {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [error, setError] = useState<Error | null>(null)
  const [pdfData, setPdfData] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [scale, setScale] = useState(1)
  const [showControls] = useState(true)
  const [controlsTimeout] = useState<number | null>(null)
  const [isClosing, setIsClosing] = useState(false)
  const [brightness, setBrightness] = useState(0.9)
  const [handMode, setHandMode] = useState(true)
  const contentRef = useRef<HTMLDivElement>(null)
  const documentRef = useRef<any>(null)
  const controlsRef = useRef<HTMLDivElement>(null)
  const [epubBook, setEpubBook] = useState<EpubBook | null>(null)
  const [rendition, setRendition] = useState<Rendition | null>(null)
  const [showSidebar, setShowSidebar] = useState(true)
  const [prevPageNumber, setPrevPageNumber] = useState<number | null>(null)
  const [pageReady, setPageReady] = useState(false)

  // memoize pdf options to prevent unnecessary rerenders
  const pdfOptions = useMemo(
    () => ({
      cMapUrl: 'https://unpkg.com/pdfjs-dist@3.4.120/cmaps/',
      cMapPacked: true,
    }),
    []
  )

  // load pdf data
  useEffect(() => {
    const loadFile = async () => {
      try {
        setLoading(true)
        setNumPages(null)
        setPageNumber(1)
        const data = await GetFileContent(book.filePath)
        const ext = book.format.toLowerCase()
        if (ext === 'pdf') {
          setPdfData(data)
        } else if (ext === 'epub') {
          const base64 = data.split(',')[1]
          const binary = atob(base64)
          const len = binary.length
          const buf = new Uint8Array(len)
          for (let i = 0; i < len; i++) buf[i] = binary.charCodeAt(i)
          const blob = new Blob([buf], {
            type: 'application/epub+zip',
          })
          const url = URL.createObjectURL(blob)
          const bookObj = ePub(url)
          setEpubBook(bookObj)
        }
      } catch (err) {
        console.error('failed to load file:', err)
        setError(err instanceof Error ? err : new Error(String(err)))
      } finally {
        setLoading(false)
      }
    }

    loadFile()
  }, [book.filePath])

  // keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // prevent default behavior for arrow keys
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault()
      }

      // show controls when navigation keys are pressed
      showFloatingControls()

      switch (e.key) {
        case 'ArrowLeft':
          console.log('left arrow pressed, attempting previous page')
          previousPage()
          break
        case 'ArrowRight':
          console.log('right arrow pressed, attempting next page')
          nextPage()
          break
        case 'ArrowUp':
          if (contentRef.current) {
            contentRef.current.scrollBy({
              top: -100,
              behavior: 'smooth',
            })
          }
          break
        case 'ArrowDown':
          if (contentRef.current) {
            contentRef.current.scrollBy({
              top: 100,
              behavior: 'smooth',
            })
          }
          break
        case '+':
          zoomIn()
          break
        case '-':
          zoomOut()
          break
        case 'Escape':
          handleClose()
          break
      }
    }

    // add event listener
    window.addEventListener('keydown', handleKeyDown)

    // cleanup on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [pageNumber, numPages]) // re-add listener if page number or total pages change

  // show/hide controls based on mouse movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // only show controls when mouse is in the bottom 150px of the viewport
      const bottomThreshold = window.innerHeight - 150
      if (e.clientY > bottomThreshold) {
        showFloatingControls()
      }
    }

    // add event listeners
    window.addEventListener('mousemove', handleMouseMove)

    // cleanup on unmount
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (controlsTimeout) {
        clearTimeout(controlsTimeout)
      }
    }
  }, [controlsTimeout])

  // handle close with animation
  const handleClose = useCallback(() => {
    setIsClosing(true)
    // wait for animation to complete
    setTimeout(() => {
      onClose()
    }, 300)
  }, [onClose])

  // show controls with auto-hide after 3 seconds
  const showFloatingControls = useCallback(() => {
    // clear any existing timeout
    if (controlsTimeout) {
      clearTimeout(controlsTimeout)
    }

    // set new timeout to hide controls after 3 seconds
    const timeout = setTimeout(() => {
      // only hide controls if not being hovered
      if (controlsRef.current && !controlsRef.current.matches(':hover')) {
        // setShowControls(false);
      }
    }, 5000) // increased timeout for better usability

    // setControlsTimeout(timeout);
  }, [controlsTimeout])

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      console.log(`document loaded with ${numPages} pages`)
      setNumPages(numPages)
      // don't reset page number if it's already set and valid
      setPageNumber((currentPage) => {
        if (currentPage > 1 && currentPage <= numPages) {
          return currentPage
        }
        return 1
      })
      // show controls briefly when document loads
      showFloatingControls()
    },
    [showFloatingControls]
  )

  const changePage = useCallback(
    (offset: number) => {
      console.log(
        `attempting to change page with offset: ${offset}, current page: ${pageNumber}, total pages: ${numPages}`
      )

      if (!numPages) {
        console.log('cannot change page - numPages is null')
        return
      }

      const newPage = pageNumber + offset
      console.log(`new page would be: ${newPage}`)

      if (newPage >= 1 && newPage <= numPages) {
        console.log(`setting page number to ${newPage}`)
        setPrevPageNumber(pageNumber)
        setPageNumber(newPage)
        setPageReady(false)
        // show controls when changing pages
        showFloatingControls()
      } else {
        console.log(
          `page change rejected: ${newPage} is out of bounds [1-${numPages}]`
        )
      }
    },
    [pageNumber, numPages, showFloatingControls]
  )

  const previousPage = useCallback(() => {
    console.log('previous page button clicked')
    if (book.format.toLowerCase() === 'pdf') {
      changePage(-1)
    } else if (rendition) {
      rendition.prev()
    }
  }, [changePage, rendition, book.format])

  const nextPage = useCallback(() => {
    console.log('next page button clicked')
    if (book.format.toLowerCase() === 'pdf') {
      changePage(1)
    } else if (rendition) {
      rendition.next()
    }
  }, [changePage, rendition, book.format])

  const zoomIn = useCallback(() => {
    setScale((currentScale) => {
      const newScale = Math.min(currentScale + 0.1, 3)
      console.log(`zooming in to scale: ${newScale}`)
      return newScale
    })
    showFloatingControls()
  }, [showFloatingControls])

  const zoomOut = useCallback(() => {
    setScale((currentScale) => {
      const newScale = Math.max(currentScale - 0.1, 0.5)
      console.log(`zooming out to scale: ${newScale}`)
      return newScale
    })
    showFloatingControls()
  }, [showFloatingControls])

  const scrollUp = useCallback(() => {
    if (contentRef.current) {
      contentRef.current.scrollBy({ top: -200, behavior: 'smooth' })
    }
    showFloatingControls()
  }, [showFloatingControls])

  const scrollDown = useCallback(() => {
    if (contentRef.current) {
      contentRef.current.scrollBy({ top: 200, behavior: 'smooth' })
    }
    showFloatingControls()
  }, [showFloatingControls])

  // wrapper to keep controls visible when toggling theme
  const handleToggleDarkMode = useCallback(() => {
    toggleDarkMode()
    showFloatingControls()
  }, [toggleDarkMode, showFloatingControls])

  // enable drag-to-scroll when hand mode is active
  useEffect(() => {
    const el = contentRef.current
    if (!el) return

    if (!handMode) {
      // ensure cursor resets
      el.style.cursor = 'auto'
      el.classList.remove('hand-mode')
      return
    }

    // add class for css cursor override
    el.classList.add('hand-mode')

    let isDown = false
    let startX = 0
    let startY = 0
    let scrollLeft = 0
    let scrollTop = 0

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return // left click only
      e.preventDefault() // stop text selection
      isDown = true
      el.classList.add('cursor-grabbing')
      startX = e.pageX
      startY = e.pageY
      scrollLeft = el.scrollLeft
      scrollTop = el.scrollTop
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return
      e.preventDefault()
      const dx = e.pageX - startX
      const dy = e.pageY - startY
      el.scrollLeft = scrollLeft - dx
      el.scrollTop = scrollTop - dy
    }

    const endDrag = () => {
      isDown = false
      el.classList.remove('cursor-grabbing')
      el.style.cursor = 'auto'
      el.style.userSelect = 'auto'
      el.removeEventListener('dragstart', onDragStart)
    }

    const onDragStart = (event: DragEvent) => {
      event.preventDefault()
    }

    el.addEventListener('mousedown', onMouseDown)
    el.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', endDrag)
    el.addEventListener('mouseleave', endDrag)
    el.addEventListener('dragstart', onDragStart)

    // set cursor style
    el.style.cursor = 'grab'
    el.style.userSelect = 'none'

    return () => {
      el.removeEventListener('mousedown', onMouseDown)
      el.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', endDrag)
      el.removeEventListener('mouseleave', endDrag)
      el.style.cursor = 'auto'
      el.style.userSelect = 'auto'
      el.removeEventListener('dragstart', onDragStart)
      el.classList.remove('hand-mode')
    }
  }, [handMode])

  // utility log when page number changes
  useEffect(() => {
    console.log(`page number changed to: ${pageNumber}`)
  }, [pageNumber])

  // handle pdf rendering issues
  const onPageRenderError = (error: Error) => {
    console.error('error rendering page:', error)
    // ignore transport destroyed errors which are benign
    if (!error.message.includes('Transport destroyed')) {
      setError(error)
    }
  }

  // handle document load errors
  const onDocumentLoadError = (error: Error) => {
    console.error('error loading document:', error)
    setError(error)
  }

  // intercept ctrl+wheel to zoom pdf/epub instead of browser
  useEffect(() => {
    const el = contentRef.current
    if (!el) return

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault()
        if (e.deltaY < 0) {
          zoomIn()
        } else if (e.deltaY > 0) {
          zoomOut()
        }
      }
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', onWheel)
    }
  }, [zoomIn, zoomOut])

  // useEffect to render epub when epubBook ready
  useEffect(() => {
    if (book.format.toLowerCase() === 'epub' && epubBook) {
      const renditionObj = epubBook.renderTo('epub-container', {
        width: '100%',
        height: '100%',
      })
      renditionObj.display()
      setRendition(renditionObj)
    }
  }, [epubBook])

  // useEffect to prevent drag
  useEffect(() => {
    const prevent = (e: DragEvent) => {
      e.preventDefault()
    }
    window.addEventListener('dragover', prevent)
    window.addEventListener('drop', prevent)
    return () => {
      window.removeEventListener('dragover', prevent)
      window.removeEventListener('drop', prevent)
    }
  }, [])

  return (
    <div
      className={`fixed inset-0 z-50 flex ${
        isClosing ? 'animate-fade-out' : 'animate-fade-in'
      } bg-gray-100 dark:bg-gray-900`}
      style={{
        animation: isClosing
          ? 'fadeOut 300ms ease-in-out forwards'
          : 'fadeIn 300ms ease-in-out',
      }}
    >
      {/* sidebar with thumbnails */}
      <aside
        className={`fixed top-6 left-4 w-44 h-[calc(100vh-6rem)] flex flex-col rounded-lg overflow-hidden backdrop-blur-md shadow-xl ring-1 z-40 transform transition-transform duration-300 ${
          showSidebar
            ? 'translate-x-0'
            : '-translate-x-[120%] opacity-0 pointer-events-none'
        } ${
          darkMode
            ? 'bg-gray-800/60 ring-white/10'
            : 'bg-white/70 ring-black/10 border border-gray-200'
        }`}
      >
        {/* thumbnails list */}
        <div className="flex-1 overflow-y-auto p-2 flex flex-col items-center space-y-3 custom-scrollbar">
          {pdfData && numPages && (
            <Document file={pdfData} options={pdfOptions}>
              {Array.from({ length: numPages }, (_, i) => (
                <div
                  key={`thumb_${i + 1}`}
                  onClick={() => {
                    setPrevPageNumber(pageNumber)
                    setPageNumber(i + 1)
                    setPageReady(false)
                  }}
                  className={`cursor-pointer group rounded overflow-hidden border ${
                    pageNumber === i + 1
                      ? 'border-blue-400'
                      : 'border-transparent hover:border-gray-600'
                  }`}
                >
                  <Page
                    pageNumber={i + 1}
                    width={100}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    className="bg-white dark:bg-gray-700"
                  />
                  <div
                    className={`text-center text-xs py-1 backdrop-blur-sm ${
                      darkMode
                        ? 'bg-gray-900/50 text-gray-100'
                        : 'bg-gray-200/70 text-gray-800'
                    }`}
                  >
                    {i + 1}
                  </div>
                </div>
              ))}
            </Document>
          )}
        </div>
      </aside>

      {/* main reader area */}
      <div className="flex-1 flex flex-col">
        {/* reader content */}
        <div
          ref={contentRef}
          className="flex-1 overflow-auto p-4 flex justify-center custom-scrollbar"
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-400"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 flex flex-col items-center justify-center h-full">
              <p>error loading document:</p>
              <p>{error.message}</p>
            </div>
          ) : book.format.toLowerCase() === 'pdf' ? (
            <Document
              ref={documentRef}
              file={pdfData}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              className="max-w-4xl mx-auto"
              options={pdfOptions}
            >
              {numPages && pageNumber > 0 && pageNumber <= numPages && (
                <div
                  style={{
                    transform: `scale(${scale})`,
                    transformOrigin: 'top center',
                    transition: 'transform 0.15s ease-out',
                  }}
                >
                  {/* previous page overlay to prevent flicker */}
                  {prevPageNumber !== null && !pageReady && (
                    <div
                      className={`absolute inset-0 flex justify-center items-start ${
                        darkMode ? 'bg-gray-800' : 'bg-white'
                      }`}
                    >
                      <Page
                        pageNumber={prevPageNumber}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                        width={Math.min(window.innerWidth - 80, 800)}
                        scale={1}
                        className={`${darkMode ? 'bg-gray-800' : 'bg-white'}`}
                      />
                    </div>
                  )}

                  <Page
                    key={`page_${pageNumber}`}
                    pageNumber={pageNumber}
                    className={`transition-opacity duration-150 ${
                      pageReady ? 'opacity-100' : 'opacity-0'
                    } ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    onRenderError={onPageRenderError}
                    onRenderSuccess={() => setPageReady(true)}
                    width={Math.min(window.innerWidth - 80, 800)}
                    scale={1}
                  />
                </div>
              )}
            </Document>
          ) : epubBook ? (
            <div ref={contentRef} className="w-full flex justify-center">
              <div
                id="epub-container"
                className="max-w-4xl"
                style={{ minHeight: '80vh' }}
              ></div>
            </div>
          ) : null}
        </div>

        {/* floating controls */}
        <div
          ref={controlsRef}
          className={`fixed top-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-2 rounded-lg backdrop-blur-md shadow-xl ring-1 z-50 ${
            darkMode
              ? 'bg-gray-800/60 ring-white/10'
              : 'bg-white/70 ring-black/10 border border-gray-200'
          }`}
        >
          {/* title and close button */}
          <div className="flex items-center gap-3 pr-3 border-r border-gray-700 max-w-xs truncate">
            <span className="text-sm font-medium truncate">{book.title}</span>
          </div>

          {/* sidebar toggle - moved to first position */}
          <button
            onClick={() => setShowSidebar((v) => !v)}
            className="p-1.5 rounded hover:bg-gray-700"
            aria-label="toggle sidebar"
            type="button"
          >
            <Bars3BottomLeftIcon className="w-4 h-4" />
          </button>

          <div className="h-5 border-l border-gray-600 mx-1"></div>

          {/* navigation & actions */}
          <button
            onClick={previousPage}
            disabled={pageNumber <= 1}
            className={`p-1.5 rounded hover:bg-gray-700 transition-colors ${
              pageNumber <= 1 ? 'text-gray-500 cursor-not-allowed' : ''
            }`}
            aria-label="previous page"
            type="button"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>

          <button
            onClick={nextPage}
            disabled={pageNumber >= (numPages || 1)}
            className={`p-1.5 rounded hover:bg-gray-700 transition-colors ${
              pageNumber >= (numPages || 1)
                ? 'text-gray-500 cursor-not-allowed'
                : ''
            }`}
            aria-label="next page"
            type="button"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>

          <div className="h-5 border-l border-gray-600 mx-1"></div>

          <button
            onClick={zoomIn}
            className="p-1.5 rounded hover:bg-gray-700"
            aria-label="zoom in"
            type="button"
          >
            <PlusIcon className="w-4 h-4" />
          </button>

          <button
            onClick={zoomOut}
            className="p-1.5 rounded hover:bg-gray-700"
            aria-label="zoom out"
            type="button"
          >
            <MinusIcon className="w-4 h-4" />
          </button>

          <div className="h-5 border-l border-gray-600 mx-1"></div>

          <button
            onClick={scrollUp}
            className="p-1.5 rounded hover:bg-gray-700"
            aria-label="scroll up"
            type="button"
          >
            <ArrowUpIcon className="w-4 h-4" />
          </button>

          <button
            onClick={scrollDown}
            className="p-1.5 rounded hover:bg-gray-700"
            aria-label="scroll down"
            type="button"
          >
            <ArrowDownIcon className="w-4 h-4" />
          </button>

          <div className="h-5 border-l border-gray-600 mx-1"></div>

          {/* hand/select toggle */}
          <button
            onClick={() => setHandMode((v) => !v)}
            className="p-1.5 rounded hover:bg-gray-700"
            aria-label="toggle hand/select mode"
            type="button"
          >
            {handMode ? (
              <CursorArrowRaysIcon className="w-4 h-4" />
            ) : (
              <HandRaisedIcon className="w-4 h-4" />
            )}
          </button>

          <div className="h-5 border-l border-gray-600 mx-1"></div>

          {/* dark mode toggle */}
          <button
            onClick={handleToggleDarkMode}
            className="p-1.5 rounded hover:bg-gray-700"
            aria-label="toggle dark mode"
            type="button"
          >
            {darkMode ? (
              <SunIcon className="w-4 h-4" />
            ) : (
              <MoonIcon className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* reader footer - page indicator */}
        {numPages && (
          <div className="px-2 py-1 border-t border-gray-700 text-sm text-center bg-gray-900/5">
            page {pageNumber} of {numPages}
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style>
        {`
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }

                @keyframes fadeOut {
                    from { opacity: 1; transform: scale(1); }
                    to { opacity: 0; transform: scale(0.95); }
                }

                .animate-fade-in {
                    animation: fadeIn 300ms ease-in-out;
                }

                .animate-fade-out {
                    animation: fadeOut 300ms ease-in-out;
                }

                /* dark mode for pdf content */
                ${
                  darkMode
                    ? `
                .react-pdf__Page {
                    background: #475569 !important; /* slate-600 */
                }

                .react-pdf__Page canvas {
                    filter: invert(0.85) brightness(${brightness}) contrast(0.95) saturate(0.9);
                    background: #475569 !important;
                }

                .react-pdf__Page__textContent {
                    mix-blend-mode: normal;
                }

                .react-pdf__Page__annotations,
                .react-pdf__Page img {
                    filter: invert(1);
                }
                `
                    : ''
                }

                /* custom scrollbar */
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(100, 116, 139, 0.5); /* slate-500 */
                    border-radius: 4px;
                }
                .custom-scrollbar:hover::-webkit-scrollbar-thumb {
                    background-color: rgba(148, 163, 184, 0.7); /* slate-400 */
                }

                /* hand mode cursor override */
                .hand-mode, .hand-mode * {
                    cursor: grab !important;
                }
                .cursor-grabbing, .cursor-grabbing * {
                    cursor: grabbing !important;
                }
                `}
      </style>
    </div>
  )
}

export default BookReader
