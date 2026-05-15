/**
 * useStrataScene
 *
 * Gerencia todo o ciclo de vida do Three.js: cena, câmera, renderer,
 * controles, malha de terreno deformável e furos de perfuração.
 */
import { useEffect, useRef, useCallback, RefObject } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Pattern, TerrainNode } from '../types';

// ─── Constantes ───────────────────────────────────────────────────────────────
const GRID_SIZE = 20;       // tamanho do grid em unidades de cena
const TERRAIN_SEGS = 10;    // segmentos da malha → 11×11 vértices
const NODES = TERRAIN_SEGS + 1; // 11
const SCENE_BG = 0x0a0a0f;
const HOLE_RADIUS = 0.13;
const HOLE_SEGS = 10;

/** Gradiente azul→cinza→âmbar mapeado para elevação negativa→zero→positiva */
function elevationToColor(e: number, minE: number, maxE: number): THREE.Color {
  if (e >= 0) {
    const t = maxE > 0 ? Math.min(e / maxE, 1) : 0;
    return new THREE.Color().lerpColors(new THREE.Color(0x1e293b), new THREE.Color(0xd97706), t);
  } else {
    const t = minE < 0 ? Math.min(-e / -minE, 1) : 0;
    return new THREE.Color().lerpColors(new THREE.Color(0x1e293b), new THREE.Color(0x1d4ed8), t);
  }
}

