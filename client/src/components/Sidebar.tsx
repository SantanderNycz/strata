import { Pattern } from '../types';
import { PatternManager } from './PatternManager';
import { ParametersPanel } from './ParametersPanel';

interface Props {
  patterns: Pattern[];
  loading: boolean;
  error?: Error;
  activePattern: Pattern | null;
  onSelectPattern: (p: Pattern) => void;
  onDeletePattern: (id: string) => void;
  onCreatePattern: () => void;
  onSimulateBlast: () => void;
  onClearScene: () => void;
  onEditTerrain: () => void;
}

export function Sidebar({
  patterns,
  loading,
  error,
  activePattern,
  onSelectPattern,
  onDeletePattern,
  onCreatePattern,
  onSimulateBlast,
  onClearScene,
  onEditTerrain,
}: Props) {
  return (
    <aside
      className="w-[300px] shrink-0 h-screen bg-[#0d0d18] border-r border-[#1e293b]
                 flex flex-col overflow-hidden font-mono"
    >
      {/* Logo / title */}
      <div className="px-5 py-5 border-b border-[#1e293b]">
        <h1 className="text-[#f59e0b] text-xl font-bold tracking-[0.2em] uppercase">
          STRATA
        </h1>
        <p className="text-[#334155] text-[10px] tracking-widest mt-0.5">
          DRILLING PATTERN VISUALISER
        </p>
      </div>

      {/* Active pattern badge */}
      {activePattern && (
        <div className="px-5 py-3 border-b border-[#1e293b] bg-[#f59e0b]/5">
          <p className="text-[10px] text-[#64748b] tracking-wider uppercase mb-0.5">
            Active
          </p>
          <p className="text-[#f59e0b] text-sm font-semibold truncate">
            {activePattern.name}
          </p>
          {activePattern.description && (
            <p className="text-[#475569] text-[10px] truncate mt-0.5">
              {activePattern.description}
            </p>
          )}
        </div>
      )}

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
        <PatternManager
          patterns={patterns}
          loading={loading}
          error={error}
          activePatternId={activePattern?.id ?? null}
          onSelect={onSelectPattern}
          onDelete={onDeletePattern}
          onCreate={onCreatePattern}
        />

        {activePattern && (
          <ParametersPanel
            pattern={activePattern}
            onSimulateBlast={onSimulateBlast}
            onClearScene={onClearScene}
            onEditTerrain={onEditTerrain}
          />
        )}
      </div>

      {/* Footer hint */}
      <div className="px-5 py-3 border-t border-[#1e293b]">
        <p className="text-[#1e293b] text-[10px] leading-relaxed">
          {activePattern
            ? 'Click terrain to place a hole · Drag to orbit'
            : 'Select a pattern to start placing holes'}
        </p>
      </div>
    </aside>
  );
}
