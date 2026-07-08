import { useState } from 'react';
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
  const [mobileOpen, setMobileOpen] = useState(false);

  const content = (
    <>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#1e293b] flex items-center justify-between">
        <div>
          <h1 className="text-[#f59e0b] text-xl font-bold tracking-[0.2em] uppercase">
            STRATA
          </h1>
          <p className="text-[#334155] text-[10px] tracking-widest mt-0.5">
            DRILLING PATTERN VISUALISER
          </p>
        </div>
        {/* Fechar drawer — só visível no mobile */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden text-[#475569] hover:text-[#94a3b8] text-2xl leading-none"
          aria-label="Fechar menu"
        >
          ✕
        </button>
      </div>

      {/* Padrão ativo */}
      {activePattern && (
        <div className="px-5 py-3 border-b border-[#1e293b] bg-[#f59e0b]/5">
          <p className="text-[10px] text-[#64748b] tracking-wider uppercase mb-0.5">Active</p>
          <p className="text-[#f59e0b] text-sm font-semibold truncate">{activePattern.name}</p>
          {activePattern.description && (
            <p className="text-[#475569] text-[10px] truncate mt-0.5">{activePattern.description}</p>
          )}
        </div>
      )}

      {/* Conteúdo com scroll */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
        <PatternManager
          patterns={patterns}
          loading={loading}
          error={error}
          activePatternId={activePattern?.id ?? null}
          onSelect={(p) => { onSelectPattern(p); setMobileOpen(false); }}
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

      {/* Footer */}
      <div className="px-5 py-3 border-t border-[#1e293b]">
        <p className="text-[#1e293b] text-[10px] leading-relaxed">
          {activePattern
            ? 'Toque no terreno para perfurar · Arraste para orbitar'
            : 'Selecione ou crie um padrão para começar'}
        </p>
      </div>
    </>
  );

  return (
    <>
      {/* ── Desktop: sidebar fixa ─────────────────────────────────────────── */}
      <aside className="hidden lg:flex w-[300px] shrink-0 h-screen bg-[#0d0d18]
                        border-r border-[#1e293b] flex-col overflow-hidden font-mono">
        {content}
      </aside>

      {/* ── Mobile: botão hambúrguer ──────────────────────────────────────── */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menu"
        className="lg:hidden fixed top-4 left-4 z-30 bg-[#0d0d18] border border-[#1e293b]
                   text-[#f59e0b] rounded-lg p-2.5 shadow-xl"
      >
        <span className="block w-5 h-0.5 bg-current mb-1" />
        <span className="block w-5 h-0.5 bg-current mb-1" />
        <span className="block w-5 h-0.5 bg-current" />
      </button>

      {/* ── Mobile: overlay + drawer ──────────────────────────────────────── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          {/* Sombra clicável para fechar */}
          <div
            className="flex-1 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside className="w-[300px] max-w-[85vw] h-full bg-[#0d0d18]
                            border-l border-[#1e293b] flex flex-col font-mono
                            shadow-2xl animate-slide-in-right overflow-hidden">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
