/**
 * useStrataScene
 *
 * Owns the entire Three.js lifecycle: scene, camera, renderer, controls, and
 * all drill-hole meshes.  The hook re-syncs the scene whenever `pattern`
 * changes and exposes a `simulateBlast` function for the animation.
 */
import { useEffect, useRef, useCallback, RefObject } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Pattern } from '../types';

// ─── Constants ────────────────────────────────────────────────────────────────
const GRID_SIZE = 20;
const SCENE_BG = 0x0a0a0f;
const GRID_COLOR = 0x1e293b;
const HOLE_RADIUS = 0.13;
const HOLE_SEGMENTS = 10;

/** Lerp between blue (first in sequence) and red (last) based on position. */
function sequenceColor(seq: number, min: number, max: number): THREE.Color {
  const t = max === min ? 0 : (seq - min) / (max - min);
  return new THREE.Color().lerpColors(
    new THREE.Color(0x3b82f6), // blue  — earliest holes
    new THREE.Color(0xef4444), // red   — latest holes
    t,
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useStrataScene(
  containerRef: RefObject<HTMLDivElement | null>,
  pattern: Pattern | null,
  onTerrainClick: (x: number, z: number) => void,
): { simulateBlast: () => void } {
  // Core Three.js objects persisted across renders via refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const labelRendererRef = useRef<CSS2DRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const terrainRef = useRef<THREE.Mesh | null>(null);
  /** Top-level group containing one child Group per drill hole */
  const holeGroupRef = useRef<THREE.Group | null>(null);
  const rafRef = useRef<number>(0);
  /** Pending blast animation timeouts — cleared when a new blast fires */
  const blastTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  /** Mouse-down position so we can distinguish a click from an orbit drag */
  const mouseDownRef = useRef<{ x: number; y: number } | null>(null);
  /**
   * Keep the latest callback in a ref so the stable click listener always
   * calls the current closure without needing to re-register.
   */
  const onTerrainClickRef = useRef(onTerrainClick);
  useEffect(() => {
    onTerrainClickRef.current = onTerrainClick;
  }, [onTerrainClick]);

  // ─── One-time scene initialisation ─────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(SCENE_BG);
    // Subtle exponential fog sells the "underground" atmosphere
    scene.fog = new THREE.FogExp2(SCENE_BG, 0.018);
    sceneRef.current = scene;

    // Camera — elevated and angled so the grid reads like a top-down plan view
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

    // CSS2D label renderer — overlays HTML labels in 3D-projected positions.
    // It must sit directly on top of the WebGL canvas (position:absolute).
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(w, h);
    labelRenderer.domElement.style.cssText =
      'position:absolute;top:0;left:0;pointer-events:none;overflow:hidden;';
    container.appendChild(labelRenderer.domElement);
    labelRendererRef.current = labelRenderer;

    // OrbitControls — left-drag to orbit, right-drag to pan, scroll to zoom
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.minDistance = 4;
    controls.maxDistance = 60;
    // Prevent the camera from going below the terrain plane
    controls.maxPolarAngle = Math.PI / 2.05;
    controlsRef.current = controls;

    // Grid lines — purely visual reference for the 20 × 20 unit terrain
    const grid = new THREE.GridHelper(GRID_SIZE, GRID_SIZE, GRID_COLOR, GRID_COLOR);
    scene.add(grid);

    // Invisible terrain plane used only for raycasting (picking where user clicked).
    // opacity:0 with transparent:true keeps material.visible === true so Three.js
    // still ray-tests against it, but it draws no pixels.
    const terrainGeo = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE);
    const terrainMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.rotation.x = -Math.PI / 2; // lay flat in the XZ plane
    terrain.name = 'terrain';
    scene.add(terrain);
    terrainRef.current = terrain;

    // Lighting — ambient fills shadows, directional gives the cylinders shape
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const sun = new THREE.DirectionalLight(0xffffff, 1.1);
    sun.position.set(12, 20, 8);
    scene.add(sun);

    // Parent group for all drill-hole objects; cleared on pattern change
    const holeGroup = new THREE.Group();
    scene.add(holeGroup);
    holeGroupRef.current = holeGroup;

    // ─── Render loop ──────────────────────────────────────────────────────────
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      controls.update(); // must be called each frame when damping is enabled
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    };
    animate();

    // ─── Resize handler ───────────────────────────────────────────────────────
    const onResize = () => {
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
      labelRenderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    // ─── Click / placement handler ────────────────────────────────────────────
    const onMouseDown = (e: MouseEvent) => {
      mouseDownRef.current = { x: e.clientX, y: e.clientY };
    };

    const onClick = (e: MouseEvent) => {
      // If the mouse moved more than 4 px between down and up it was a drag
      const start = mouseDownRef.current;
      if (
        start &&
        (Math.abs(e.clientX - start.x) > 4 || Math.abs(e.clientY - start.y) > 4)
      )
        return;

      const rect = renderer.domElement.getBoundingClientRect();
      // Normalised device coordinates: (-1,-1) bottom-left → (+1,+1) top-right
      const ndc = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(ndc, camera);

      if (!terrainRef.current) return;
      const hits = raycaster.intersectObject(terrainRef.current);
      if (hits.length === 0) return;

      const { x, z } = hits[0].point;
      // Clamp within the grid boundary with a small margin
      const cx = Math.max(-(GRID_SIZE / 2 - 0.1), Math.min(GRID_SIZE / 2 - 0.1, x));
      const cz = Math.max(-(GRID_SIZE / 2 - 0.1), Math.min(GRID_SIZE / 2 - 0.1, z));
      onTerrainClickRef.current(cx, cz);
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('click', onClick);

    // ─── Cleanup on unmount ───────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafRef.current);
      blastTimeoutsRef.current.forEach(clearTimeout);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('click', onClick);
      renderer.dispose();
      if (container.contains(renderer.domElement))
        container.removeChild(renderer.domElement);
      if (container.contains(labelRenderer.domElement))
        container.removeChild(labelRenderer.domElement);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Sync drill holes whenever the active pattern (or its holes) changes ───
  useEffect(() => {
    const group = holeGroupRef.current;
    if (!group) return;

    // Remove all previous hole objects and release their GPU memory
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      child.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          (obj.material as THREE.Material).dispose();
        }
      });
    }

    if (!pattern || pattern.drillHoles.length === 0) return;

    const seqs = pattern.drillHoles.map((h) => h.sequence);
    const minSeq = Math.min(...seqs);
    const maxSeq = Math.max(...seqs);

    pattern.drillHoles.forEach((hole) => {
      const color = sequenceColor(hole.sequence, minSeq, maxSeq);

      // Cylinder representing a drill hole — top sits flush with the terrain (y=0)
      const geo = new THREE.CylinderGeometry(
        HOLE_RADIUS,
        HOLE_RADIUS,
        hole.depth,
        HOLE_SEGMENTS,
      );
      const mat = new THREE.MeshPhongMaterial({ color, shininess: 80 });
      const mesh = new THREE.Mesh(geo, mat);
      // Store original color so the blast animation can restore it
      mesh.userData.originalColor = color.clone();

      // Pivot group at the hole's X/Z position on the terrain surface.
      // Offsetting by -depth/2 on Y centres the cylinder so its top is at y=0.
      const pivot = new THREE.Group();
      pivot.position.set(hole.x, -hole.depth / 2, hole.z);
      pivot.userData = { holeId: hole.id, sequence: hole.sequence };
      pivot.add(mesh);

      // CSS2D label — rendered as a DOM element projected into 3D space.
      // Stays crisp regardless of zoom level because it's pure HTML.
      const div = document.createElement('div');
      div.textContent = String(hole.sequence);
      div.style.cssText = [
        'color:#f59e0b',
        'font-family:"IBM Plex Mono",monospace',
        'font-size:11px',
        'font-weight:600',
        'background:rgba(10,10,15,0.8)',
        'padding:1px 5px',
        'border-radius:3px',
        'border:1px solid rgba(245,158,11,0.35)',
        'white-space:nowrap',
        'pointer-events:none',
        'user-select:none',
      ].join(';');
      const label = new CSS2DObject(div);
      // Position the label above the top of the cylinder in the pivot's local space.
      // pivot.y = -depth/2, so local y = depth/2 + margin puts us 0.7 units above terrain.
      label.position.set(0, hole.depth / 2 + 0.7, 0);
      pivot.add(label);

      group.add(pivot);
    });
  }, [pattern]);

  // ─── Blast sequence animation ───────────────────────────────────────────────
  const simulateBlast = useCallback(() => {
    const group = holeGroupRef.current;
    if (!group || group.children.length === 0) return;

    // Cancel any in-progress blast before starting a new one
    blastTimeoutsRef.current.forEach(clearTimeout);
    blastTimeoutsRef.current = [];

    // Animate holes in ascending sequence order
    const pivots = [...group.children].sort(
      (a, b) => (a.userData.sequence as number) - (b.userData.sequence as number),
    );

    pivots.forEach((pivot, i) => {
      const mesh = pivot.children.find((c) => c instanceof THREE.Mesh) as
        | THREE.Mesh
        | undefined;
      if (!mesh) return;
      const mat = mesh.material as THREE.MeshPhongMaterial;
      const origColor = (mesh.userData.originalColor as THREE.Color).clone();

      // Stagger each hole by 400 ms
      const flashId = setTimeout(() => {
        // Phase 1 — radial shockwave + orange flash
        mat.color.setHex(0xf97316);
        mat.emissive.setHex(0xfbbf24);
        mat.emissiveIntensity = 0.7;
        mesh.scale.set(2.2, 1, 2.2); // scale outward like a pressure ring

        // Phase 2 — settle back to original colour after 300 ms
        const settleId = setTimeout(() => {
          mat.color.copy(origColor);
          mat.emissive.setHex(0x000000);
          mat.emissiveIntensity = 0;
          mesh.scale.set(1, 1, 1);
        }, 300);

        blastTimeoutsRef.current.push(settleId);
      }, i * 400);

      blastTimeoutsRef.current.push(flashId);
    });
  }, []);

  return { simulateBlast };
}
