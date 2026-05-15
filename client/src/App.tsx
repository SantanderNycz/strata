import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_PATTERNS } from './graphql/queries';
import {
  CREATE_PATTERN,
  ADD_DRILL_HOLE,
  DELETE_PATTERN,
  CLEAR_PATTERN_HOLES,
  SET_TERRAIN_NODE,
  CLEAR_TERRAIN_NODES,
} from './graphql/mutations';
import { Pattern, PendingHole } from './types';
import { Sidebar } from './components/Sidebar';
import { CreatePatternModal } from './components/CreatePatternModal';
import { DrillHolePlacer } from './components/DrillHolePlacer';
import { TerrainEditor } from './components/TerrainEditor';
import { useStrataScene } from './hooks/useStrataScene';

const REFETCH: string[] = ['GetPatterns'];

export default function App() {
  const canvasRef = useRef<HTMLDivElement>(null);

  // ─── State ─────────────────────────────────────────────────────────────────
  const [activePatternId, setActivePatternId] = useState<string | null>(null);
  const [pendingHole, setPendingHole] = useState<PendingHole | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTerrainEditor, setShowTerrainEditor] = useState(false);

  // ─── GraphQL ───────────────────────────────────────────────────────────────
  const { data, loading, error } = useQuery<{ patterns: Pattern[] }>(GET_PATTERNS);

  const [createPattern]     = useMutation(CREATE_PATTERN,     { refetchQueries: REFETCH });
  const [addDrillHole]      = useMutation(ADD_DRILL_HOLE,     { refetchQueries: REFETCH });
  const [deletePattern]     = useMutation(DELETE_PATTERN,     { refetchQueries: REFETCH });
  const [clearPatternHoles] = useMutation(CLEAR_PATTERN_HOLES,{ refetchQueries: REFETCH });
  const [setTerrainNode]    = useMutation(SET_TERRAIN_NODE,   { refetchQueries: REFETCH });
  const [clearTerrainNodes] = useMutation(CLEAR_TERRAIN_NODES,{ refetchQueries: REFETCH });

  // Padrão ativo derivado dos dados da query (sempre atualizado)
  const activePattern = data?.patterns.find(p => p.id === activePatternId) ?? null;

  // ─── Terrain click → configura furo ───────────────────────────────────────
  const handleTerrainClick = useCallback((x: number, z: number) => {
    if (!activePatternId) return;
    setPendingHole({ x, z });
  }, [activePatternId]);

  const { simulateBlast } = useStrataScene(canvasRef, activePattern, handleTerrainClick);

  // ─── Handlers — padrões ───────────────────────────────────────────────────
  const handleCreatePattern = async (name: string, description: string) => {
    const res = await createPattern({ variables: { name, description } });
    setShowCreateModal(false);
    if (res.data?.createPattern?.id) setActivePatternId(res.data.createPattern.id);
  };

  const handleDeletePattern = async (id: string) => {
    if (!window.confirm('Deletar este padrão e todos os seus furos?')) return;
    await deletePattern({ variables: { id } });
    if (activePatternId === id) setActivePatternId(null);
  };

  const handleConfirmHole = async (depth: number, sequence: number) => {
    if (!pendingHole || !activePatternId) return;
    await addDrillHole({
      variables: { patternId: activePatternId, x: pendingHole.x, z: pendingHole.z, depth, sequence },
    });
    setPendingHole(null);
  };

  const handleClearScene = async () => {
    if (!activePattern) return;
    if (!window.confirm(`Remover ${activePattern.drillHoles.length} furo(s) de "${activePattern.name}"?`)) return;
    await clearPatternHoles({ variables: { patternId: activePattern.id } });
  };

  // ─── Handlers — terreno ───────────────────────────────────────────────────
  const handleSaveTerrainNode = async (gridX: number, gridZ: number, elevation: number) => {
    if (!activePattern) return;
    await setTerrainNode({ variables: { patternId: activePattern.id, gridX, gridZ, elevation } });
  };

  const handleFlattenTerrain = async () => {
    if (!activePattern) return;
    await clearTerrainNodes({ variables: { patternId: activePattern.id } });
  };

  // ─── Sequência auto-incremental ────────────────────────────────────────────
  const nextSequence = activePattern?.drillHoles.length
    ? Math.max(...activePattern.drillHoles.map(h => h.sequence)) + 1
    : 1;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-[#0a0a0f] font-mono overflow-hidden">
      <Sidebar
        patterns={data?.patterns ?? []}
        loading={loading}
        error={error as Error | undefined}
        activePattern={activePattern}
        onSelectPattern={p => setActivePatternId(p.id)}
        onDeletePattern={handleDeletePattern}
        onCreatePattern={() => setShowCreateModal(true)}
        onSimulateBlast={simulateBlast}
        onClearScene={handleClearScene}
        onEditTerrain={() => setShowTerrainEditor(true)}
      />

      {/* Canvas Three.js */}
      <div
        ref={canvasRef}
        className="flex-1 relative"
        style={{ cursor: activePattern ? 'crosshair' : 'default' }}
      >
        {!activePattern && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none select-none">
            <p className="text-[#1e293b] text-sm tracking-[0.3em] uppercase">No active pattern</p>
            <p className="text-[#0f172a] text-xs tracking-widest">Select or create one in the sidebar</p>
          </div>
        )}
      </div>

      {/* Modais / overlays */}
      {showCreateModal && (
        <CreatePatternModal
          onConfirm={handleCreatePattern}
          onCancel={() => setShowCreateModal(false)}
        />
      )}

      {pendingHole && activePattern && (
        <DrillHolePlacer
          nextSequence={nextSequence}
          position={pendingHole}
          onConfirm={handleConfirmHole}
          onCancel={() => setPendingHole(null)}
        />
      )}

      {showTerrainEditor && activePattern && (
        <TerrainEditor
          pattern={activePattern}
          onSaveNode={handleSaveTerrainNode}
          onFlattenAll={handleFlattenTerrain}
          onClose={() => setShowTerrainEditor(false)}
        />
      )}
    </div>
  );
}
