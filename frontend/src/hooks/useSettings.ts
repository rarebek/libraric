import { useEffect, useState, useCallback } from 'react'
import { GetUISettings, UpdateUISettings } from '../../wailsjs/go/main/App'
import { uiSettings } from '../types'

const defaultSettings: uiSettings = {
  theme: 'light',
  font: {
    family: 'system-ui',
    size: '14px',
  },
  colorScheme: {
    dark: {
      background: '#121212',
      foreground: '#ffffff',
      primary: '#bb86fc',
      secondary: '#03dac6',
    },
    light: {
      background: '#ffffff',
      foreground: '#000000',
      primary: '#6200ee',
      secondary: '#03dac6',
    },
  },
}

export function useSettings() {
  const [settings, setSettings] = useState<uiSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)

  // load settings on mount
  useEffect(() => {
    ;(async () => {
      try {
        const loaded = (await GetUISettings()) as uiSettings
        setSettings({ ...defaultSettings, ...loaded })
      } catch (err) {
        console.error('failed to load ui settings:', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const update = useCallback(async (updates: Partial<uiSettings>) => {
    // optimistic update
    setSettings((prev) => ({ ...prev, ...updates }) as uiSettings)
    try {
      await UpdateUISettings(updates)
    } catch (err) {
      console.error('failed to update settings:', err)
    }
  }, [])

  return { settings, loading, update } as const
}
