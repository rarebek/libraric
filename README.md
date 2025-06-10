# libraric

a modern ebook management application built with wails, go, and react.

## features

- beautiful, responsive ui with light and dark mode
- book grid view with thumbnail display
- detailed book information view
- add books individually or scan directories
- open ebooks directly from the application
- cross-platform (windows, macos, linux)

## prerequisites

- [go](https://golang.org/doc/install) (1.18 or later)
- [node.js](https://nodejs.org/) (18 or later)
- [wails](https://wails.io/docs/gettingstarted/installation) (v2)

## setup

### windows

1. make sure prerequisites are installed:
   - verify go is installed: `go version`
   - verify node.js is installed: `node --version`
   - verify wails is installed: `wails version`

2. run the setup script in powershell:

```powershell
# run the setup script
.\setup.ps1
```

### macos/linux

1. verify prerequisites:
   - go: `go version`
   - node.js: `node --version`
   - wails: `wails version`

2. install dependencies and run:

```bash
# install frontend dependencies
cd frontend
npm install --save react react-dom @headlessui/react @heroicons/react clsx lucide-react tailwind-merge
npm install --save-dev @types/react @types/react-dom @vitejs/plugin-react typescript vite tailwindcss postcss autoprefixer
npx tailwindcss init -p
cd ..

# run the dev server
wails dev
```

## building for production

```bash
wails build
```

## project structure

- `/app.go` - go backend for the application
- `/frontend/` - react frontend
  - `/src/` - react components and application code
  - `/src/components/` - reusable ui components
- `/build/` - build configuration

## troubleshooting

### node.js and npm issues

if you encounter npm errors:

1. make sure you've installed node.js from the official website: https://nodejs.org/
2. restart your terminal/powershell after installation
3. verify node.js and npm are available in your path:
   ```
   node --version
   npm --version
   ```
4. if using windows, try running powershell as administrator

### tailwindcss initialization fails

if tailwindcss initialization fails:

1. try installing it globally: `npm install -g tailwindcss`
2. manually create the tailwind.config.js file in the frontend directory:
   ```js
   /** @type {import('tailwindcss').Config} */
   module.exports = {
     content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
     theme: {
       extend: {
         colors: {
           primary: {
             500: '#3b82f6', // adjust as needed
           },
         }
       },
     },
     darkMode: 'class',
     plugins: [],
   }
   ```

### wails development server issues

if the wails dev server fails to start:

1. check if the go modules are properly installed: `go mod tidy`
2. make sure your go version is compatible with wails
3. try rebuilding the frontend manually:
   ```
   cd frontend
   npm run build
   cd ..
   wails dev
   ```

## license

mit
