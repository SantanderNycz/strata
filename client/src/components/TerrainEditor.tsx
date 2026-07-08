import { useState, useCallback } from 'react';
import { Pattern, TerrainNode } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────────
const NODES = 11; // 0..10 em cada eixo

/** Constrói uma grade 11×11 inicializada a partir dos TerrainNodes salvos. */
function buildGrid(nodes: TerrainNode[]): number[][] {
  const grid = Array.from({ length: NODES }, () => Array(NODES).fill(0) as number[]);
  nodes.forEach(n => {
    if (n.gridX >= 0 && n.gridX < NODES && n.gridZ >= 0 && n.gridZ < NODES)
      grid[n.gridZ][n.gridX] = n.elevation;
  });
  return grid;
}

/** Interpola cor entre azul (negativo) → cinza (zero) → âmbar (positivo). */
function cellBg(elev: number): string {
  if (elev === 0) return '#1e293b';
  const cap = 15;
  if (elev > 0) {
    const t = Math.min(elev / cap, 1);
    const r = Math.round(0x1e + t * (0xd9 - 0x1e));
    const g = Math.round(0x29 + t * (0x77 - 0x29));
    const b = Math.round(0x3b + t * (0x06 - 0x3b));
    return `rgb(${r},${g},${b})`;
  } else {
    const t = Math.min(-elev / cap, 1);
    const r = Math.round(0x1e + t * (0x1d - 0x1e));
    const g = Math.round(0x29 + t * (0x4e - 0x29));
    const b = Math.round(0x3b + t * (0xd8 - 0x3b));
    return `rgb(${r},${g},${b})`;
  }
}

function cellText(elev: number): string {
  return elev === 0 ? '' : `${elev > 0 ? '+' : ''}${elev}`;
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  pattern: Pattern;
  onSaveNode: (gridX: number, gridZ: number, elevation: number) => Promise<void>;
  onFlattenAll: () => Promise<void>;
  onClose: () => void;
}

