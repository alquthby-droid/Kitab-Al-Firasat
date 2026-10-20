import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { 
  RotateCcw, 
  Play, 
  Pause, 
  Sparkles, 
  Maximize2, 
  Eye, 
  Compass, 
  Layers, 
  Info,
  Volume2
} from 'lucide-react';
import { sound } from '../services/sound';

export type OrganFeatureId = 'dahi' | 'alis' | 'mata' | 'hidung' | 'mulut' | 'telinga' | 'wajah' | 'suara';

interface Face3DViewerProps {
  activeOrganId: string;
  onSelectOrgan?: (organId: OrganFeatureId) => void;
  className?: string;
}

interface HotspotDefinition {
  id: OrganFeatureId;
  name: string;
  arabicName: string;
  position: THREE.Vector3;
  cameraPos: THREE.Vector3;
  lookAt: THREE.Vector3;
  description: string;
}

const HOTSPOTS: HotspotDefinition[] = [
  {
    id: 'dahi',
    name: 'Dahi (Al-Jabhah)',
    arabicName: 'الجبهة',
    position: new THREE.Vector3(0, 1.15, 0.95),
    cameraPos: new THREE.Vector3(0, 1.25, 2.7),
    lookAt: new THREE.Vector3(0, 1.1, 0.4),
    description: 'Pusat akal budi, abstraksi pemikiran, dan daya tampung memori depan.'
  },
  {
    id: 'alis',
    name: 'Alis (Al-Hâjib)',
    arabicName: 'الحاجب',
    position: new THREE.Vector3(0, 0.72, 1.05),
    cameraPos: new THREE.Vector3(0, 0.8, 2.5),
    lookAt: new THREE.Vector3(0, 0.65, 0.5),
    description: 'Kerapatan bulu mencerminkan kestabilan rasa dan pengendalian duka.'
  },
  {
    id: 'mata',
    name: 'Mata (Al-\'Ain)',
    arabicName: 'العين',
    position: new THREE.Vector3(0, 0.45, 1.02),
    cameraPos: new THREE.Vector3(0, 0.48, 2.3),
    lookAt: new THREE.Vector3(0, 0.4, 0.4),
    description: 'Jendela ruhani, sorot syahlah menandakan keluhuran dan keberanian.'
  },
  {
    id: 'hidung',
    name: 'Hidung (Al-Anf)',
    arabicName: 'الأنف',
    position: new THREE.Vector3(0, 0.05, 1.25),
    cameraPos: new THREE.Vector3(0.7, 0.15, 2.4),
    lookAt: new THREE.Vector3(0, 0.05, 0.5),
    description: 'Kelengkungan elang mencerminkan jiwa mulia, lubang napas lapang menandakan keberanian.'
  },
  {
    id: 'mulut',
    name: 'Bibir & Mulut (Al-Fam)',
    arabicName: 'الفم والشفة',
    position: new THREE.Vector3(0, -0.45, 1.08),
    cameraPos: new THREE.Vector3(0, -0.4, 2.3),
    lookAt: new THREE.Vector3(0, -0.45, 0.4),
    description: 'Bibir tipis rapi menandakan kehalusan budi dan tutur kata bermartabat.'
  },
  {
    id: 'telinga',
    name: 'Telinga (Al-Udzun)',
    arabicName: 'الأذن',
    position: new THREE.Vector3(1.3, 0.25, -0.1),
    cameraPos: new THREE.Vector3(2.8, 0.35, 1.2),
    lookAt: new THREE.Vector3(1.0, 0.2, -0.1),
    description: 'Keluasan daun telinga menandakan daya ingat kuat dan kapasitas otak luas.'
  },
  {
    id: 'wajah',
    name: 'Garis Wajah (Al-Wajh)',
    arabicName: 'الوجه',
    position: new THREE.Vector3(0, 0.15, 0.6),
    cameraPos: new THREE.Vector3(0, 0.2, 3.4),
    lookAt: new THREE.Vector3(0, 0.1, 0),
    description: 'Keseimbangan bentuk hasan al-wajh mencerminkan harmoni 4 cairan tubuh.'
  },
  {
    id: 'suara',
    name: 'Leher & Suara (Al-\'Unuq)',
    arabicName: 'العنق والصوت',
    position: new THREE.Vector3(0, -1.1, 0.3),
    cameraPos: new THREE.Vector3(0, -0.9, 2.7),
    lookAt: new THREE.Vector3(0, -1.0, 0),
    description: 'Ketegapan leher menghubungkan otak dan rongga dada pembawa keberanian.'
  }
];