/** Gradiente azul→vermelho para sequência de furos */
function sequenceColor(seq: number, min: number, max: number): THREE.Color {
  const t = max === min ? 0 : (seq - min) / (max - min);
  return new THREE.Color().lerpColors(new THREE.Color(0x3b82f6), new THREE.Color(0xef4444), t);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useStrataScene(
  containerRef: RefObject<HTMLDivElement | null>,
  pattern: Pattern | null,
  onTerrainClick: (x: number, z: number) => void,
): { simulateBlast: () => void } {
  const sceneRef        = useRef<THREE.Scene | null>(null);
  const rendererRef     = useRef<THREE.WebGLRenderer | null>(null);
  const labelRendererRef= useRef<CSS2DRenderer | null>(null);
  const cameraRef       = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef     = useRef<OrbitControls | null>(null);
  /** Geometria compartilhada entre malha sólida e wireframe */
  const terrainGeoRef   = useRef<THREE.PlaneGeometry | null>(null);
  /** Malha sólida — usada também para raycasting */
  const terrainMeshRef  = useRef<THREE.Mesh | null>(null);
  const holeGroupRef    = useRef<THREE.Group | null>(null);
  const rafRef          = useRef<number>(0);
  const blastTimeoutsRef= useRef<ReturnType<typeof setTimeout>[]>([]);
  const mouseDownRef    = useRef<{ x: number; y: number } | null>(null);
  const onClickRef      = useRef(onTerrainClick);
  useEffect(() => { onClickRef.current = onTerrainClick; }, [onTerrainClick]);

  // ─── Inicialização da cena (executa uma vez) ────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Cena
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(SCENE_BG);
    scene.fog = new THREE.FogExp2(SCENE_BG, 0.018);
    sceneRef.current = scene;

    // Câmera
    const { clientWidth: w, clientHeight: h } = container;
    const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 500);
    camera.position.set(0, 16, 22);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // WebGL renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // CSS2D renderer para labels HTML projetados em 3D
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(w, h);
    labelRenderer.domElement.style.cssText =
      'position:absolute;top:0;left:0;pointer-events:none;overflow:hidden;';
    container.appendChild(labelRenderer.domElement);
    labelRendererRef.current = labelRenderer;

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.minDistance = 4;
    controls.maxDistance = 60;
    controls.maxPolarAngle = Math.PI / 2.05;
    controlsRef.current = controls;

    // ── Malha de terreno deformável ──────────────────────────────────────────
    // PlaneGeometry com 10×10 segmentos → 11×11 = 121 vértices.
    // A rotação de -90° no X coloca o plano horizontal (XZ world).
    // A componente Z local dos vértices mapeia para Y world (elevação).
    const terrainGeo = new THREE.PlaneGeometry(
      GRID_SIZE, GRID_SIZE, TERRAIN_SEGS, TERRAIN_SEGS,
    );
    terrainGeoRef.current = terrainGeo;

    // Inicializa vertex colors com cinza escuro (sem elevação)
    const vertexCount = NODES * NODES;
    const colorData = new Float32Array(vertexCount * 3);
    const baseColor = new THREE.Color(0x1e293b);
    for (let i = 0; i < vertexCount; i++) {
      colorData[i * 3]     = baseColor.r;
      colorData[i * 3 + 1] = baseColor.g;
      colorData[i * 3 + 2] = baseColor.b;
    }
    terrainGeo.setAttribute('color', new THREE.BufferAttribute(colorData, 3));

    // Malha sólida com vertex colors
    const solidMat = new THREE.MeshPhongMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      shininess: 15,
    });
    const solidMesh = new THREE.Mesh(terrainGeo, solidMat);
    solidMesh.rotation.x = -Math.PI / 2;
    solidMesh.name = 'terrain';
    scene.add(solidMesh);
    terrainMeshRef.current = solidMesh;

    // Wireframe sobreposto (mesma geometria → atualiza junto automaticamente)
    const wireMat = new THREE.MeshBasicMaterial({ color: 0x334155, wireframe: true });
    const wireMesh = new THREE.Mesh(terrainGeo, wireMat);
    wireMesh.rotation.x = -Math.PI / 2;
    wireMesh.position.y = 0.008; // offset mínimo para evitar z-fighting
    scene.add(wireMesh);

    // Grid helper fino por cima (referência para posicionamento dos furos)
    const grid = new THREE.GridHelper(GRID_SIZE, GRID_SIZE, 0x1e293b, 0x1e293b);
    grid.position.y = 0.012;
    scene.add(grid);

    // Iluminação
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const sun = new THREE.DirectionalLight(0xffffff, 1.1);
    sun.position.set(12, 20, 8);
    scene.add(sun);

    // Grupo de furos
    const holeGroup = new THREE.Group();
    scene.add(holeGroup);
    holeGroupRef.current = holeGroup;

    // ── Loop de renderização ─────────────────────────────────────────────────
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    };
    animate();

    // ── Resize ───────────────────────────────────────────────────────────────
    const onResize = () => {
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
      labelRenderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    // ── Click para colocar furos ─────────────────────────────────────────────
    const onMouseDown = (e: MouseEvent) => {
      mouseDownRef.current = { x: e.clientX, y: e.clientY };
    };
    const onClick = (e: MouseEvent) => {
      const start = mouseDownRef.current;
      if (start && (Math.abs(e.clientX - start.x) > 4 || Math.abs(e.clientY - start.y) > 4)) return;

      const rect = renderer.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(ndc, camera);

      if (!terrainMeshRef.current) return;
      const hits = raycaster.intersectObject(terrainMeshRef.current);
      if (!hits.length) return;

      const { x, z } = hits[0].point;
      const cx = Math.max(-(GRID_SIZE / 2 - 0.1), Math.min(GRID_SIZE / 2 - 0.1, x));
      const cz = Math.max(-(GRID_SIZE / 2 - 0.1), Math.min(GRID_SIZE / 2 - 0.1, z));
      onClickRef.current(cx, cz);
    };
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('click', onClick);

    // ── Cleanup ──────────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafRef.current);
      blastTimeoutsRef.current.forEach(clearTimeout);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('click', onClick);
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      if (container.contains(labelRenderer.domElement)) container.removeChild(labelRenderer.domElement);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Atualiza terreno quando os nós mudam ──────────────────────────────────
  useEffect(() => {
    const geo = terrainGeoRef.current;
    if (!geo) return;

    const positions = geo.attributes.position as THREE.BufferAttribute;
    const colors    = geo.attributes.color    as THREE.BufferAttribute;
    const nodeCount = NODES * NODES;

    // Zera todas as elevações e cores
    const base = new THREE.Color(0x1e293b);
    for (let i = 0; i < nodeCount; i++) {
      positions.setZ(i, 0);
      colors.setXYZ(i, base.r, base.g, base.b);
    }

    const nodes = pattern?.terrainNodes ?? [];
    if (nodes.length > 0) {
      const elevations = nodes.map(n => n.elevation);
      const minE = Math.min(...elevations);
      const maxE = Math.max(...elevations);

      nodes.forEach((node: TerrainNode) => {
        // Mapeamento: índice do vértice = gridZ * NODES + gridX
        // (PlaneGeometry percorre linha por linha, esquerda → direita, topo → base)
        const idx = node.gridZ * NODES + node.gridX;
        if (idx < 0 || idx >= nodeCount) return;

        // Z local → Y mundo (após rotation.x = -π/2)
        positions.setZ(idx, node.elevation);

        const c = elevationToColor(node.elevation, minE, maxE);
        colors.setXYZ(idx, c.r, c.g, c.b);
      });
    }

    positions.needsUpdate = true;
    colors.needsUpdate = true;
    geo.computeVertexNormals(); // recalcula normais para iluminação correta
  }, [pattern?.terrainNodes]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Sincroniza furos quando o padrão muda ─────────────────────────────────
  useEffect(() => {
    const group = holeGroupRef.current;
    if (!group) return;

    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      child.traverse(obj => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          (obj.material as THREE.Material).dispose();
        }
      });
    }

    if (!pattern || pattern.drillHoles.length === 0) return;

    const seqs = pattern.drillHoles.map(h => h.sequence);
    const minSeq = Math.min(...seqs);
    const maxSeq = Math.max(...seqs);

    pattern.drillHoles.forEach(hole => {
      const color = sequenceColor(hole.sequence, minSeq, maxSeq);

      const geo = new THREE.CylinderGeometry(HOLE_RADIUS, HOLE_RADIUS, hole.depth, HOLE_SEGS);
      const mat = new THREE.MeshPhongMaterial({ color, shininess: 80 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData.originalColor = color.clone();

      const pivot = new THREE.Group();
      pivot.position.set(hole.x, -hole.depth / 2, hole.z);
      pivot.userData = { holeId: hole.id, sequence: hole.sequence };
      pivot.add(mesh);

      const div = document.createElement('div');
      div.textContent = String(hole.sequence);
      div.style.cssText = [
        'color:#f59e0b', 'font-family:"IBM Plex Mono",monospace',
        'font-size:11px', 'font-weight:600',
        'background:rgba(10,10,15,0.8)', 'padding:1px 5px',
        'border-radius:3px', 'border:1px solid rgba(245,158,11,0.35)',
        'white-space:nowrap', 'pointer-events:none', 'user-select:none',
      ].join(';');
      const label = new CSS2DObject(div);
      label.position.set(0, hole.depth / 2 + 0.7, 0);
      pivot.add(label);

      group.add(pivot);
    });
  }, [pattern]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Animação de detonação ─────────────────────────────────────────────────
  const simulateBlast = useCallback(() => {
    const group = holeGroupRef.current;
    if (!group || group.children.length === 0) return;

    blastTimeoutsRef.current.forEach(clearTimeout);
    blastTimeoutsRef.current = [];

    const pivots = [...group.children].sort(
      (a, b) => (a.userData.sequence as number) - (b.userData.sequence as number),
    );

    pivots.forEach((pivot, i) => {
      const mesh = pivot.children.find(c => c instanceof THREE.Mesh) as THREE.Mesh | undefined;
      if (!mesh) return;
      const mat = mesh.material as THREE.MeshPhongMaterial;
      const origColor = (mesh.userData.originalColor as THREE.Color).clone();

      const id = setTimeout(() => {
        mat.color.setHex(0xf97316);
        mat.emissive.setHex(0xfbbf24);
        mat.emissiveIntensity = 0.7;
        mesh.scale.set(2.2, 1, 2.2);

        const settle = setTimeout(() => {
          mat.color.copy(origColor);
          mat.emissive.setHex(0x000000);
          mat.emissiveIntensity = 0;
          mesh.scale.set(1, 1, 1);
        }, 300);
        blastTimeoutsRef.current.push(settle);
      }, i * 400);

      blastTimeoutsRef.current.push(id);
    });
  }, []);

  return { simulateBlast };
}
