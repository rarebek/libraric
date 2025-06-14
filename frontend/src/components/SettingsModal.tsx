import React, { useState } from 'react'
import { uiSettings } from '../types'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface props {
  settings: uiSettings
  onClose: () => void
  onSave: (updates: Partial<uiSettings>) => void
}

const themes: ('light' | 'dark')[] = ['light', 'dark']

const SettingsModal: React.FC<props> = ({ settings, onClose, onSave }) => {
  const [local, setLocal] = useState<uiSettings>({ ...settings })

  const handleChange = (path: string, value: any) => {
    setLocal((prev) => {
      const updated: any = { ...prev }
      const parts = path.split('.')
      let curr = updated
      for (let i = 0; i < parts.length - 1; i++) {
        curr = curr[parts[i]]
      }
      curr[parts[parts.length - 1]] = value
      return updated
    })
  }

  const handleSave = () => {
    onSave(local)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>

      <div className="relative w-full max-w-3xl bg-white dark:bg-gray-800 rounded-md shadow-lg overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        <div className="p-6 overflow-y-auto max-h-[90vh] custom-scrollbar scrollbar-thin scrollbar-thumb-rounded-md scrollbar-thumb-slate-400 dark:scrollbar-thumb-slate-600">
          <h2 className="text-xl font-semibold mb-4 text-center">
            application settings
          </h2>

          {/* theme */}
          <section className="mb-6">
            <h3 className="text-lg font-medium mb-2">theme</h3>
            <div className="flex items-center gap-4">
              {themes.map((t) => (
                <label
                  key={t}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="theme"
                    value={t}
                    checked={local.theme === t}
                    onChange={() => handleChange('theme', t)}
                    className="form-radio"
                  />
                  <span className="capitalize">{t}</span>
                </label>
              ))}
            </div>
          </section>

          {/* font */}
          <section className="mb-6">
            <h3 className="text-lg font-medium mb-2">font</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm mb-1">family</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  value={local.font.family}
                  onChange={(e) => handleChange('font.family', e.target.value)}
                  placeholder="enter font family"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">size (css units)</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  value={local.font.size}
                  onChange={(e) => handleChange('font.size', e.target.value)}
                  placeholder="14px"
                />
              </div>
            </div>
          </section>

          {/* color scheme */}
          {themes.map((th) => (
            <section key={th} className="mb-6">
              <h3 className="text-lg font-medium mb-2 capitalize">
                {th} color scheme
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {(Object.keys(local.colorScheme[th]) as string[]).map((key) => (
                  <div key={key} className="flex flex-col gap-1">
                    <label className="text-sm capitalize">{key}</label>
                    <input
                      type="color"
                      value={(local.colorScheme as any)[th][key]}
                      onChange={(e) =>
                        handleChange(`colorScheme.${th}.${key}`, e.target.value)
                      }
                      className="w-full h-10 border rounded"
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}

          <div className="mt-8 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded transition-colors"
            >
              save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsModal
