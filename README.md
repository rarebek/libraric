# libraric

libraric is a personal ebook library built with go (backend) and react + tailwind (frontend) using wails.

after a long day of coding i wanted a simple desktop app to keep my scattered pdf and epub files in one place, read them with nice shortcuts, and tweak the ui without diving into css each time. libraric tries to be that app.

## highlights

-   drag..drop (or scan a folder) to add books
-   built-in reader for pdf and epub (arrow keys to flip, +/- to zoom, dark mode, etc.)
-   separate detail view with metadata and quick remove/open actions
-   settings pane where you can pick any installed font, font size, theme, and main colors
-   thumbnails are generated from the first page (cached locally)
-   works offline – everything is local, nothing leaves your machine

## prerequisites

-   go 1.23+
-   node 18+/pnpm (only for the first build, wails handles the rest)
-   windows 10/11 or linux with webview2 / gtk

## setup

```sh
# clone
 git clone https://github.com/youruser/libraric.git
 cd libraric

# run once – wails downloads deps, builds everything and starts the dev server
 wails dev
```

the window pops up with live-reload: edit code, save, and it reloads automatically.

## adding books

1. click **+ add book** and pick a file, or
2. **scan folder** to bulk import every pdf/epub/mobi/azw\* inside.

a thumbnail appears; click it to read.

## keyboard shortcuts in reader

| key   | action               |
| ----- | -------------------- |
| ← / → | previous / next page |
| ↑ / ↓ | scroll               |
| + / - | zoom                 |
| esc   | close reader         |

## settings

open the ⚙ icon in the header to tweak:

-   theme: light / dark
-   font family & size (type any name you have installed)
-   four main colors (background, foreground, primary, secondary)

changes save immediately to `settings.json` in the app folder.

## packaging

when you are happy:

```sh
wails build
```

a single executable appears in `build/bin`.

## roadmap / ideas

-   built-in converter for mobi/azw via calibre cli (optional)
-   progress tracking (last page read)
-   tags & search

feel free to open issues or pull requests.

---

made with ☕ and go fmt.
