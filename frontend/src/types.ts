// book type definition matching the go backend output
export type book = {
  id: string
  title: string
  author: string
  filePath: string
  coverPath: string
  description: string
  format: string
  addedAt: string
  lastOpenedAt: string
}

// ui settings type matching backend structure
export type uiSettings = {
  theme: 'light' | 'dark'
  font: {
    family: string
    size: string // with units e.g. "14px"
  }
  colorScheme: {
    [key: string]: {
      background: string
      foreground: string
      primary: string
      secondary: string
    }
  }
}
