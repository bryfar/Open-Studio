'use client';

import { useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { icons } from '@/shared/components/icons';

interface Shortcut {
  key: string;
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  // Playback
  { key: 'Space', description: 'Play / Pause', category: 'Playback' },
  { key: '←', description: 'Previous frame', category: 'Playback' },
  { key: '→', description: 'Next frame', category: 'Playback' },
  { key: 'K', description: 'Go to start', category: 'Playback' },
  
  // Editing
  { key: 'Delete', description: 'Delete selected clip', category: 'Editing' },
  { key: 'S', description: 'Split clip at playhead', category: 'Editing' },
  { key: 'R', description: 'Duplicate selected clip', category: 'Editing' },
  { key: 'Ctrl+Z', description: 'Undo', category: 'Editing' },
  { key: 'Ctrl+Shift+Z', description: 'Redo', category: 'Editing' },
  { key: 'Ctrl+C', description: 'Copy clip', category: 'Editing' },
  { key: 'Ctrl+V', description: 'Paste clip', category: 'Editing' },
  { key: 'Ctrl+A', description: 'Select all clips', category: 'Editing' },
  
  // Timeline
  { key: '+', description: 'Zoom in', category: 'Timeline' },
  { key: '-', description: 'Zoom out', category: 'Timeline' },
  { key: 'N', description: 'Toggle snap to grid', category: 'Timeline' },
  { key: 'E', description: 'Toggle ripple edit', category: 'Timeline' },
  
  // View
  { key: 'F', description: 'Fit to screen', category: 'View' },
  { key: 'Ctrl+S', description: 'Save project', category: 'View' },
];

export function KeyboardShortcutsDialog() {
  const [isOpen, setIsOpen] = useState(false);

  const categories = [...new Set(shortcuts.map(s => s.category))];

  return (
    <>
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => setIsOpen(true)}
        title="Keyboard shortcuts"
      >
        <icons.keyboard size={16} />
      </Button>

      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="w-full max-w-lg rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-5 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Keyboard Shortcuts
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <icons.close size={18} />
              </Button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {categories.map(category => (
                <div key={category}>
                  <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                    {category}
                  </h3>
                  <div className="space-y-1">
                    {shortcuts
                      .filter(s => s.category === category)
                      .map(shortcut => (
                        <div 
                          key={shortcut.key} 
                          className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-[var(--bg-tertiary)]"
                        >
                          <span className="text-sm text-[var(--text-secondary)]">
                            {shortcut.description}
                          </span>
                          <kbd className="px-2 py-0.5 text-xs font-mono bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded border border-[var(--border-default)]">
                            {shortcut.key}
                          </kbd>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-[var(--border-default)] text-center">
              <p className="text-xs text-[var(--text-muted)]">
                Press <kbd className="px-1.5 py-0.5 text-xs font-mono bg-[var(--bg-tertiary)] rounded">?</kbd> to toggle this dialog
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}