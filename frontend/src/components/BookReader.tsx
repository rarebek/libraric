import React, {
    useState,
    useEffect,
    useRef,
    useMemo,
    useCallback,
} from "react";
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
} from "@heroicons/react/24/outline";
import { Document, Page, pdfjs } from "react-pdf";
import { book } from "../types";
import { GetFileContent } from "../../wailsjs/go/main/App";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// set worker source
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface bookReaderProps {
    book: book;
    onClose: () => void;
}

const BookReader: React.FC<bookReaderProps> = ({ book, onClose }) => {
    const [darkMode, setDarkMode] = useState(true);
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [error, setError] = useState<Error | null>(null);
    const [pdfData, setPdfData] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [scale, setScale] = useState(1);
    const [showControls] = useState(true);
    const [controlsTimeout] = useState<number | null>(null);
    const [isClosing, setIsClosing] = useState(false);
    const [brightness, setBrightness] = useState(1);
    const contentRef = useRef<HTMLDivElement>(null);
    const documentRef = useRef<any>(null);
    const controlsRef = useRef<HTMLDivElement>(null);

    // memoize pdf options to prevent unnecessary rerenders
    const pdfOptions = useMemo(
        () => ({
            cMapUrl: "https://unpkg.com/pdfjs-dist@3.4.120/cmaps/",
            cMapPacked: true,
        }),
        []
    );

    // load pdf data
    useEffect(() => {
        const loadPdf = async () => {
            try {
                setLoading(true);
                setNumPages(null);
                setPageNumber(1);
                const data = await GetFileContent(book.filePath);
                console.log(
                    "pdf data loaded successfully, length:",
                    data.length
                );
                setPdfData(data);
            } catch (err) {
                console.error("failed to load pdf:", err);
                setError(err instanceof Error ? err : new Error(String(err)));
            } finally {
                setLoading(false);
            }
        };

        loadPdf();
    }, [book.filePath]);

    // keyboard navigation handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // prevent default behavior for arrow keys
            if (
                ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
                    e.key
                )
            ) {
                e.preventDefault();
            }

            // show controls when navigation keys are pressed
            showFloatingControls();

            switch (e.key) {
                case "ArrowLeft":
                    console.log("left arrow pressed, attempting previous page");
                    previousPage();
                    break;
                case "ArrowRight":
                    console.log("right arrow pressed, attempting next page");
                    nextPage();
                    break;
                case "ArrowUp":
                    if (contentRef.current) {
                        contentRef.current.scrollBy({
                            top: -100,
                            behavior: "smooth",
                        });
                    }
                    break;
                case "ArrowDown":
                    if (contentRef.current) {
                        contentRef.current.scrollBy({
                            top: 100,
                            behavior: "smooth",
                        });
                    }
                    break;
                case "+":
                    zoomIn();
                    break;
                case "-":
                    zoomOut();
                    break;
                case "Escape":
                    handleClose();
                    break;
            }
        };

        // add event listener
        window.addEventListener("keydown", handleKeyDown);

        // cleanup on unmount
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [pageNumber, numPages]); // re-add listener if page number or total pages change

    // show/hide controls based on mouse movement
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            // only show controls when mouse is in the bottom 150px of the viewport
            const bottomThreshold = window.innerHeight - 150;
            if (e.clientY > bottomThreshold) {
                showFloatingControls();
            }
        };

        // add event listeners
        window.addEventListener("mousemove", handleMouseMove);

        // cleanup on unmount
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            if (controlsTimeout) {
                clearTimeout(controlsTimeout);
            }
        };
    }, [controlsTimeout]);

    // handle close with animation
    const handleClose = useCallback(() => {
        setIsClosing(true);
        // wait for animation to complete
        setTimeout(() => {
            onClose();
        }, 300);
    }, [onClose]);

    // show controls with auto-hide after 3 seconds
    const showFloatingControls = useCallback(() => {
        // clear any existing timeout
        if (controlsTimeout) {
            clearTimeout(controlsTimeout);
        }

        // set new timeout to hide controls after 3 seconds
        const timeout = setTimeout(() => {
            // only hide controls if not being hovered
            if (controlsRef.current && !controlsRef.current.matches(":hover")) {
                // setShowControls(false);
            }
        }, 5000); // increased timeout for better usability

        // setControlsTimeout(timeout);
    }, [controlsTimeout]);

    const onDocumentLoadSuccess = useCallback(
        ({ numPages }: { numPages: number }) => {
            console.log(`document loaded with ${numPages} pages`);
            setNumPages(numPages);
            // don't reset page number if it's already set and valid
            setPageNumber((currentPage) => {
                if (currentPage > 1 && currentPage <= numPages) {
                    return currentPage;
                }
                return 1;
            });
            // show controls briefly when document loads
            showFloatingControls();
        },
        [showFloatingControls]
    );

    const changePage = useCallback(
        (offset: number) => {
            console.log(
                `attempting to change page with offset: ${offset}, current page: ${pageNumber}, total pages: ${numPages}`
            );

            if (!numPages) {
                console.log("cannot change page - numPages is null");
                return;
            }

            const newPage = pageNumber + offset;
            console.log(`new page would be: ${newPage}`);

            if (newPage >= 1 && newPage <= numPages) {
                console.log(`setting page number to ${newPage}`);
                setPageNumber(newPage);
                // show controls when changing pages
                showFloatingControls();
            } else {
                console.log(
                    `page change rejected: ${newPage} is out of bounds [1-${numPages}]`
                );
            }
        },
        [pageNumber, numPages, showFloatingControls]
    );

    const previousPage = useCallback(() => {
        console.log("previous page button clicked");
        changePage(-1);
    }, [changePage]);

    const nextPage = useCallback(() => {
        console.log("next page button clicked");
        changePage(1);
    }, [changePage]);

    const zoomIn = useCallback(() => {
        setScale((currentScale) => {
            const newScale = Math.min(currentScale + 0.1, 3);
            console.log(`zooming in to scale: ${newScale}`);
            return newScale;
        });
        showFloatingControls();
    }, [showFloatingControls]);

    const zoomOut = useCallback(() => {
        setScale((currentScale) => {
            const newScale = Math.max(currentScale - 0.1, 0.5);
            console.log(`zooming out to scale: ${newScale}`);
            return newScale;
        });
        showFloatingControls();
    }, [showFloatingControls]);

    const scrollUp = useCallback(() => {
        if (contentRef.current) {
            contentRef.current.scrollBy({ top: -200, behavior: "smooth" });
        }
        showFloatingControls();
    }, [showFloatingControls]);

    const scrollDown = useCallback(() => {
        if (contentRef.current) {
            contentRef.current.scrollBy({ top: 200, behavior: "smooth" });
        }
        showFloatingControls();
    }, [showFloatingControls]);

    const toggleDarkMode = useCallback(() => {
        setDarkMode((current) => !current);
        showFloatingControls();
    }, [showFloatingControls]);

    // force re-render when page number changes
    useEffect(() => {
        console.log(`page number changed to: ${pageNumber}`);
    }, [pageNumber]);

    // handle pdf rendering issues
    const onPageRenderError = (error: Error) => {
        console.error("error rendering page:", error);
        // don't set state error for transport destroyed - it's usually not critical
        if (!error.message.includes("Transport destroyed")) {
            setError(error);
        }
    };

    // handle document errors
    const onDocumentLoadError = (error: Error) => {
        console.error("error loading document:", error);
        setError(error);
    };

    return (
        <div
            className={`fixed inset-0 z-50 flex ${darkMode ? "dark" : ""} ${
                isClosing ? "animate-fade-out" : "animate-fade-in"
            }`}
            style={{
                animation: isClosing
                    ? "fadeOut 300ms ease-in-out forwards"
                    : "fadeIn 300ms ease-in-out",
            }}
        >
            {/* sidebar with thumbnails */}
            <aside className="w-60 h-full flex flex-col bg-gray-100 dark:bg-gray-900/60 backdrop-blur-md border-r border-gray-700">
                {/* sidebar header spacer */}
                <div className="h-4 border-b border-gray-700"></div>

                {/* thumbnails list */}
                <div className="flex-1 overflow-y-auto p-2 flex flex-col items-center space-y-3">
                    {pdfData && numPages && (
                        <Document file={pdfData} options={pdfOptions}>
                            {Array.from({ length: numPages }, (_, i) => (
                                <div
                                    key={`thumb_${i + 1}`}
                                    onClick={() => setPageNumber(i + 1)}
                                    className={`cursor-pointer group rounded overflow-hidden border ${
                                        pageNumber === i + 1
                                            ? "border-blue-400"
                                            : "border-transparent hover:border-gray-600"
                                    }`}
                                >
                                    <Page
                                        pageNumber={i + 1}
                                        width={120}
                                        renderTextLayer={false}
                                        renderAnnotationLayer={false}
                                        className="bg-white dark:bg-black"
                                    />
                                    <div className="text-center text-xs py-1 bg-gray-900/50 backdrop-blur-sm">
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
                    className="flex-1 overflow-auto p-4 flex justify-center"
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
                    ) : (
                        <Document
                            ref={documentRef}
                            file={pdfData}
                            onLoadSuccess={onDocumentLoadSuccess}
                            onLoadError={onDocumentLoadError}
                            className="max-w-4xl mx-auto"
                            options={pdfOptions}
                        >
                            {numPages &&
                                pageNumber > 0 &&
                                pageNumber <= numPages && (
                                    <Page
                                        key={`page_${pageNumber}`}
                                        pageNumber={pageNumber}
                                        className={`transition-colors duration-300 ${
                                            darkMode
                                                ? "bg-gray-800"
                                                : "bg-white"
                                        }`}
                                        renderTextLayer={true}
                                        renderAnnotationLayer={true}
                                        onRenderError={onPageRenderError}
                                        width={Math.min(
                                            window.innerWidth - 80,
                                            800
                                        )}
                                        scale={scale}
                                    />
                                )}
                        </Document>
                    )}
                </div>

                {/* floating controls */}
                <div
                    ref={controlsRef}
                    className="fixed top-6 left-1/2 -translate-x-1/2 ml-[120px] flex items-center gap-3 px-5 py-2 rounded-lg bg-gray-800/60 backdrop-blur-md shadow-xl ring-1 ring-white/10 z-50"
                >
                    {/* title and close button */}
                    <div className="flex items-center gap-3 pr-3 border-r border-gray-700 max-w-xs truncate">
                        <span className="text-sm font-medium truncate">
                            {book.title}
                        </span>
                    </div>

                    {/* navigation & actions */}
                    <button
                        onClick={previousPage}
                        disabled={pageNumber <= 1}
                        className={`p-1.5 rounded hover:bg-gray-700 transition-colors ${
                            pageNumber <= 1
                                ? "text-gray-500 cursor-not-allowed"
                                : ""
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
                                ? "text-gray-500 cursor-not-allowed"
                                : ""
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

                    {/* dark mode toggle */}
                    <button
                        onClick={toggleDarkMode}
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

                    {/* brightness slider - visible only in dark mode */}
                    {darkMode && (
                        <input
                            type="range"
                            min="0.8"
                            max="1.2"
                            step="0.05"
                            value={brightness}
                            onChange={(e) =>
                                setBrightness(parseFloat(e.target.value))
                            }
                            className="w-24 h-2 cursor-pointer appearance-none bg-gray-600 rounded-full outline-none"
                            aria-label="adjust page brightness"
                        />
                    )}
                </div>

                {/* reader footer - page indicator */}
                {numPages && (
                    <div className="p-4 border-t border-gray-700 flex justify-center items-center">
                        <p>
                            page {pageNumber} of {numPages}
                        </p>
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
                    background: #000 !important;
                }

                .react-pdf__Page canvas {
                    filter: invert(1) brightness(${brightness}) contrast(1.1);
                    background: #000 !important;
                }

                .react-pdf__Page__textContent {
                    mix-blend-mode: normal;
                }

                .react-pdf__Page__annotations,
                .react-pdf__Page img {
                    filter: invert(1);
                }
                `
                        : ""
                }
                `}
            </style>
        </div>
    );
};

export default BookReader;