export const Face3DViewer: React.FC<Face3DViewerProps> = ({
  activeOrganId,
  onSelectOrgan,
  className = ''
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(false);
  const [isWireframe, setIsWireframe] = useState<boolean>(false);
  const [hotspotScreenPositions, setHotspotScreenPositions] = useState<Record<string, { x: number; y: number; visible: boolean }>>({});

  // Three.js internal references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const headGroupRef = useRef<THREE.Group | null>(null);
  const organMeshesRef = useRef<Record<string, THREE.Mesh[]>>({});
  const pulseRingRef = useRef<THREE.Mesh | null>(null);

  // Target camera state for smooth lerp
  const targetCameraPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.2, 3.4));
  const targetLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.1, 0));
  const currentLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.1, 0));

  // Pointer interaction state
  const isDragging = useRef<boolean>(false);
  const previousMousePosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const animationFrameId = useRef<number | null>(null);

  // Current active hotspot definition
  const currentHotspot = HOTSPOTS.find(h => h.id === activeOrganId) || HOTSPOTS[0];

  // Initialize Three.js Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 450;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.2, 3.4);
    cameraRef.current = camera;

    // 3. Renderer with antialiasing and tone mapping
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting Rig (Warm Classical Bronze & Gold Studio)
    const ambientLight = new THREE.AmbientLight(0xfff4e6, 0.85);
    scene.add(ambientLight);

    const mainKeyLight = new THREE.DirectionalLight(0xfef08a, 1.8);
    mainKeyLight.position.set(3, 4, 4);
    scene.add(mainKeyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.6);
    fillLight.position.set(-4, -1, 2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xf59e0b, 1.4);
    rimLight.position.set(0, 3, -4);
    scene.add(rimLight);

    // 5. Materials
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x221f1d,
      roughness: 0.45,
      metalness: 0.35,
      wireframe: false
    });

    const goldAccentMaterial = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      emissive: 0x78350f,
      roughness: 0.3,
      metalness: 0.8
    });

    // 6. Build Stylized Classical Head & Anatomical Organs
    const headGroup = new THREE.Group();
    scene.add(headGroup);
    headGroupRef.current = headGroup;

    const organMap: Record<string, THREE.Mesh[]> = {
      dahi: [],
      alis: [],
      mata: [],
      hidung: [],
      mulut: [],
      telinga: [],
      wajah: [],
      suara: []
    };

    // --- Cranium / Main Head Base (Al-Wajh) ---
    const craniumGeo = new THREE.SphereGeometry(1.2, 48, 36);
    craniumGeo.scale(0.92, 1.18, 1.05);
    const craniumMesh = new THREE.Mesh(craniumGeo, baseMaterial.clone());
    craniumMesh.position.set(0, 0.25, -0.05);
    headGroup.add(craniumMesh);
    organMap.wajah.push(craniumMesh);

    // --- Forehead Plate (Al-Jabhah) ---
    const foreheadGeo = new THREE.CylinderGeometry(0.85, 0.92, 0.55, 32, 4, true, -Math.PI / 3, (Math.PI * 2) / 3);
    const foreheadMat = baseMaterial.clone();
    const foreheadMesh = new THREE.Mesh(foreheadGeo, foreheadMat);
    foreheadMesh.position.set(0, 1.05, 0.4);
    foreheadMesh.rotation.y = Math.PI / 2;
    headGroup.add(foreheadMesh);
    organMap.dahi.push(foreheadMesh);

    // Forehead classical analysis accent arc
    const dahiRingGeo = new THREE.TorusGeometry(0.75, 0.02, 16, 64, Math.PI * 0.7);
    const dahiRingMesh = new THREE.Mesh(dahiRingGeo, goldAccentMaterial.clone());
    dahiRingMesh.position.set(0, 1.15, 0.88);
    dahiRingMesh.rotation.x = 0.2;
    dahiRingMesh.rotation.z = -Math.PI * 0.35;
    headGroup.add(dahiRingMesh);
    organMap.dahi.push(dahiRingMesh);

    // --- Eyebrows (Al-Hâjib) ---
    const createEyebrow = (isRight: boolean) => {
      const curve = new THREE.CubicBezierCurve3(
        new THREE.Vector3(0.08, 0.72, 0.98),
        new THREE.Vector3(0.3, 0.82, 0.95),
        new THREE.Vector3(0.65, 0.76, 0.82),
        new THREE.Vector3(0.85, 0.65, 0.65)
      );
      const tubeGeo = new THREE.TubeGeometry(curve, 24, 0.045, 12, false);
      const browMesh = new THREE.Mesh(tubeGeo, goldAccentMaterial.clone());
      if (isRight) {
        browMesh.scale.x = -1;
      }
      return browMesh;
    };
    const leftBrow = createEyebrow(false);
    const rightBrow = createEyebrow(true);
    headGroup.add(leftBrow, rightBrow);
    organMap.alis.push(leftBrow, rightBrow);

    // --- Eyes (Al-'Ain) ---
    const createEye = (isRight: boolean) => {
      const eyeGroup = new THREE.Group();
      const eyeSocket = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 24, 24),
        new THREE.MeshStandardMaterial({ color: 0xfafaf9, roughness: 0.1, metalness: 0.1 })
      );
      const pupil = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.1, metalness: 0.5 }) // Syahlah honey-amber pupil
      );
      pupil.position.set(0, 0, 0.12);
      eyeSocket.add(pupil);

      // Orbital eye rim
      const rimGeo = new THREE.TorusGeometry(0.22, 0.025, 12, 32);
      const rim = new THREE.Mesh(rimGeo, goldAccentMaterial.clone());
      eyeGroup.add(eyeSocket, rim);

      const sideSign = isRight ? -1 : 1;
      eyeGroup.position.set(0.42 * sideSign, 0.48, 0.95);
      eyeGroup.rotation.y = 0.15 * sideSign;
      return eyeGroup;
    };
    const leftEye = createEye(false);
    const rightEye = createEye(true);
    headGroup.add(leftEye, rightEye);
    organMap.mata.push(leftEye.children[0] as THREE.Mesh, rightEye.children[0] as THREE.Mesh);

    // --- Nose (Al-Anf) ---
    // Classical Aquiline sculpted nose
    const noseCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.52, 0.98), // Root
      new THREE.Vector3(0, 0.35, 1.12), // High bridge
      new THREE.Vector3(0, 0.12, 1.28), // Aquiline arch
      new THREE.Vector3(0, -0.05, 1.34), // Tip
      new THREE.Vector3(0, -0.15, 1.16)  // Base
    ]);
    const noseGeo = new THREE.TubeGeometry(noseCurve, 32, 0.09, 16, false);
    const noseMesh = new THREE.Mesh(noseGeo, baseMaterial.clone());
    headGroup.add(noseMesh);
    organMap.hidung.push(noseMesh);

    // Left and right nostrils (wings)
    const nostrilGeo = new THREE.SphereGeometry(0.085, 16, 16);
    nostrilGeo.scale(1.2, 0.7, 0.9);
    const leftNostril = new THREE.Mesh(nostrilGeo, baseMaterial.clone());
    leftNostril.position.set(0.18, -0.08, 1.18);
    const rightNostril = new THREE.Mesh(nostrilGeo, baseMaterial.clone());
    rightNostril.position.set(-0.18, -0.08, 1.18);
    headGroup.add(leftNostril, rightNostril);
    organMap.hidung.push(leftNostril, rightNostril);

    // --- Lips & Mouth (Al-Fam wa ash-Syafah) ---
    const upperLipCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(-0.35, -0.38, 0.95),
      new THREE.Vector3(0, -0.34, 1.12),
      new THREE.Vector3(0, -0.34, 1.12),
      new THREE.Vector3(0.35, -0.38, 0.95)
    );
    const upperLipGeo = new THREE.TubeGeometry(upperLipCurve, 24, 0.045, 12, false);
    const upperLipMesh = new THREE.Mesh(upperLipGeo, goldAccentMaterial.clone());

    const lowerLipCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(-0.3, -0.42, 0.93),
      new THREE.Vector3(0, -0.48, 1.1),
      new THREE.Vector3(0, -0.48, 1.1),
      new THREE.Vector3(0.3, -0.42, 0.93)
    );
    const lowerLipGeo = new THREE.TubeGeometry(lowerLipCurve, 24, 0.055, 12, false);
    const lowerLipMesh = new THREE.Mesh(lowerLipGeo, goldAccentMaterial.clone());
    headGroup.add(upperLipMesh, lowerLipMesh);
    organMap.mulut.push(upperLipMesh, lowerLipMesh);

    // --- EARS (Al-Udzun) - Left & Right Classical Auricles ---
    const createEar = (isRight: boolean) => {
      const earGroup = new THREE.Group();
      
      // Outer rim helix (Torus arc)
      const helixCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0.45, 0.1),
        new THREE.Vector3(0.2, 0.35, 0),
        new THREE.Vector3(0.24, 0.05, -0.05),
        new THREE.Vector3(0.18, -0.25, -0.05),
        new THREE.Vector3(0.05, -0.42, 0.05) // Lobe
      ]);
      const helixGeo = new THREE.TubeGeometry(helixCurve, 32, 0.055, 16, false);
      const helixMesh = new THREE.Mesh(helixGeo, goldAccentMaterial.clone());

      // Inner concha / lobe mass
      const conchaGeo = new THREE.CylinderGeometry(0.12, 0.18, 0.45, 16);
      conchaGeo.scale(0.4, 1, 0.8);
      const conchaMesh = new THREE.Mesh(conchaGeo, baseMaterial.clone());
      conchaMesh.position.set(0.06, -0.05, 0);

      // Floating holographic ear analysis ring
      const earRingGeo = new THREE.TorusGeometry(0.32, 0.015, 8, 32);
      const earRingMesh = new THREE.Mesh(earRingGeo, new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true }));
      earRingMesh.position.set(0.1, 0, 0);
      earRingMesh.rotation.y = Math.PI / 2;

      earGroup.add(helixMesh, conchaMesh, earRingMesh);

      const sign = isRight ? -1 : 1;
      earGroup.position.set(1.18 * sign, 0.28, -0.15);
      earGroup.rotation.y = 0.25 * sign;
      earGroup.rotation.z = -0.1 * sign;
      if (isRight) {
        earGroup.scale.x = -1;
      }
      return earGroup;
    };
    const leftEar = createEar(false);
    const rightEar = createEar(true);
    headGroup.add(leftEar, rightEar);
    organMap.telinga.push(
      leftEar.children[0] as THREE.Mesh,
      leftEar.children[1] as THREE.Mesh,
      rightEar.children[0] as THREE.Mesh,
      rightEar.children[1] as THREE.Mesh
    );

    // --- Neck & Vocal Column (Al-'Unuq wa ash-Shawt) ---
    const neckGeo = new THREE.CylinderGeometry(0.55, 0.72, 1.1, 32);
    const neckMesh = new THREE.Mesh(neckGeo, baseMaterial.clone());
    neckMesh.position.set(0, -1.05, -0.1);
    headGroup.add(neckMesh);
    organMap.suara.push(neckMesh);

    // Voice resonator pulse ring at Adam's apple
    const voiceRingGeo = new THREE.TorusGeometry(0.58, 0.02, 16, 48);
    const voiceRingMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      roughness: 0.2,
      metalness: 0.8
    });
    const voiceRing = new THREE.Mesh(voiceRingGeo, voiceRingMat);
    voiceRing.position.set(0, -0.92, -0.05);
    voiceRing.rotation.x = Math.PI / 2;
    headGroup.add(voiceRing);
    organMap.suara.push(voiceRing);

    // Dynamic Pulsing Target Halo
    const haloGeo = new THREE.RingGeometry(0.25, 0.35, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.visible = false;
    scene.add(haloMesh);
    pulseRingRef.current = haloMesh;

    organMeshesRef.current = organMap;

    // 7. Mouse/Touch Drag for Orbiting
    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !headGroupRef.current) return;
      const deltaX = e.clientX - previousMousePosition.current.x;
      const deltaY = e.clientY - previousMousePosition.current.y;

      headGroupRef.current.rotation.y += deltaX * 0.008;
      headGroupRef.current.rotation.x += deltaY * 0.008;

      // Clamp vertical tilt
      headGroupRef.current.rotation.x = Math.max(-0.6, Math.min(0.6, headGroupRef.current.rotation.x));

      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging.current = true;
        previousMousePosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current || !headGroupRef.current || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - previousMousePosition.current.x;
      const deltaY = e.touches[0].clientY - previousMousePosition.current.y;

      headGroupRef.current.rotation.y += deltaX * 0.009;
      headGroupRef.current.rotation.x += deltaY * 0.009;
      headGroupRef.current.rotation.x = Math.max(-0.6, Math.min(0.6, headGroupRef.current.rotation.x));

      previousMousePosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const handleTouchEnd = () => {
      isDragging.current = false;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    domElement.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    // 8. Animation & Render Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Slow turntable auto-rotation if enabled and not currently dragging
      if (isAutoRotating && !isDragging.current && headGroupRef.current) {
        headGroupRef.current.rotation.y += 0.004;
      }

      // Smooth camera interpolation towards target
      if (cameraRef.current) {
        cameraRef.current.position.lerp(targetCameraPos.current, 0.07);
        currentLookAt.current.lerp(targetLookAt.current, 0.07);
        cameraRef.current.lookAt(currentLookAt.current);

        // Project 3D Hotspot positions to 2D UI screen overlay
        const newScreenPos: Record<string, { x: number; y: number; visible: boolean }> = {};
        const headRotMatrix = headGroupRef.current ? headGroupRef.current.matrixWorld : new THREE.Matrix4();

        HOTSPOTS.forEach(spot => {
          const worldPos = spot.position.clone().applyMatrix4(headRotMatrix);
          const projected = worldPos.clone().project(cameraRef.current!);

          // Check if in front of camera
          const isVisible = projected.z < 1.0;
          const screenX = ((projected.x + 1) * width) / 2;
          const screenY = ((-projected.y + 1) * height) / 2;

          newScreenPos[spot.id] = {
            x: screenX,
            y: screenY,
            visible: isVisible && screenX >= 0 && screenX <= width && screenY >= 0 && screenY <= height
          };
        });
        setHotspotScreenPositions(newScreenPos);
      }

      // Pulse ring animation
      if (pulseRingRef.current && pulseRingRef.current.visible) {
        const scalePulse = 1.0 + Math.sin(elapsedTime * 6) * 0.15;
        pulseRingRef.current.scale.set(scalePulse, scalePulse, scalePulse);
      }

      // Render frame
      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const newW = container.clientWidth || 400;
      const newH = container.clientHeight || 450;
      cameraRef.current.aspect = newW / newH;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      domElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      domElement.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Update target camera and visual highlights when activeOrganId changes
  useEffect(() => {
    const spot = HOTSPOTS.find(h => h.id === activeOrganId);
    if (spot) {
      targetCameraPos.current.copy(spot.cameraPos);
      targetLookAt.current.copy(spot.lookAt);

      // If viewing the ear (telinga), rotate head slightly to present the lateral ear profile
      if (headGroupRef.current) {
        if (activeOrganId === 'telinga') {
          headGroupRef.current.rotation.y = -0.45;
          headGroupRef.current.rotation.x = 0;
        } else if (activeOrganId === 'wajah') {
          headGroupRef.current.rotation.y = 0;
          headGroupRef.current.rotation.x = 0;
        }
      }
    }

    // Update material glow highlights for the active organ
    const organMap = organMeshesRef.current;
    if (!organMap) return;

    Object.keys(organMap).forEach(key => {
      const meshes = organMap[key];
      const isCurrentActive = key === activeOrganId;

      meshes.forEach(mesh => {
        if (mesh.material && 'emissive' in mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          if (isCurrentActive) {
            mat.emissive.setHex(key === 'telinga' ? 0x06b6d4 : 0xf59e0b); // Cyan for ear, golden amber for others
            mat.emissiveIntensity = 0.9;
          } else {
            mat.emissive.setHex(0x181512);
            mat.emissiveIntensity = 0.15;
          }
        }
      });
    });

    // Update pulse ring marker position
    if (pulseRingRef.current && spot) {
      pulseRingRef.current.visible = true;
      pulseRingRef.current.position.copy(spot.position);
      pulseRingRef.current.lookAt(targetCameraPos.current);
    }
  }, [activeOrganId]);

  // Toggle wireframe mode
  useEffect(() => {
    const organMap = organMeshesRef.current;
    if (!organMap) return;

    Object.keys(organMap).forEach(key => {
      organMap[key].forEach(mesh => {
        if (mesh.material && 'wireframe' in mesh.material) {
          (mesh.material as THREE.MeshStandardMaterial).wireframe = isWireframe;
        }
      });
    });
  }, [isWireframe]);

  // Reset Camera View
  const handleResetCamera = useCallback(() => {
    sound.playClick();
    targetCameraPos.current.set(0, 0.2, 3.4);
    targetLookAt.current.set(0, 0.1, 0);
    if (headGroupRef.current) {
      headGroupRef.current.rotation.set(0, 0, 0);
    }
  }, []);

  return (
    <div className={`relative rounded-2xl bg-gradient-to-b from-stone-950 via-stone-900 to-black border border-amber-900/40 overflow-hidden shadow-2xl flex flex-col ${className}`}>
      
      {/* Top Header Bar */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-3.5 bg-gradient-to-b from-stone-950/90 via-stone-950/60 to-transparent pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Model Wajah 3D Interaktif
              </span>
              <span className="text-[10px] text-stone-400 font-mono">Three.js</span>
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-stone-100 font-title">
              Visualisasi Fisiognomi Anatomis
            </h3>
          </div>
        </div>

        {/* 3D Viewport Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Wireframe toggle */}
          <button
            onClick={() => {
              sound.playClick();
              setIsWireframe(!isWireframe);
            }}
            title={isWireframe ? 'Mode Solid' : 'Mode Rangka Kawat (Wireframe)'}
            className={`p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isWireframe
                ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md'
                : 'bg-stone-900/80 hover:bg-stone-800 text-stone-300 border-stone-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          {/* Auto rotate turntable toggle */}
          <button
            onClick={() => {
              sound.playClick();
              setIsAutoRotating(!isAutoRotating);
            }}
            title={isAutoRotating ? 'Jeda Putaran' : 'Putar 360 Derajat Otomatis'}
            className={`p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isAutoRotating
                ? 'bg-cyan-500 text-stone-950 border-cyan-400 shadow-md'
                : 'bg-stone-900/80 hover:bg-stone-800 text-stone-300 border-stone-800'
            }`}
          >
            {isAutoRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          {/* Reset Camera button */}
          <button
            onClick={handleResetCamera}
            title="Reset Sudut Kamera"
            className="p-2 rounded-xl bg-stone-900/80 hover:bg-stone-800 text-stone-300 border border-stone-800 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Container */}
      <div 
        ref={mountRef} 
        className="w-full h-[360px] sm:h-[420px] md:h-[460px] cursor-grab active:cursor-grabbing relative"
      />

      {/* Interactive 2D Screen Hotspot Pins Overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {HOTSPOTS.map(spot => {
          const pos = hotspotScreenPositions[spot.id];
          if (!pos || !pos.visible) return null;

          const isActive = spot.id === activeOrganId;

          return (
            <div
              key={spot.id}
              style={{
                transform: `translate(${pos.x}px, ${pos.y}px)`,
                left: -14,
                top: -14
              }}
              className="absolute pointer-events-auto transition-transform duration-75"
            >
              <button
                onClick={() => {
                  sound.playClick();
                  if (onSelectOrgan) onSelectOrgan(spot.id);
                }}
                title={`Klik untuk menganalisis organ ${spot.name}`}
                className={`group flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold border transition-all shadow-lg cursor-pointer transform hover:scale-110 ${
                  isActive
                    ? 'bg-amber-400 text-stone-950 border-amber-300 shadow-amber-400/40 ring-4 ring-amber-400/20'
                    : 'bg-stone-900/90 hover:bg-stone-800 text-stone-200 border-stone-700 hover:border-amber-400/60'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-stone-950 animate-ping' : 'bg-amber-400'}`} />
                <span className="truncate max-w-[80px] sm:max-w-[120px]">{spot.name.split(' (')[0]}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Bottom Floating Active Organ Summary Card */}
      <div className="absolute bottom-3 inset-x-3 z-20 p-3 sm:p-3.5 rounded-2xl bg-stone-950/85 backdrop-blur-md border border-amber-500/30 shadow-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Organ Terpilih:</span>
              </span>
              <span className="font-arabic text-amber-300 text-sm">{currentHotspot.arabicName}</span>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-stone-100 truncate">
              {currentHotspot.name}
            </h4>
            <p className="text-[11px] text-stone-300 line-clamp-1 mt-0.5">
              {currentHotspot.description}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-1.5">
            <span className="text-[10px] text-stone-400 hidden sm:inline-block">
              Geser untuk memutar sudut pandang 3D
            </span>
            <button
              onClick={() => {
                sound.playClick();
                if (onSelectOrgan) onSelectOrgan(currentHotspot.id);
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Fokus</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
