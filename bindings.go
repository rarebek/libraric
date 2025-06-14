package main

import (
	"time"
)

// ts is a wrapper struct for time.time that can be properly serialized to javascript
type ts struct {
	time.Time
}

// marshalJSON implements json.marshaler
func (t ts) MarshalJSON() ([]byte, error) {
	return []byte(`"` + t.Format(time.RFC3339) + `"`), nil
}

// wrapbook converts a book to use the ts wrapper for time fields
func wrapBook(b book) map[string]interface{} {
	return map[string]interface{}{
		"id":           b.ID,
		"title":        b.Title,
		"author":       b.Author,
		"filePath":     b.FilePath,
		"coverPath":    b.CoverPath,
		"description":  b.Description,
		"format":       b.Format,
		"addedAt":      ts{b.AddedAt},
		"lastOpenedAt": ts{b.LastOpenedAt},
	}
}

// wrapbooks converts a slice of books to use the ts wrapper
func wrapBooks(books []book) []map[string]interface{} {
	result := make([]map[string]interface{}, len(books))
	for i, b := range books {
		result[i] = wrapBook(b)
	}
	return result
}
