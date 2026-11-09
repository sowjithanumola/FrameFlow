import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space', desc: 'Toggle playback (Play / Pause)' },
    { key: '[', desc: 'Step to previous frame' },
    { key: ']', desc: 'Step to next frame' },
    { key: 'Cmd / Ctrl + Z', desc: 'Undo last adjustment' },
    { key: 'Cmd / Ctrl + Y', desc: 'Redo last adjustment' },
    { key: 'Cmd / Ctrl + E', desc: 'Open Export GIF dialog' },
    { key: 'Cmd / Ctrl + V', desc: 'Paste image directly from clipboard' },
    { key: 'Esc', desc: 'Close any open dialog or modal' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-semibold text-zinc-100">
              Keyboard Shortcuts
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-2 text-xs">
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-2 border-b border-zinc-800/60 last:border-0"
            >
              <span className="text-zinc-400">{s.desc}</span>
              <kbd className="px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 font-mono text-[11px] shadow-sm">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