// ── Componente ────────────────────────────────────────────────────────────────
export function TerrainEditor({ pattern, onSaveNode, onFlattenAll, onClose }: Props) {
  const [grid, setGrid] = useState<number[][]>(() => buildGrid(pattern.terrainNodes));
  const [selected, setSelected] = useState<{ x: number; z: number } | null>(null);
  const [inputVal, setInputVal] = useState('');
  const [saving, setSaving] = useState(false);

  // Quando o usuário clica em uma célula
  const handleCellClick = useCallback((gx: number, gz: number) => {
    setSelected({ x: gx, z: gz });
    setInputVal(String(grid[gz][gx]));
  }, [grid]);

  // Confirma o valor digitado e salva via GraphQL
  const handleConfirm = async () => {
    if (!selected) return;
    const val = parseFloat(inputVal);
    if (isNaN(val)) return;

    setSaving(true);
    await onSaveNode(selected.x, selected.z, val);

    // Atualiza grid local imediatamente (UX responsivo)
    setGrid(prev => {
      const next = prev.map(r => [...r]);
      next[selected.z][selected.x] = val;
      return next;
    });
    setSaving(false);
    setSelected(null);
  };

  const handleFlatten = async () => {
    if (!window.confirm('Zerar todas as cotas do terreno?')) return;
    setSaving(true);
    await onFlattenAll();
    setGrid(Array.from({ length: NODES }, () => Array(NODES).fill(0)));
    setSaving(false);
    setSelected(null);
  };

  // Eixo X: -10 → +10 com passo 2
  const xLabels = Array.from({ length: NODES }, (_, i) => (i * 2 - 10).toString());
  // Eixo Z: -10 → +10 com passo 2 (de cima para baixo na grade)
  const zLabels = Array.from({ length: NODES }, (_, i) => (i * 2 - 10).toString());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#0d0d18] border border-[#1e293b] rounded-xl shadow-2xl flex flex-col max-h-full overflow-auto">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b]">
          <div>
            <h2 className="text-[#f59e0b] font-mono font-bold tracking-widest uppercase text-sm">
              Terrain Relief Editor
            </h2>
            <p className="text-[#475569] text-xs font-mono mt-0.5">
              {pattern.name} · clique na célula → ajuste a cota (m) → confirme
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#475569] hover:text-[#94a3b8] text-lg transition-colors ml-6"
          >
            ✕
          </button>
        </div>

        {/* Corpo */}
        <div className="overflow-x-auto">
        <div className="px-6 py-5 flex gap-6 items-start" style={{ minWidth: 'max-content' }}>

          {/* Grade 2D */}
          <div>
            {/* Legenda X (topo) */}
            <div className="flex mb-1 ml-8">
              {xLabels.map(l => (
                <div key={l} className="w-9 text-center text-[9px] text-[#334155] font-mono shrink-0">{l}</div>
              ))}
            </div>

            <div className="flex">
              {/* Legenda Z (lado esquerdo) */}
              <div className="flex flex-col mr-1">
                {zLabels.map(l => (
                  <div key={l} className="h-9 flex items-center justify-end pr-1 text-[9px] text-[#334155] font-mono w-7">{l}</div>
                ))}
              </div>

              {/* Células */}
              <div
                style={{ display: 'grid', gridTemplateColumns: `repeat(${NODES}, 2.25rem)`, gap: 2 }}
              >
                {Array.from({ length: NODES }, (_, gz) =>
                  Array.from({ length: NODES }, (_, gx) => {
                    const elev = grid[gz][gx];
                    const isSelected = selected?.x === gx && selected?.z === gz;
                    return (
                      <button
                        key={`${gx}-${gz}`}
                        onClick={() => handleCellClick(gx, gz)}
                        title={`X=${gx * 2 - 10}, Z=${gz * 2 - 10}: ${elev}m`}
                        style={{ backgroundColor: cellBg(elev) }}
                        className={`h-9 w-9 rounded-sm text-[8px] font-mono transition-all
                          flex items-center justify-center
                          ${isSelected
                            ? 'ring-2 ring-[#f59e0b] ring-offset-1 ring-offset-[#0d0d18]'
                            : 'hover:ring-1 hover:ring-[#f59e0b]/50'
                          }`}
                      >
                        <span
                          className="truncate px-0.5"
                          style={{ color: Math.abs(elev) > 7 ? '#fff' : '#94a3b8' }}
                        >
                          {cellText(elev)}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Legenda de eixos */}
            <p className="text-[#1e293b] text-[10px] font-mono text-center mt-2 ml-8">
              ← X →
            </p>
          </div>

          {/* Painel lateral: input + legenda de cores */}
          <div className="flex flex-col gap-4 min-w-[180px]">

            {/* Input de elevação */}
            <div className="bg-[#0a0a0f] border border-[#1e293b] rounded-lg p-4">
              {selected ? (
                <>
                  <p className="text-[#f59e0b] text-xs font-mono font-semibold mb-1 tracking-wider">
                    Nó selecionado
                  </p>
                  <p className="text-[#475569] text-[10px] font-mono mb-3">
                    X = {selected.x * 2 - 10} m &nbsp;·&nbsp; Z = {selected.z * 2 - 10} m
                  </p>
                  <label className="block">
                    <span className="text-[#64748b] text-[10px] tracking-wider font-mono">
                      Cota (m)
                    </span>
                    <input
                      type="number"
                      step="0.5"
                      autoFocus
                      value={inputVal}
                      onChange={e => setInputVal(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleConfirm()}
                      className="mt-1 w-full bg-[#0d0d18] border border-[#334155] rounded px-3 py-2
                                 text-[#e2e8f0] text-sm font-mono
                                 focus:outline-none focus:border-[#f59e0b] transition-colors"
                    />
                  </label>
                  <button
                    onClick={handleConfirm}
                    disabled={saving}
                    className="mt-3 w-full bg-[#f59e0b] text-[#0a0a0f] font-mono font-semibold
                               text-xs py-2 rounded hover:bg-[#fbbf24] disabled:opacity-50
                               transition-colors tracking-widest uppercase"
                  >
                    {saving ? 'Salvando…' : 'Aplicar  ↵'}
                  </button>
                </>
              ) : (
                <p className="text-[#334155] text-xs font-mono text-center py-4 leading-relaxed">
                  Clique em<br />uma célula<br />para editar
                </p>
              )}
            </div>

            {/* Legenda de cores */}
            <div className="bg-[#0a0a0f] border border-[#1e293b] rounded-lg p-4">
              <p className="text-[#475569] text-[10px] font-mono tracking-wider mb-2">Legenda</p>
              <div className="space-y-1.5">
                {[
                  { color: '#1d4ed8', label: '< 0 m  (corte)' },
                  { color: '#1e293b', label: '  0 m  (plano)' },
                  { color: '#d97706', label: '> 0 m  (aterro)' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-[#475569] text-[10px] font-mono">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Botão Planificar */}
            <button
              onClick={handleFlatten}
              disabled={saving}
              className="w-full bg-transparent border border-[#334155] text-[#64748b]
                         font-mono text-xs py-2 rounded hover:border-[#ef4444]/60
                         hover:text-[#ef4444]/70 disabled:opacity-40 transition-colors
                         tracking-widest uppercase"
            >
              ↺ Planificar tudo
            </button>
          </div>
        </div>
        </div>{/* fim overflow-x-auto */}
      </div>
    </div>
  );
}
