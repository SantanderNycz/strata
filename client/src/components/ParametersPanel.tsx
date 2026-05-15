import { Pattern } from '../types';

interface Props {
  pattern: Pattern;
  onClearScene: () => void;
  onSimulateBlast: () => void;
}

export function ParametersPanel({ pattern, onClearScene, onSimulateBlast }: Props) {
  const holes = pattern.drillHoles;
  const count = holes.length;
  const avgDepth =
    count > 0
      ? (holes.reduce((sum, h) => sum + h.depth, 0) / count).toFixed(1)
      : '—';
  const seqs = holes.map((h) => h.sequence);
  const seqMin = count > 0 ? Math.min(...seqs) : '—';
  const seqMax = count > 0 ? Math.max(...seqs) : '—';

  return (
    <div className="border-t border-[#1e293b] pt-4 mt-4">
      <p className="text-[#f59e0b] text-xs font-semibold tracking-widest uppercase mb-3">
        Parameters
      </p>

      <div className="space-y-2 mb-4">
        <Stat label="Total Holes" value={String(count)} />
        <Stat label="Avg Depth" value={count > 0 ? `${avgDepth} m` : '—'} />
        <Stat
          label="Seq Range"
          value={count > 0 ? `${seqMin} → ${seqMax}` : '—'}
        />
      </div>

      {/* Simulate Blast */}
      <button
        onClick={onSimulateBlast}
        disabled={count === 0}
        className="w-full bg-[#f59e0b] text-[#0a0a0f] font-mono font-semibold text-xs
                   py-2.5 rounded hover:bg-[#fbbf24] disabled:opacity-30 disabled:cursor-not-allowed
                   transition-colors tracking-widest uppercase mb-2"
      >
        ▶ Simulate Blast
      </button>

      {/* Clear Scene */}
      <button
        onClick={onClearScene}
        disabled={count === 0}
        className="w-full bg-transparent border border-[#ef4444]/40 text-[#ef4444]/70 font-mono
                   text-xs py-2 rounded hover:border-[#ef4444] hover:text-[#ef4444]
                   disabled:opacity-30 disabled:cursor-not-allowed transition-colors
                   tracking-widest uppercase"
      >
        ✕ Clear Scene
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-[#475569] text-xs tracking-wide">{label}</span>
      <span className="text-[#e2e8f0] text-xs font-semibold tabular-nums">{value}</span>
    </div>
  );
}
