package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// book struct represents an ebook
type book struct {
	ID           string    `json:"id"`
	Title        string    `json:"title"`
	Author       string    `json:"author"`
	FilePath     string    `json:"filePath"`
	CoverPath    string    `json:"coverPath"`
	Description  string    `json:"description"`
	Format       string    `json:"format"`
	AddedAt      time.Time `json:"addedAt"`
	LastOpenedAt time.Time `json:"lastOpenedAt"`
}

// library struct represents the collection of books
type library struct {
	Books []book `json:"books"`
	Path  string `json:"path"`
}

// app struct
type App struct {
	ctx      context.Context
	library  library
	dataFile string
}

// newapp creates a new app application struct
func NewApp() *App {
	return &App{
		dataFile: "library.json",
		library: library{
			Books: []book{},
			Path:  "",
		},
	}
}

// startup is called when the app starts. the context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.loadLibrary()
}

// loadlibrary loads the library data from the json file
func (a *App) loadLibrary() error {
	// check if file exists
	if _, err := os.Stat(a.dataFile); os.IsNotExist(err) {
		// create empty library file
		return a.saveLibrary()
	}

	// read file
	data, err := ioutil.ReadFile(a.dataFile)
	if err != nil {
		return err
	}

	// parse json
	return json.Unmarshal(data, &a.library)
}

// savelibrary saves the library data to the json file
func (a *App) saveLibrary() error {
	data, err := json.MarshalIndent(a.library, "", "  ")
	if err != nil {
		return err
	}
	return ioutil.WriteFile(a.dataFile, data, 0644)
}

// getbooks returns all books in the library
func (a *App) GetBooks() []map[string]interface{} {
	return wrapBooks(a.library.Books)
}

// addbook adds a new book to the library
func (a *App) AddBook(title, author, filePath, description, format string) (map[string]interface{}, error) {
	// validate file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return nil, fmt.Errorf("file does not exist: %s", filePath)
	}

	// create new book
	newBook := book{
		ID:          fmt.Sprintf("%d", time.Now().UnixNano()),
		Title:       title,
		Author:      author,
		FilePath:    filePath,
		Description: description,
		Format:      format,
		AddedAt:     time.Now(),
	}

	// add to library
	a.library.Books = append(a.library.Books, newBook)

	// save changes
	if err := a.saveLibrary(); err != nil {
		return nil, err
	}

	return wrapBook(newBook), nil
}

// removebook removes a book from the library
func (a *App) RemoveBook(id string) error {
	for i, b := range a.library.Books {
		if b.ID == id {
			// remove from slice
			a.library.Books = append(a.library.Books[:i], a.library.Books[i+1:]...)

			// save changes
			return a.saveLibrary()
		}
	}

	return fmt.Errorf("book with id %s not found", id)
}

// openbook marks a book as opened and returns the file path
func (a *App) OpenBook(id string) (string, error) {
	for i, b := range a.library.Books {
		if b.ID == id {
			// update last opened time
			a.library.Books[i].LastOpenedAt = time.Now()

			// save changes
			if err := a.saveLibrary(); err != nil {
				return "", err
			}

			// now we just return the path and let the frontend handle opening it
			return b.FilePath, nil
		}
	}

	return "", fmt.Errorf("book with id %s not found", id)
}

// setlibrarypath sets the main path for the library
func (a *App) SetLibraryPath(path string) error {
	// validate directory exists
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return fmt.Errorf("directory does not exist: %s", path)
	}

	a.library.Path = path
	return a.saveLibrary()
}

// scandirectory scans a directory for ebooks and adds them to the library
func (a *App) ScanDirectory(path string) ([]map[string]interface{}, error) {
	// validate directory exists
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return nil, fmt.Errorf("directory does not exist: %s", path)
	}

	addedBooks := []book{}

	// walk through directory
	err := filepath.Walk(path, func(filePath string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// skip directories
		if info.IsDir() {
			return nil
		}

		// check file extension for common ebook formats
		ext := filepath.Ext(filePath)
		if ext == ".pdf" || ext == ".epub" || ext == ".mobi" || ext == ".azw" || ext == ".azw3" {
			// create new book
			fileName := filepath.Base(filePath)
			newBook := book{
				ID:       fmt.Sprintf("%d", time.Now().UnixNano()),
				Title:    fileName,
				FilePath: filePath,
				Format:   ext[1:], // remove the dot
				AddedAt:  time.Now(),
			}

			// add to library
			a.library.Books = append(a.library.Books, newBook)
			addedBooks = append(addedBooks, newBook)
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	// save changes
	if err := a.saveLibrary(); err != nil {
		return nil, err
	}

	return wrapBooks(addedBooks), nil
}

// openfilepicker opens a file picker dialog and returns the selected file path
func (a *App) OpenFilePicker() (string, error) {
	return runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "select an ebook file",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "ebook files (*.pdf;*.epub;*.mobi;*.azw;*.azw3)",
				Pattern:     "*.pdf;*.epub;*.mobi;*.azw;*.azw3",
			},
		},
	})
}

// opendirectorypicker opens a directory picker dialog and returns the selected directory path
func (a *App) OpenDirectoryPicker() (string, error) {
	return runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "select a directory to scan for ebooks",
	})
}

// getfilecontent reads a file and returns its contents as base64 encoded string
func (a *App) GetFileContent(path string) (string, error) {
	// validate file exists
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return "", fmt.Errorf("file does not exist: %s", path)
	}

	// read file
	fileBytes, err := os.ReadFile(path)
	if err != nil {
		return "", fmt.Errorf("failed to read file: %w", err)
	}

	// encode to base64
	encoded := "data:application/pdf;base64," + base64.StdEncoding.EncodeToString(fileBytes)
	return encoded, nil
}
