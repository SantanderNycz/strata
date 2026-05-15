import { Pattern } from '../types';

interface Props {
  patterns: Pattern[];
  loading: boolean;
  error?: Error;
  activePatternId: string | null;
  onSelect: (pattern: Pattern) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
}

export function PatternManager({
  patterns,
  loading,
  error,
  activePatternId,
  onSelect,
  onDelete,
  onCreate,
}: Props) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[#f59e0b] text-xs font-semibold tracking-widest uppercase">
          Patterns
        </span>
        <button
          onClick={onCreate}
          title="New pattern"
          className="text-[#f59e0b] text-lg leading-none hover:text-[#fbbf24] transition-colors"
        >
          +
        </button>
      </div>

      {loading && (
        <p className="text-[#334155] text-xs font-mono animate-pulse">Loading…</p>
      )}

      {error && (
        <p className="text-[#ef4444] text-xs font-mono">
          Error: {error.message}
        </p>
      )}

      {!loading && !error && patterns.length === 0 && (
        <p className="text-[#334155] text-xs font-mono leading-relaxed">
          No patterns yet.{' '}
          <button
            onClick={onCreate}
            className="text-[#f59e0b]/70 hover:text-[#f59e0b] underline underline-offset-2"
          >
            Create one
          </button>{' '}
          to begin.
        </p>
      )}

      <ul className="space-y-1 max-h-[calc(100vh-400px)] overflow-y-auto pr-1">
        {patterns.map((p) => {
          const isActive = p.id === activePatternId;
          return (
            <li key={p.id}>
              <div
                className={`group flex items-start justify-between gap-2 px-3 py-2.5 rounded cursor-pointer
                            border transition-all
                            ${
                              isActive
                                ? 'border-[#f59e0b]/50 bg-[#f59e0b]/5'
                                : 'border-transparent hover:border-[#1e293b] hover:bg-[#0a0a0f]'
                            }`}
                onClick={() => onSelect(p)}
              >
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs font-semibold truncate ${
                      isActive ? 'text-[#f59e0b]' : 'text-[#cbd5e1]'
                    }`}
                  >
                    {p.name}
                  </p>
                  {p.description && (
                    <p className="text-[10px] text-[#475569] truncate mt-0.5">
                      {p.description}
                    </p>
                  )}
                  <p className="text-[10px] text-[#334155] mt-0.5">
                    {p.drillHoles.length} hole{p.drillHoles.length !== 1 ? 's' : ''}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(p.id);
                  }}
                  title="Delete pattern"
                  className="opacity-0 group-hover:opacity-100 text-[#ef4444]/50
                             hover:text-[#ef4444] text-xs transition-all shrink-0 mt-0.5"
                >
                  ✕
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
