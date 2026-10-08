import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Orb Bot — interactive 3D mascot as a hero background layer.
 * Transparent canvas: the page's dark theme shows through.
 * - Glowing eyes track the visitor's cursor anywhere on the page
 * - Drag (mouse/pen) to spin it; it eases back to front when idle
 * - Click it → it winks. Auto-blinks every few seconds.
 * - Touch devices: vertical scroll always works (pan-y), no drag-capture
 */
export default function OrbBot() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 50);
    camera.position.set(0, 0, 9.2);

    /* ----- studio environment for metal reflections ----- */
    const envScene = new THREE.Scene();
    const dome = new THREE.SphereGeometry(20, 32, 24);
    const cols = [];
    const pos = dome.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const yy = pos.getY(i) / 20;
      const v = yy > 0 ? 0.2 + 0.6 * Math.pow(yy, 1.4) : 0.2 + 0.4 * Math.pow(-yy, 1.1);
      const c = new THREE.Color().setRGB(v * 0.98, v, v * 1.03);
      cols.push(c.r, c.g, c.b);
    }
    dome.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    envScene.add(new THREE.Mesh(dome, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
    const softbox = (w, h, x, y, z, v) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(v, v, v * 1.03), side: THREE.DoubleSide })
      );
      m.position.set(x, y, z);
      m.lookAt(0, 0, 0);
      envScene.add(m);
    };
    softbox(14, 8, 0, 14, 5, 2.6);
    softbox(5, 14, -14, 3, 6, 1.5);
    softbox(5, 14, 14, 3, 6, 1.3);
    softbox(18, 4, 0, -2, 16, 1.0);
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(envScene, 0.03).texture;

    /* ----- robot ----- */
    const robot = new THREE.Group();
    scene.add(robot);

    const metal = new THREE.MeshStandardMaterial({ color: 0x9a9da3, metalness: 1, roughness: 0.24, envMapIntensity: 1.0 });
    robot.add(new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64, 0, Math.PI * 2, 0, 2.65), metal));

    const PHI = 1.92;
    const TH0 = 0.28 * Math.PI;
    const THL = 0.5 * Math.PI;
    const panel = new THREE.Mesh(
      new THREE.SphereGeometry(1.012, 96, 48, Math.PI / 2 - PHI / 2, PHI, TH0, THL),
      new THREE.MeshPhysicalMaterial({ color: 0x777a80, metalness: 1, roughness: 0.22, clearcoat: 0, envMapIntensity: 0.95 })
    );
    panel.material.side = THREE.FrontSide;
    robot.add(panel);

    const seamMat = new THREE.MeshStandardMaterial({ color: 0xc4c7cc, metalness: 1, roughness: 0.14 });
    [-1, 1].forEach((s) => {
      robot.add(new THREE.Mesh(new THREE.SphereGeometry(1.016, 8, 48, Math.PI / 2 + s * (PHI / 2) - 0.012, 0.024, TH0, THL), seamMat));
    });

    // glowing face (eyes + smile), redrawn only when pose changes
    const fc = document.createElement('canvas');
    fc.width = 1024;
    fc.height = 836;
    const fx = fc.getContext('2d');
    const faceTex = new THREE.CanvasTexture(fc);
    faceTex.encoding = THREE.sRGBEncoding;
    faceTex.anisotropy = 8;
    const sprite = (w, h, draw) => {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      draw(c.getContext('2d'));
      return c;
    };
    const glowPass = (x, shape) => {
      [[90, 'rgba(60,150,255,.9)', 'rgba(60,150,255,.9)', 1], [34, 'rgba(70,170,255,1)', '#58b8ff', 1], [0, 'rgba(0,0,0,0)', '#cfeaff', 0.72]]
        .forEach((p) => { x.save(); x.shadowBlur = p[0]; x.shadowColor = p[1]; shape(x, p[2], p[3]); x.restore(); });
    };
    const eyeSprite = sprite(300, 300, (x) => {
      x.lineCap = 'round';
      glowPass(x, (c, col) => { c.beginPath(); c.ellipse(150, 150, 56, 62, 0, 0, Math.PI * 2); c.fillStyle = col; c.fill(); });
    });
    const smileSprite = sprite(460, 340, (x) => {
      x.lineCap = 'round';
      glowPass(x, (c, col, k) => { c.beginPath(); c.arc(230, 100, 130, Math.PI * 0.2, Math.PI * 0.8); c.lineWidth = 14 * k; c.strokeStyle = col; c.stroke(); });
    });
    const drawFace = (open, ox = 0, oy = 0) => {
      fx.clearRect(0, 0, fc.width, fc.height);
      [-1, 1].forEach((s) => {
        fx.save();
        fx.translate(512 + s * 202 + ox, 301 + oy);
        fx.scale(1, Math.max(open, 0.08));
        fx.drawImage(eyeSprite, -150, -150);
        fx.restore();
      });
      fx.drawImage(smileSprite, 512 + ox * 0.75 - 230, 440 + oy * 0.75 - 100);
      faceTex.needsUpdate = true;
    };
    drawFace(1);
    robot.add(new THREE.Mesh(
      new THREE.SphereGeometry(1.02, 96, 48, Math.PI / 2 - PHI / 2, PHI, TH0, THL),
      new THREE.MeshBasicMaterial({ map: faceTex, transparent: true, depthWrite: false, toneMapped: false })
    ));

    // flat-cut bottom plate
    const plate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.47, 0.43, 0.07, 72),
      new THREE.MeshStandardMaterial({ color: 0x35373b, metalness: 1, roughness: 0.32 })
    );
    plate.position.y = -0.9;
    robot.add(plate);
    const cutRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.475, 0.012, 10, 72),
      new THREE.MeshStandardMaterial({ color: 0xb8bbc0, metalness: 1, roughness: 0.18 })
    );
    cutRim.rotation.x = Math.PI / 2;
    cutRim.position.y = -0.88;
    robot.add(cutRim);

    // soft floor shadow
    const sc = document.createElement('canvas');
    sc.width = sc.height = 256;
    const sx = sc.getContext('2d');
    const g = sx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, 'rgba(0,0,0,.55)');
    g.addColorStop(0.5, 'rgba(0,0,0,.22)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    sx.fillStyle = g;
    sx.fillRect(0, 0, 256, 256);
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 2.4),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -1.75;
    scene.add(shadow);

    /* ----- interaction: eyes follow the page cursor, drag spins (mouse/pen) ----- */
    let yaw = 0, pitch = 0, vy = 0, dragging = false, lastX = 0, lastY = 0, lastInput = -1e9;
    let baseX = 0; // desktop: bot sits right of the headline; mobile: centered

    const onDown = (e) => {
      if (e.pointerType === 'touch') return; // touch scrolls the page, never drags
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      vy = 0;
      try { canvas.setPointerCapture(e.pointerId); } catch { /* noop */ }
    };
    const onMove = (e) => {
      if (!dragging || e.pointerType === 'touch') return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      yaw += dx * 0.012;
      vy = dx * 0.012;
      pitch = Math.max(-0.7, Math.min(0.7, pitch + dy * 0.008));
      lastInput = performance.now();
    };
    const onUp = () => { dragging = false; lastInput = performance.now(); };
    const onClick = () => { blink(); }; // poke the bot → it winks

    let blinkStart = -1;
    const blink = () => { blinkStart = performance.now(); };

    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.position.z = w / h < 0.8 ? 9.2 / Math.max(0.55, (w / h) * 1.15) : 9.2;
      baseX = w / h > 1.1 ? 1.55 : 0; // park right of the headline on desktop
      camera.updateProjectionMatrix();
    };

    // cursor tracking across the whole window (clamped) → eyes follow you
    let lookX = 0, lookY = 0, tx = 0, ty = 0;
    const onCursor = (e) => {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      tx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width * 0.5)));
      ty = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height * 0.48)) / (r.height * 0.5)));
    };
    const onCursorLeave = () => { tx = 0; ty = 0; };

    let raf = 0;
    let lastOx = 0, lastOy = 0, lastOpen = 1;
    let nextBlink = performance.now() + 2500;
    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      const t = now / 1000;
      if (!dragging) {
        yaw += vy;
        vy *= 0.92;
        if (now - lastInput > 2200) {
          const target = Math.round(yaw / (2 * Math.PI)) * 2 * Math.PI + (reduce ? 0 : Math.sin(t * 0.7) * 0.22);
          yaw += (target - yaw) * 0.04;
          pitch += ((reduce ? 0 : Math.sin(t * 0.5) * 0.06) - pitch) * 0.04;
        }
      }
      const bob = reduce ? 0 : Math.sin(t * 1.3) * 0.06;
      lookX += (tx - lookX) * 0.12;
      lookY += (ty - lookY) * 0.12;
      robot.rotation.set(pitch + lookY * 0.16, yaw + lookX * 0.26, 0);
      robot.position.set(baseX, bob + 0.05, 0);
      const k = 1 - bob * 1.1;
      shadow.scale.set(k * 1.15, k, k);
      shadow.position.x = baseX;
      shadow.material.opacity = 0.9 - bob * 2;

      if (!reduce && now > nextBlink && blinkStart < 0) blink();
      let open = 1;
      if (blinkStart >= 0) {
        const p = (now - blinkStart) / 260;
        if (p >= 1) {
          blinkStart = -1;
          nextBlink = now + 2500 + Math.random() * 3500;
        } else {
          open = Math.abs(1 - 2 * p);
        }
      }
      const ox = lookX * 78;
      const oy = lookY * 46;
      if (Math.abs(open - lastOpen) > 0.02 || Math.abs(ox - lastOx) > 0.4 || Math.abs(oy - lastOy) > 0.4) {
        drawFace(open, ox, oy);
        lastOpen = open;
        lastOx = ox;
        lastOy = oy;
      }
      renderer.render(scene, camera);
    };

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('click', onClick);
    window.addEventListener('pointermove', onCursor, { passive: true });
    document.addEventListener('pointerleave', onCursorLeave);
    window.addEventListener('resize', resize);
    resize();
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('click', onClick);
      window.removeEventListener('pointermove', onCursor);
      document.removeEventListener('pointerleave', onCursorLeave);
      window.removeEventListener('resize', resize);
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
      });
      faceTex.dispose();
      pmrem.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Interactive 3D orb assistant with a glowing smile — its eyes follow your cursor"
      className="absolute inset-0 h-full w-full"
      style={{ touchAction: 'pan-y', cursor: 'grab' }}
    />
  );
}
