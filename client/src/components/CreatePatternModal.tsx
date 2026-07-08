import { useState, useRef, useEffect } from 'react';

interface Props {
  onConfirm: (name: string, description: string) => void;
  onCancel: () => void;
}

export function CreatePatternModal({ onConfirm, onCancel }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onConfirm(name.trim(), description.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[400px] mx-4 bg-[#0d0d18] border border-[#1e293b] rounded-lg p-6 shadow-2xl"
      >
        <h2 className="text-[#f59e0b] font-mono text-sm font-semibold tracking-widest uppercase mb-5">
          New Pattern
        </h2>

        <label className="block mb-3">
          <span className="text-[#64748b] text-xs font-mono tracking-wider">
            Pattern Name *
          </span>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Grid A — Row 3"
            required
            className="mt-1 w-full bg-[#0a0a0f] border border-[#1e293b] rounded px-3 py-2
                       text-[#e2e8f0] text-sm font-mono placeholder-[#334155]
                       focus:outline-none focus:border-[#f59e0b] transition-colors"
          />
        </label>

        <label className="block mb-5">
          <span className="text-[#64748b] text-xs font-mono tracking-wider">
            Description (optional)
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Bench level, rock type…"
            className="mt-1 w-full bg-[#0a0a0f] border border-[#1e293b] rounded px-3 py-2
                       text-[#e2e8f0] text-sm font-mono placeholder-[#334155] resize-none
                       focus:outline-none focus:border-[#f59e0b] transition-colors"
          />
        </label>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={!name.trim()}
            className="flex-1 bg-[#f59e0b] text-[#0a0a0f] font-mono font-semibold text-sm
                       py-2 rounded hover:bg-[#fbbf24] disabled:opacity-40 disabled:cursor-not-allowed
                       transition-colors tracking-wider"
          >
            CREATE
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-transparent border border-[#1e293b] text-[#64748b] font-mono text-sm
                       py-2 rounded hover:border-[#334155] hover:text-[#94a3b8] transition-colors
                       tracking-wider"
          >
            CANCEL
          </button>
        </div>
      </form>
    </div>
  );
}
