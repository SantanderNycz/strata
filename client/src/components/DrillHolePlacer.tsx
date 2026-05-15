import { useState } from 'react';

interface Props {
  /** Auto-incremented suggestion based on existing holes */
  nextSequence: number;
  position: { x: number; z: number };
  onConfirm: (depth: number, sequence: number) => void;
  onCancel: () => void;
}

export function DrillHolePlacer({ nextSequence, position, onConfirm, onCancel }: Props) {
  const [depth, setDepth] = useState(8);
  const [sequence, setSequence] = useState(nextSequence);

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40
                 bg-[#0d0d18] border border-[#f59e0b]/40 rounded-lg p-5 shadow-2xl
                 w-[380px] font-mono"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-[#f59e0b] text-xs font-semibold tracking-widest uppercase">
          Place Drill Hole
        </span>
        <span className="text-[#334155] text-xs">
          x {position.x.toFixed(1)} · z {position.z.toFixed(1)}
        </span>
      </div>

      {/* Depth slider */}
      <label className="block mb-4">
        <div className="flex justify-between mb-1">
          <span className="text-[#64748b] text-xs tracking-wider">Depth</span>
          <span className="text-[#e2e8f0] text-xs font-semibold">{depth} m</span>
        </div>
        <input
          type="range"
          min={1}
          max={20}
          step={0.5}
          value={depth}
          onChange={(e) => setDepth(Number(e.target.value))}
          className="w-full accent-[#f59e0b] cursor-pointer"
        />
        <div className="flex justify-between mt-0.5 text-[#334155] text-[10px]">
          <span>1 m</span>
          <span>20 m</span>
        </div>
      </label>

      {/* Sequence number */}
      <label className="block mb-5">
        <span className="text-[#64748b] text-xs tracking-wider">Sequence #</span>
        <input
          type="number"
          min={1}
          value={sequence}
          onChange={(e) => setSequence(Math.max(1, parseInt(e.target.value) || 1))}
          className="mt-1 w-full bg-[#0a0a0f] border border-[#1e293b] rounded px-3 py-2
                     text-[#e2e8f0] text-sm font-mono
                     focus:outline-none focus:border-[#f59e0b] transition-colors"
        />
      </label>

      <div className="flex gap-3">
        <button
          onClick={() => onConfirm(depth, sequence)}
          className="flex-1 bg-[#f59e0b] text-[#0a0a0f] font-semibold text-sm
                     py-2 rounded hover:bg-[#fbbf24] transition-colors tracking-wider"
        >
          CONFIRM
        </button>
        <button
          onClick={onCancel}
          className="flex-1 bg-transparent border border-[#1e293b] text-[#64748b] text-sm
                     py-2 rounded hover:border-[#334155] hover:text-[#94a3b8] transition-colors
                     tracking-wider"
        >
          CANCEL
        </button>
      </div>
    </div>
  );
}
