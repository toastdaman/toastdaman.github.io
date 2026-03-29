import React, { useEffect, useRef, useState, useCallback } from 'react';
import LoadingScreen from './LoadingScreen';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const [showLoading, setShowLoading] = useState(true);

  const handleLoadingComplete = useCallback(() => {
    setShowLoading(false);
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    // ==========================================
    // SCENE SETUP
    // ==========================================
    const scene = new THREE.Scene();
    scene.background = null; // Transparent to show CSS background
    scene.fog = new THREE.FogExp2('#050510', 0.02); // Blend into space background

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 6);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // Transparent clear color
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // ==========================================
    // LIGHTING (Space lighting)
    // ==========================================
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight('#FFF4E0', 2.5);
    sunLight.position.set(4, 6, 3);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 15;
    sunLight.shadow.camera.left = -5;
    sunLight.shadow.camera.right = 5;
    sunLight.shadow.camera.top = 5;
    sunLight.shadow.camera.bottom = -5;
    sunLight.shadow.bias = -0.001;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight('#4A5A80', 1.2); // Cooler fill light
    fillLight.position.set(-4, 2, -4);
    scene.add(fillLight);

    // ==========================================
    // STARFIELD
    // ==========================================
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 3000;
    const posArray = new Float32Array(starsCount * 3);
    for(let i = 0; i < starsCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 100;
    }
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const starsMaterial = new THREE.PointsMaterial({
      size: 0.05,
      color: '#ffffff',
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true
    });
    const starMesh = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starMesh);

    // ==========================================
    // PROCEDURAL TEXTURES
    // ==========================================
    const generateBreadTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      
      // Base gradient (toasted edges)
      const gradient = ctx.createRadialGradient(512, 512, 100, 512, 512, 600);
      gradient.addColorStop(0, '#E5B874'); // Golden inner bread
      gradient.addColorStop(0.4, '#C2853D'); // Darker mid
      gradient.addColorStop(0.7, '#8B4513'); // Burnt brown edge
      gradient.addColorStop(1, '#4A2311'); // Very dark burnt edge
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1024, 1024);
      
      // Draw pores
      const drawPores = (count: number, minRadius: number, maxRadius: number, color: string, opacity: number) => {
        ctx.fillStyle = color;
        ctx.globalAlpha = opacity;
        for (let i = 0; i < count; i++) {
          const x = Math.random() * 1024;
          const y = Math.random() * 1024;
          const r = minRadius + Math.random() * (maxRadius - minRadius);
          ctx.beginPath();
          ctx.ellipse(x, y, r, r * (0.7 + Math.random() * 0.6), Math.random() * Math.PI, 0, Math.PI * 2);
          ctx.fill();
        }
      };

      // Layered pores for organic spongy look
      drawPores(1500, 4, 14, '#C2853D', 0.5); // Large soft pores
      drawPores(6000, 2, 7, '#8B4513', 0.6);  // Medium dark pores
      drawPores(20000, 0.5, 2.5, '#5C2E0B', 0.7); // Tiny dark specks
      drawPores(5000, 1, 3, '#E5B874', 0.3); // Tiny light highlights
      
      // Add some burnt spots
      drawPores(150, 10, 35, '#3A1808', 0.4); // Large burnt patches
      drawPores(400, 5, 15, '#2A1005', 0.5); // Medium burnt patches

      ctx.globalAlpha = 1.0;
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(1, 1);
      return tex;
    };

    const generateBreadBumpMap = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      
      // Base height (mid gray)
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, 1024, 1024);
      
      const drawBumpPores = (count: number, minRadius: number, maxRadius: number, depth: number) => {
        ctx.fillStyle = `rgb(${depth}, ${depth}, ${depth})`;
        for (let i = 0; i < count; i++) {
          const x = Math.random() * 1024;
          const y = Math.random() * 1024;
          const r = minRadius + Math.random() * (maxRadius - minRadius);
          ctx.beginPath();
          ctx.ellipse(x, y, r, r * (0.7 + Math.random() * 0.6), Math.random() * Math.PI, 0, Math.PI * 2);
          ctx.fill();
        }
      };

      // Match the pores from the color map loosely
      drawBumpPores(1500, 4, 14, 60);  // Deep large pores
      drawBumpPores(6000, 2, 7, 80);   // Medium pores
      drawBumpPores(20000, 0.5, 2.5, 100); // Tiny pores
      
      // Add some overall noise to the surface
      for(let i=0; i<40000; i++) {
         const x = Math.random() * 1024;
         const y = Math.random() * 1024;
         const c = 120 + Math.random() * 40;
         ctx.fillStyle = `rgb(${c}, ${c}, ${c})`;
         ctx.fillRect(x, y, 1, 1);
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(1, 1);
      return tex;
    };

    const generateCrustTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      
      ctx.fillStyle = '#2A1405';
      ctx.fillRect(0, 0, 512, 512);
      
      // Crust has a more directional, baked texture
      ctx.globalAlpha = 0.4;
      for (let i = 0; i < 10000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const w = Math.random() * 20 + 5;
        const h = Math.random() * 3 + 1;
        
        ctx.fillStyle = Math.random() > 0.5 ? '#1A0A00' : '#4A2A11';
        ctx.fillRect(x, y, w, h);
      }
      
      // Add some baked spots/blisters
      ctx.globalAlpha = 0.6;
      for (let i = 0; i < 2000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const r = Math.random() * 4 + 1;
        ctx.fillStyle = '#0A0400';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1.0;
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2, 0.5); // Stretch along the crust
      return tex;
    };

    // ==========================================
    // TOAST MESH
    // ==========================================
    const toastShape = new THREE.Shape();
    const bottomWidth = 1.8;
    const topWidth = 1.8;
    const height = 2.0;
    const radius = 0.25;
    const yBottom = -height / 2;
    const yTop = height / 2;
    const shoulderY = yTop - 0.4;

    // Draw refined, realistic toast profile
    toastShape.moveTo(-bottomWidth / 2 + radius, yBottom);
    toastShape.lineTo(bottomWidth / 2 - radius, yBottom);
    toastShape.quadraticCurveTo(bottomWidth / 2, yBottom, bottomWidth / 2, yBottom + radius);
    
    // Right side up to shoulder
    toastShape.lineTo(topWidth / 2, shoulderY);
    
    // Top right curve to center
    toastShape.bezierCurveTo(
      topWidth / 2 + 0.25, yTop - 0.05, // wider outer bit (bulge)
      topWidth / 4, yTop + 0.15,        // curve to center
      0, yTop + 0.15                    // top center
    );
    
    // Top left curve from center to shoulder
    toastShape.bezierCurveTo(
      -topWidth / 4, yTop + 0.15,
      -topWidth / 2 - 0.25, yTop - 0.05, // wider outer bit (bulge)
      -topWidth / 2, shoulderY
    );
    
    // Left side down to bottom
    toastShape.lineTo(-bottomWidth / 2, yBottom + radius);
    toastShape.quadraticCurveTo(-bottomWidth / 2, yBottom, -bottomWidth / 2 + radius, yBottom);

    const extrudeSettings = {
      depth: 0.25,
      bevelEnabled: true,
      bevelSegments: 5,
      steps: 2,
      bevelSize: 0.06,
      bevelThickness: 0.08,
    };

    const toastGeometry = new THREE.ExtrudeGeometry(toastShape, extrudeSettings);
    toastGeometry.center();

    // Matte, organic materials with procedural textures
    const breadColorMap = generateBreadTexture();
    const breadBumpMap = generateBreadBumpMap();
    const crustColorMap = generateCrustTexture();

    const breadMaterial = new THREE.MeshStandardMaterial({
      color: '#ffffff', // Base color is white so map shows through
      map: breadColorMap || undefined,
      bumpMap: breadBumpMap || undefined,
      bumpScale: 0.06,
      roughness: 1.0,
      metalness: 0.0,
    });
    
    const crustMaterial = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      map: crustColorMap || undefined,
      roughness: 0.95,
      metalness: 0.0,
    });

    const toastMesh = new THREE.Mesh(toastGeometry, [breadMaterial, crustMaterial]);
    toastMesh.castShadow = true;
    toastMesh.receiveShadow = true;

    // Add a pat of butter!
    // Make it a drippy, melted square
    const butterGeometry = new THREE.BoxGeometry(0.45, 0.4, 0.1, 16, 16, 4);
    const posAttribute = butterGeometry.attributes.position;
    for (let i = 0; i < posAttribute.count; i++) {
      const x = posAttribute.getX(i);
      const y = posAttribute.getY(i);
      let z = posAttribute.getZ(i);
      
      // Calculate distance from center
      const dist = Math.max(Math.abs(x), Math.abs(y));
      
      // slump the top down
      if (z > 0) {
        z -= dist * 0.15; // top gets lower towards edges
        // add some asymmetry
        z -= (x + y) * 0.05;
      }
      
      if (dist > 0.1) {
         // droop down edges to make it look melted/drippy
         z -= Math.pow(dist - 0.1, 2) * 4.0;
      }
      posAttribute.setZ(i, z);
    }
    butterGeometry.computeVertexNormals();
    
    const butterMaterial = new THREE.MeshPhysicalMaterial({
      color: '#FFE600',
      emissive: '#4A3A00',
      roughness: 0.05,
      metalness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.0,
      transmission: 0.7, // More translucent
      ior: 1.5,
      thickness: 0.5,
      transparent: true,
      opacity: 0.9,
    });
    const butterMesh = new THREE.Mesh(butterGeometry, butterMaterial);
    butterMesh.position.set(0.1, -0.1, 0.22); // Slightly offset on the front face
    butterMesh.rotation.z = Math.PI / 12; // Slightly askew
    butterMesh.castShadow = true;
    butterMesh.receiveShadow = true;

    // Melted butter pool
    const poolGeometry = new THREE.CylinderGeometry(0.45, 0.45, 0.02, 32, 1);
    poolGeometry.rotateX(Math.PI / 2); // Lay flat against the Z-axis face
    const poolPos = poolGeometry.attributes.position;
    for (let i = 0; i < poolPos.count; i++) {
      let x = poolPos.getX(i);
      let y = poolPos.getY(i);
      // add some noise to the radius to make it an irregular puddle
      const angle = Math.atan2(y, x);
      const radiusOffset = Math.sin(angle * 3) * 0.08 + Math.cos(angle * 5) * 0.05;
      // only apply to outer vertices
      const dist = Math.sqrt(x*x + y*y);
      if (dist > 0.2) {
        x += Math.cos(angle) * radiusOffset;
        y += Math.sin(angle) * radiusOffset;
        poolPos.setXY(i, x, y);
      }
    }
    poolGeometry.computeVertexNormals();
    const poolMesh = new THREE.Mesh(poolGeometry, butterMaterial);
    poolMesh.position.set(0.1, -0.1, 0.205); // Just above the toast face
    poolMesh.receiveShadow = true;
    
    toastMesh.add(poolMesh);
    toastMesh.add(butterMesh);
    
    const toastGroup = new THREE.Group();
    toastGroup.add(toastMesh);
    
    // Add a point light to make the butter glisten
    const butterLight = new THREE.PointLight('#FFF4E0', 0.8, 3);
    butterLight.position.set(0.5, 0.5, 1.0);
    toastGroup.add(butterLight);
    
    // Add steam particles
    const steamCount = 30;
    const steamGeometry = new THREE.BufferGeometry();
    const steamPositions = new Float32Array(steamCount * 3);
    const steamData: { speed: number, offset: number }[] = [];
    
    for (let i = 0; i < steamCount; i++) {
      steamPositions[i * 3] = (Math.random() - 0.5) * 1.5; // x
      steamPositions[i * 3 + 1] = Math.random() * 1.5;     // y
      steamPositions[i * 3 + 2] = 0.2 + Math.random() * 0.5; // z
      steamData.push({
        speed: 0.005 + Math.random() * 0.01,
        offset: Math.random() * Math.PI * 2
      });
    }
    steamGeometry.setAttribute('position', new THREE.BufferAttribute(steamPositions, 3));
    
    // Create a soft steam texture programmatically
    const steamCanvas = document.createElement('canvas');
    steamCanvas.width = 64;
    steamCanvas.height = 64;
    const steamCtx = steamCanvas.getContext('2d');
    if (steamCtx) {
      const grad = steamCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      steamCtx.fillStyle = grad;
      steamCtx.fillRect(0, 0, 64, 64);
    }
    const steamTex = new THREE.CanvasTexture(steamCanvas);
    
    const steamMaterial = new THREE.PointsMaterial({
      size: 0.6,
      map: steamTex,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.6
    });
    
    const steamParticles = new THREE.Points(steamGeometry, steamMaterial);
    toastGroup.add(steamParticles);
    
    scene.add(toastGroup);

    // ==========================================
    // PHYSICAL CRUMBS (InstancedMesh for performance)
    // ==========================================
    const crumbCount = 60;
    // Use an irregular shape for crumbs
    const crumbGeometry = new THREE.TetrahedronGeometry(0.04, 1); 
    const crumbMaterial = new THREE.MeshStandardMaterial({
      color: '#8B5A2B',
      roughness: 1.0,
    });
    
    const crumbs = new THREE.InstancedMesh(crumbGeometry, crumbMaterial, crumbCount);
    crumbs.castShadow = true;
    crumbs.receiveShadow = true;

    const dummy = new THREE.Object3D();
    const crumbData: { speed: number, rotSpeed: number }[] = [];

    for (let i = 0; i < crumbCount; i++) {
      // Scatter them in a wider orbit
      const x = (Math.random() - 0.5) * 8;
      const y = (Math.random() - 0.5) * 8;
      const z = (Math.random() - 0.5) * 4;
      
      dummy.position.set(x, y, z);
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      
      const scale = Math.random() * 0.8 + 0.2;
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      
      crumbs.setMatrixAt(i, dummy.matrix);
      
      crumbData.push({
        speed: Math.random() * 0.02 + 0.01,
        rotSpeed: Math.random() * 0.05 + 0.01
      });
    }
    scene.add(crumbs);

    // ==========================================
    // RAZZLE DAZZLE MINI TOASTS
    // ==========================================
    const sparkleCount = 100;
    
    // Create a mini toast shape
    const sparkleShape = new THREE.Shape();
    const sw = 0.08, sh = 0.08, sr = 0.02;
    sparkleShape.moveTo(-sw + sr, -sh);
    sparkleShape.lineTo(sw - sr, -sh);
    sparkleShape.quadraticCurveTo(sw, -sh, sw, -sh + sr);
    sparkleShape.lineTo(sw, sh - sr);
    sparkleShape.quadraticCurveTo(sw, sh, sw - sr, sh);
    sparkleShape.lineTo(-sw + sr, sh);
    sparkleShape.quadraticCurveTo(-sw, sh, -sw, sh - sr);
    sparkleShape.lineTo(-sw, -sh + sr);
    sparkleShape.quadraticCurveTo(-sw, -sh, -sw + sr, -sh);
    
    const sparkleExtrudeSettings = { depth: 0.02, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.005, bevelThickness: 0.005 };
    const sparkleGeometry = new THREE.ExtrudeGeometry(sparkleShape, sparkleExtrudeSettings);
    sparkleGeometry.center();
    
    const sparkleMaterial = new THREE.MeshStandardMaterial({
      color: '#E5B874',
      roughness: 0.7,
      metalness: 0.1,
      transparent: true,
      opacity: 0.9,
    });
    const sparkles = new THREE.InstancedMesh(sparkleGeometry, sparkleMaterial, sparkleCount);
    
    const sparkleData: { speed: number, rotSpeed: number, phase: number }[] = [];
    for (let i = 0; i < sparkleCount; i++) {
      // Spread them out more, push them back in Z so they don't overlap foreground text
      const x = (Math.random() - 0.5) * 25;
      const y = (Math.random() - 0.5) * 25;
      const z = -5 - Math.random() * 15; // Push them back between -5 and -20
      
      dummy.position.set(x, y, z);
      // Randomize initial rotation
      dummy.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
      const scale = Math.random() * 2.5 + 0.5; // More varied sizes
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      
      sparkles.setMatrixAt(i, dummy.matrix);
      sparkleData.push({
        speed: Math.random() * 0.01 + 0.005,
        rotSpeed: Math.random() * 0.02,
        phase: Math.random() * Math.PI * 2
      });
    }
    scene.add(sparkles);

    // ==========================================
    // INTERACTIVITY & CONTROLS
    // ==========================================
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false;
    controls.enablePan = false;
    // Allow more freedom to explore the physical object
    controls.minPolarAngle = Math.PI / 4;
    controls.maxPolarAngle = Math.PI / 1.5;

    // Mouse parallax effect
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    const onDocumentMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX - windowHalfX) * 0.001;
      mouseY = (event.clientY - windowHalfY) * 0.001;
    };
    document.addEventListener('mousemove', onDocumentMouseMove);

    // ==========================================
    // GSAP SCROLL ANIMATIONS
    // ==========================================
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
      }
    });

    // Adjust initial scale for mobile
    if (window.innerWidth < 768) {
      toastGroup.scale.set(0.7, 0.7, 0.7);
    }

    // State 1 -> 2: Rotate to show the back (no butter), move right
    tl.to(toastGroup.rotation, {
      y: Math.PI + 0.5,
      x: 0.2,
      z: -0.2,
      ease: 'power1.inOut',
    }, 0);
    
    tl.to(toastGroup.position, {
      x: window.innerWidth > 768 ? 2.5 : 0,
      y: window.innerWidth > 768 ? 0 : 2.5,
      ease: 'power1.inOut',
    }, 0);

    // State 2 -> 3: Rotate back to front, scale down, move left
    tl.to(toastGroup.rotation, {
      y: Math.PI * 2 - 0.2,
      x: -0.1,
      z: 0.1,
      ease: 'power1.inOut',
    }, 1);

    tl.to(toastGroup.position, {
      x: window.innerWidth > 768 ? -2.5 : 0,
      y: window.innerWidth > 768 ? -0.5 : -2,
      ease: 'power1.inOut',
    }, 1);

    tl.to(toastGroup.scale, {
      x: window.innerWidth > 768 ? 0.7 : 0.5,
      y: window.innerWidth > 768 ? 0.7 : 0.5,
      z: window.innerWidth > 768 ? 0.7 : 0.5,
      ease: 'power1.inOut',
    }, 1);

    // ==========================================
    // ANIMATION LOOP
    // ==========================================
    const clock = new THREE.Clock();
    let animationFrameId: number;

    const tick = () => {
      const elapsedTime = clock.getElapsedTime();

      // Animate starfield
      starMesh.rotation.y = elapsedTime * 0.02;
      starMesh.rotation.x = elapsedTime * 0.01;

      // Parallax easing
      targetX = mouseX * 0.5;
      targetY = mouseY * 0.5;
      
      // Apply parallax to the whole group
      toastGroup.position.x += 0.05 * (targetX - toastGroup.position.x);
      toastGroup.position.y += 0.05 * (-targetY - toastGroup.position.y);

      // Gentle floating animation
      toastMesh.position.y = Math.sin(elapsedTime * 2) * 0.08;

      // Animate crumbs
      for (let i = 0; i < crumbCount; i++) {
        crumbs.getMatrixAt(i, dummy.matrix);
        dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
        
        // Slow drift
        dummy.position.y += Math.sin(elapsedTime * crumbData[i].speed + i) * 0.01;
        dummy.rotateX(crumbData[i].rotSpeed);
        dummy.rotateY(crumbData[i].rotSpeed);
        
        dummy.updateMatrix();
        crumbs.setMatrixAt(i, dummy.matrix);
      }
      crumbs.instanceMatrix.needsUpdate = true;

      // Animate mini toasts
      for (let i = 0; i < sparkleCount; i++) {
        sparkles.getMatrixAt(i, dummy.matrix);
        dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
        
        // Float upwards and wobble
        dummy.position.y += sparkleData[i].speed;
        dummy.position.x += Math.sin(elapsedTime * 2 + sparkleData[i].phase) * 0.005;
        
        // Tumble rotation
        dummy.rotateX(sparkleData[i].rotSpeed);
        dummy.rotateY(sparkleData[i].rotSpeed);
        dummy.rotateZ(sparkleData[i].rotSpeed * 0.5);
        
        // Wrap around
        if (dummy.position.y > 15) dummy.position.y = -15;
        
        dummy.updateMatrix();
        sparkles.setMatrixAt(i, dummy.matrix);
      }
      sparkles.instanceMatrix.needsUpdate = true;

      // Animate steam
      const positions = steamGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < steamCount; i++) {
        const idx = i * 3;
        positions[idx + 1] += steamData[i].speed; // move up
        positions[idx] += Math.sin(elapsedTime + steamData[i].offset) * 0.002; // waft side to side
        
        // Reset if too high
        if (positions[idx + 1] > 2.5) {
          positions[idx + 1] = 0;
          positions[idx] = (Math.random() - 0.5) * 1.5;
        }
      }
      steamGeometry.attributes.position.needsUpdate = true;

      controls.update();
      renderer.render(scene, camera);
      animationFrameId = window.requestAnimationFrame(tick);
    };

    tick();

    // Signal that the scene is ready after a short delay for first frame
    requestAnimationFrame(() => {
      setSceneReady(true);
    });

    // ==========================================
    // RESIZE HANDLING
    // ==========================================
    let resizeTimeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      }, 100);
    };

    window.addEventListener('resize', handleResize);

    // CLEANUP
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousemove', onDocumentMouseMove);
      window.cancelAnimationFrame(animationFrameId);
      
      toastGeometry.dispose();
      breadMaterial.dispose();
      crustMaterial.dispose();
      if (breadColorMap) breadColorMap.dispose();
      if (breadBumpMap) breadBumpMap.dispose();
      if (crustColorMap) crustColorMap.dispose();
      butterGeometry.dispose();
      butterMaterial.dispose();
      crumbGeometry.dispose();
      crumbMaterial.dispose();
      sparkleGeometry.dispose();
      sparkleMaterial.dispose();
      steamGeometry.dispose();
      steamMaterial.dispose();
      steamTex.dispose();
      starsGeometry.dispose();
      starsMaterial.dispose();
      renderer.dispose();
      
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <>
    {showLoading && (
      <LoadingScreen isReady={sceneReady} onComplete={handleLoadingComplete} />
    )}
    <div ref={containerRef} className="relative w-full text-[#EAE6DF] razzle-bg">
      {/* Fixed Three.js Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed top-0 left-0 w-full h-full z-0 pointer-events-auto"
        style={{ touchAction: 'none' }}
      />

      {/* UI Overlay Layer - Brutalist / Editorial Style */}
      <div className="relative z-10 pointer-events-none">
        
        {/* State 1: Hero */}
        <section className="min-h-screen flex flex-col justify-between p-6 md:p-12">
          <header className="flex justify-between items-start uppercase text-xs md:text-sm font-bold tracking-widest">
            <div>PORTFOLIO &copy;2026</div>
            <div className="text-right">
              AVAILABLE FOR<br/>FREELANCE
            </div>
          </header>
          
          <div className="pointer-events-auto mt-auto mb-12">
            <h1 className="font-serif text-[18vw] md:text-[12vw] leading-[0.85] tracking-tighter mix-blend-screen">
              FRESH<br/>BAKED
            </h1>
            <div className="flex items-center gap-4 mt-8 ml-2">
              <ArrowDownRight size={32} strokeWidth={1.5} />
              <p className="text-lg md:text-xl font-medium max-w-sm">
                I craft crisp, buttery-smooth digital experiences that leave a lasting impression.
              </p>
            </div>
          </div>
        </section>

        {/* State 2: Projects (Brutalist Grid) */}
        <section className="border-t-2 border-[#EAE6DF] mt-[20vh] bg-[#0B0D17]/80 backdrop-blur-md pointer-events-auto relative z-10">
          <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-1/3 border-b-2 md:border-b-0 md:border-r-2 border-[#EAE6DF]">
              <div className="sticky top-0 h-screen flex flex-col justify-center p-6 md:p-12 overflow-hidden">
                <h2 className="font-serif text-6xl md:text-8xl tracking-tighter relative z-10">
                  WORKS
                </h2>
                {/* Razzle Dazzle: Spinning badge */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none w-[150%] aspect-square">
                  <svg viewBox="0 0 100 100" className="w-full h-full animate-[spin_20s_linear_infinite]">
                    <path id="circlePath" d="M 50, 50 m -40, 0 a 40,40 0 1,1 80,0 a 40,40 0 1,1 -80,0" fill="transparent" />
                    <text className="text-[12px] font-bold tracking-[0.2em] uppercase font-mono" fill="#EAE6DF">
                      <textPath href="#circlePath" startOffset="0%">
                        SELECTED PROJECTS • FRESH OUT THE OVEN • 
                      </textPath>
                    </text>
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-2/3 flex flex-col">
              {[
                { title: "THE DAILY CRUMB", type: "E-COMMERCE", year: "2025" },
                { title: "SOURDOUGH STUDIO", type: "AGENCY SITE", year: "2025" },
                { title: "RYE & CO.", type: "BRANDING", year: "2024" },
                { title: "GLUTEN FREE", type: "WEBGL EXP", year: "2024" },
                { title: "BAKER'S DOZEN", type: "APP DESIGN", year: "2023" },
                { title: "CRUST & CRUMB", type: "EDITORIAL", year: "2023" }
              ].map((project, i) => (
                <div key={i} className="group relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center p-6 md:p-12 border-b-2 border-[#EAE6DF] hover:text-[#050510] transition-all duration-500 cursor-pointer">
                  {/* Hover Background Reveal */}
                  <div className="absolute inset-0 bg-[#EAE6DF] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-0"></div>
                  
                  <div className="relative z-10 transform group-hover:translate-x-4 transition-transform duration-500">
                    <h3 className="font-serif text-4xl md:text-5xl mb-2">{project.title}</h3>
                    <p className="text-sm font-bold tracking-widest uppercase opacity-70">{project.type}</p>
                  </div>
                  <div className="relative z-10 flex items-center gap-4 mt-4 md:mt-0 transform group-hover:-translate-x-4 transition-transform duration-500">
                    <span className="text-lg font-mono">{project.year}</span>
                    <div className="bg-[#050510] text-[#EAE6DF] p-3 rounded-full opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all duration-500">
                      <ArrowUpRight size={24} strokeWidth={2} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* State 3: Contact (Stark Typography) */}
        <section className="min-h-screen flex flex-col md:flex-row p-6 md:p-12 bg-[#050510] pointer-events-auto relative z-20">
          
          {/* Left Side Content */}
          <div className="w-full md:w-1/2 flex flex-col justify-center pr-0 md:pr-12 mb-12 md:mb-0">
            <h2 className="font-serif text-[12vw] md:text-[8vw] leading-[0.85] tracking-tighter mix-blend-screen">
              FRESH<br/>IDEAS,<br/>DAILY.
            </h2>
            <p className="mt-8 text-lg md:text-xl font-medium max-w-md">
              Whether you need a complete rebrand, a crisp new website, or just want to chat about sourdough starters, I'm always open for a coffee.
            </p>
            <div className="mt-12">
              <p className="text-sm font-bold tracking-widest uppercase opacity-70 mb-2">CURRENTLY</p>
              <p className="text-xl font-serif italic">Accepting new projects for Q4</p>
            </div>
          </div>

          {/* Right Side Form */}
          <div className="w-full md:w-1/2 flex flex-col justify-center max-w-2xl">
            <h2 className="font-serif text-5xl md:text-7xl tracking-tighter mb-12">
              LET'S BAKE<br/>SOMETHING.
            </h2>
            
            <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
              <div className="relative">
                <input type="text" id="name" className="peer w-full bg-transparent border-b-2 border-[#EAE6DF] py-4 text-xl focus:outline-none placeholder-transparent" placeholder="Name" />
                <label htmlFor="name" className="absolute left-0 -top-3.5 text-sm font-bold tracking-widest uppercase transition-all peer-placeholder-shown:text-xl peer-placeholder-shown:top-4 peer-focus:-top-3.5 peer-focus:text-sm">Name</label>
              </div>
              
              <div className="relative">
                <input type="email" id="email" className="peer w-full bg-transparent border-b-2 border-[#EAE6DF] py-4 text-xl focus:outline-none placeholder-transparent" placeholder="Email" />
                <label htmlFor="email" className="absolute left-0 -top-3.5 text-sm font-bold tracking-widest uppercase transition-all peer-placeholder-shown:text-xl peer-placeholder-shown:top-4 peer-focus:-top-3.5 peer-focus:text-sm">Email</label>
              </div>
              
              <div className="relative">
                <textarea id="message" rows={3} className="peer w-full bg-transparent border-b-2 border-[#EAE6DF] py-4 text-xl focus:outline-none placeholder-transparent resize-none" placeholder="Message"></textarea>
                <label htmlFor="message" className="absolute left-0 -top-3.5 text-sm font-bold tracking-widest uppercase transition-all peer-placeholder-shown:text-xl peer-placeholder-shown:top-4 peer-focus:-top-3.5 peer-focus:text-sm">Message</label>
              </div>
              
              <button className="w-full bg-[#EAE6DF] text-[#050510] font-bold tracking-widest uppercase py-6 hover:bg-[#E5B874] hover:text-[#050510] transition-colors">
                Send Inquiry
              </button>
            </form>

            <footer className="mt-24 flex flex-col md:flex-row justify-between items-start md:items-center text-sm font-bold tracking-widest uppercase border-t-2 border-[#EAE6DF] pt-6 gap-4 md:gap-0">
              <div className="flex gap-6">
                <a href="#" className="hover:text-[#E5B874] transition-colors">TW</a>
                <a href="#" className="hover:text-[#E5B874] transition-colors">IN</a>
                <a href="#" className="hover:text-[#E5B874] transition-colors">GH</a>
              </div>
              <div>BASED IN THE OVEN</div>
            </footer>
          </div>
        </section>

      </div>
    </div>
    </>
  );
}
