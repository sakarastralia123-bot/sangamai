import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Orb Bot v2 — studio-grade 3D mascot as the hero background.
 * Transparent canvas over the dark theme. Dead center.
 * - Chrome body: lathe geometry with measured lower flare, flat-cut base,
 *   seam rings, dark core, satin plate — lit by a painted studio HDRI
 *   (bright overhead softbox, violet left / cyan right rims)
 * - Face: eyes + smile drawn in azimuth/elevation space and wrapped onto
 *   the sphere, with reference-measured glow falloff (additive halo)
 * - Eyes track the visitor's cursor; drag (mouse/pen) to spin, tap to wink,
 *   auto-blink, gentle float, eases back to front when idle
 * - Touch: page scroll always works (pan-y); reduced-motion: calm static pose
 */

const D2R = Math.PI / 180;
const REF = { w: 1280, h: 720, cx: 639.5, cy: 363, r: 156 };
const FOV = 4;
const DIST0 = REF.h / REF.r / (2 * Math.tan((FOV * D2R) / 2));

// face patch: +-35deg wide, +-25deg tall, 14 texels per degree
const PHI = 70;
const EPS = 25;
const PPD = 14;
const TW = PHI * PPD;
const TH = 2 * EPS * PPD;
const PX = 1 / REF.r / D2R * PPD; // texels per reference pixel at sphere centre

const sph = (px, py) => {
  const nx = (px - REF.cx) / REF.r;
  const ny = (REF.cy - py) / REF.r;
  const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
  return { a: Math.atan2(nx, nz) / D2R, e: Math.asin(ny) / D2R };
};
const tx = (a) => (a + PHI / 2) * PPD;
const ty = (e) => (EPS - e) * PPD;

const EYE_L = sph(592.5, 338.8);
const EYE_R = sph(687.5, 338.9);
const SMILE_PTS = [
  [611.5, 389.6], [617, 392.4], [624, 396], [632, 398], [640, 398.4],
  [648, 398], [656, 396], [663, 392.4], [668.5, 389.4],
].map((p) => sph(p[0] + 2, p[1] - 1.3));
const EYE_R_PX = 16.5 * PX;

// measured glow (RGB added) per 3px of distance from a feature edge
const GP = [
  [53.0, 97.3, 114.1], [18.1, 56.1, 82.0], [8.4, 36.0, 60.5], [5.7, 23.5, 43.8],
  [5.0, 16.9, 33.0], [3.9, 13.8, 27.3], [2.8, 10.7, 21.8], [2.3, 8.1, 17.1],
  [2.0, 6.5, 13.9], [1.7, 5.3, 11.3], [1.7, 4.0, 9.0], [1.3, 2.3, 5.8],
  [0.8, 1.3, 3.3], [1.0, 1.4, 2.4], [0.9, 1.1, 1.6], [0.5, 0.9, 1.2], [0.3, 0.7, 1.0],
];

// body flare toward the bottom (silhouette profile)
const FT = [
  [-0.4, 1], [-0.5, 1.008], [-0.686, 1.027], [-0.75, 1.034], [-0.788, 1.042],
  [-0.827, 1.072], [-0.859, 1.095], [-0.878, 1.119], [-0.904, 1.19], [-1, 1.32],
];
const CUT = -0.897; // flat-cut bottom
const SEAM = 0.8087;
const GAP = 0.011;

export default function OrbBot() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mot = reduce ? 0 : 1;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.localClippingEnabled = true;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, 1, 10, 400);

    /* ----- painted studio HDRI (equirect): bright ceiling, violet/cyan rims ----- */
    const envCanvas = document.createElement('canvas');
    envCanvas.width = 512;
    envCanvas.height = 256;
    {
      const x = envCanvas.getContext('2d');
      const sky = x.createLinearGradient(0, 0, 0, 256);
      sky.addColorStop(0, '#f4f6ff');
      sky.addColorStop(0.42, '#8b8fa0');
      sky.addColorStop(0.55, '#2a2c33');
      sky.addColorStop(1, '#050507');
      x.fillStyle = sky;
      x.fillRect(0, 0, 512, 256);
      // overhead softbox
      x.fillStyle = 'rgba(255,255,255,0.95)';
      x.fillRect(150, 6, 212, 46);
      // violet left strip, cyan right strip (brand reflections in the chrome)
      x.fillStyle = 'rgba(150,90,255,0.9)';
      x.fillRect(28, 70, 44, 120);
      x.fillStyle = 'rgba(60,220,255,0.9)';
      x.fillRect(440, 70, 44, 120);
      // low fill strips for lower-sphere definition
      x.fillStyle = 'rgba(255,255,255,0.28)';
      x.fillRect(120, 150, 90, 22);
      x.fillRect(302, 150, 90, 22);
    }
    const envTex = new THREE.CanvasTexture(envCanvas);
    envTex.mapping = THREE.EquirectangularReflectionMapping;
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envRT = pmrem.fromEquirectangular(envTex);
    pmrem.dispose();
    envTex.dispose();

    /* ----- face textures ----- */
    const cv = (w, h) => {
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.ceil(w));
      c.height = Math.max(1, Math.ceil(h));
      return c;
    };
    const eyeCore = cv(EYE_R_PX * 2 + 40, EYE_R_PX * 2 + 40);
    {
      const x = eyeCore.getContext('2d');
      const c = eyeCore.width / 2;
      const g = x.createRadialGradient(c, c, 0, c, c, EYE_R_PX * 1.1);
      g.addColorStop(0, 'rgba(210,249,253,1)');
      g.addColorStop(0.5, 'rgba(203,248,251,1)');
      g.addColorStop(0.84, 'rgba(197,246,253,1)');
      g.addColorStop(0.93, 'rgba(150,226,252,.85)');
      g.addColorStop(1, 'rgba(110,190,240,0)');
      x.fillStyle = g;
      x.beginPath();
      x.arc(c, c, EYE_R_PX * 1.1, 0, 7);
      x.fill();
    }
    const smileBox = {
      x0: tx(SMILE_PTS[0].a) - 50 * PX,
      x1: tx(SMILE_PTS[8].a) + 50 * PX,
      y0: ty(SMILE_PTS[0].e) - 50 * PX,
      y1: ty(SMILE_PTS[4].e) + 50 * PX,
    };
    const smileCore = cv(smileBox.x1 - smileBox.x0, smileBox.y1 - smileBox.y0);
    {
      const x = smileCore.getContext('2d');
      x.lineCap = 'round';
      x.lineJoin = 'round';
      const path = () => {
        x.beginPath();
        SMILE_PTS.forEach((p, i) => {
          const X = tx(p.a) - smileBox.x0;
          const Y = ty(p.e) - smileBox.y0;
          if (i) x.lineTo(X, Y);
          else x.moveTo(X, Y);
        });
      };
      path();
      x.lineWidth = 8.6 * PX;
      x.strokeStyle = 'rgba(150,226,252,.55)';
      x.stroke();
      path();
      x.lineWidth = 6.2 * PX;
      x.strokeStyle = 'rgba(194,244,248,1)';
      x.stroke();
    }
    const glowAt = (dd) => {
      const f = (dd - 1.5) / 3;
      if (f <= 0) return GP[0];
      const i = Math.floor(f);
      if (i >= GP.length - 1) return [0, 0, 0];
      const t = f - i;
      const A = GP[i];
      const B = GP[i + 1];
      return [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t];
    };
    const halo = (w, h, dist) => {
      const c = cv(w, h);
      const x = c.getContext('2d');
      const id = x.createImageData(c.width, c.height);
      const d = id.data;
      for (let j = 0; j < c.height; j++) {
        for (let i = 0; i < c.width; i++) {
          const g = glowAt(dist(i, j) / PX);
          const o = (j * c.width + i) * 4;
          d[o] = g[0];
          d[o + 1] = g[1];
          d[o + 2] = g[2];
          d[o + 3] = 255;
        }
      }
      x.putImageData(id, 0, 0);
      return c;
    };
    const HR = EYE_R_PX + 50 * PX;
    const eyeHalo = halo(HR * 2, HR * 2, (i, j) => Math.hypot(i - HR, j - HR) - EYE_R_PX);
    const sox = 50 * PX;
    const soy = 50 * PX;
    const smileHalo = halo(
      smileCore.width + 100 * PX,
      smileCore.height + 100 * PX,
      (i, j) => {
        const px = i - sox + smileBox.x0;
        const py = j - soy + smileBox.y0;
        let best = 1e9;
        for (let k = 0; k < SMILE_PTS.length - 1; k++) {
          const ax = tx(SMILE_PTS[k].a);
          const ay = ty(SMILE_PTS[k].e);
          const bx = tx(SMILE_PTS[k + 1].a);
          const by = ty(SMILE_PTS[k + 1].e);
          const dx = bx - ax;
          const dy = by - ay;
          const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
          best = Math.min(best, Math.hypot(px - ax - t * dx, py - ay - t * dy));
        }
        return best - 3.6 * PX;
      }
    );

    const coreCanvas = cv(TW, TH);
    const glowCanvas = cv(TW, TH);
    const cctx = coreCanvas.getContext('2d');
    const gctx = glowCanvas.getContext('2d');
    const coreTex = new THREE.CanvasTexture(coreCanvas);
    const glowTex = new THREE.CanvasTexture(glowCanvas);
    coreTex.encoding = THREE.sRGBEncoding;
    glowTex.encoding = THREE.sRGBEncoding;
    coreTex.anisotropy = 8;
    glowTex.anisotropy = 8;

    const drawFace = (open, da, de) => {
      cctx.clearRect(0, 0, TW, TH);
      gctx.globalCompositeOperation = 'source-over';
      gctx.fillStyle = '#000';
      gctx.fillRect(0, 0, TW, TH);
      gctx.globalCompositeOperation = 'lighter';
      [EYE_L, EYE_R].forEach((p) => {
        const X = tx(p.a + da);
        const Y = ty(p.e + de);
        const s = Math.max(open, 0.07);
        gctx.save();
        gctx.translate(X, Y);
        gctx.scale(1, s);
        gctx.drawImage(eyeHalo, -HR, -HR);
        gctx.restore();
        cctx.save();
        cctx.translate(X, Y);
        cctx.scale(1, s);
        cctx.drawImage(eyeCore, -eyeCore.width / 2, -eyeCore.height / 2);
        cctx.restore();
      });
      const ox = tx(da) - tx(0);
      const oy = ty(de) - ty(0);
      gctx.drawImage(smileHalo, smileBox.x0 - sox + ox, smileBox.y0 - soy + oy);
      cctx.drawImage(smileCore, smileBox.x0 + ox, smileBox.y0 + oy);
      coreTex.needsUpdate = true;
      glowTex.needsUpdate = true;
    };

    /* ----- geometry ----- */
    const localCut = new THREE.Plane(new THREE.Vector3(0, 1, 0), -CUT);
    const clip = [new THREE.Plane()];
    const robot = new THREE.Group();
    scene.add(robot);

    const lathe = (x0, x1, n) => {
      const pts = [];
      for (let i = 0; i <= n; i++) {
        const x = x0 + ((x1 - x0) * i) / n;
        pts.push(new THREE.Vector2(Math.sqrt(Math.max(0, 1 - x * x)), x));
      }
      return pts;
    };
    const flare = (g) => {
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const y = p.getY(i);
        if (y > -0.4) continue;
        let f = 1.32;
        for (let k = 0; k < FT.length - 1; k++) {
          if (y <= FT[k][0] && y >= FT[k + 1][0]) {
            const t = (y - FT[k][0]) / (FT[k + 1][0] - FT[k][0]);
            f = FT[k][1] + (FT[k + 1][1] - FT[k][1]) * t;
            break;
          }
        }
        p.setX(i, p.getX(i) * f);
        p.setZ(i, p.getZ(i) * f);
      }
      p.needsUpdate = true;
      return g;
    };

    const metal = new THREE.MeshStandardMaterial({
      color: 0xf2f2f2, metalness: 1, roughness: 0.06,
      envMap: envRT.texture, envMapIntensity: 1.1, clippingPlanes: clip,
    });
    {
      const slabPts = lathe(-SEAM, SEAM, 120);
      robot.add(new THREE.Mesh(flare(new THREE.LatheGeometry(slabPts, 160).rotateZ(-Math.PI / 2)), metal));
      [1, -1].forEach((s) => {
        const pts = lathe(SEAM + GAP, 1, 40);
        robot.add(new THREE.Mesh(
          flare(new THREE.LatheGeometry(pts, 128).rotateZ(s > 0 ? -Math.PI / 2 : Math.PI / 2)), metal
        ));
        const sg = new THREE.TorusGeometry(Math.sqrt(1 - Math.pow(SEAM + GAP / 2, 2)) * 0.996, 0.0042, 8, 160);
        const sc = [];
        const sp = sg.attributes.position;
        for (let i = 0; i < sp.count; i++) {
          const yy = sp.getY(i);
          let k = Math.min(1, Math.max(0, (yy - 0.2) / 0.22));
          k = k * k * (3 - 2 * k);
          k *= Math.min(1, Math.max(0, (0.6 - yy) / 0.08));
          const L = 0.055 + 0.62 * k;
          sc.push(L, L * 1.02, L * 1.05);
        }
        sg.setAttribute('color', new THREE.Float32BufferAttribute(sc, 3));
        const ring = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ vertexColors: true }));
        ring.rotation.y = Math.PI / 2;
        ring.position.x = s * (SEAM + GAP / 2);
        robot.add(ring);
      });
    }
    robot.add(new THREE.Mesh(
      new THREE.SphereGeometry(0.955, 48, 32),
      new THREE.MeshBasicMaterial({ color: 0x07080b, clippingPlanes: clip })
    ));
    {
      // satin edge fading to near-black underside
      const prof = [
        [0, -0.068], [0.22, -0.065], [0.31, -0.059], [0.375, -0.052], [0.42, -0.043],
        [0.458, -0.032], [0.48, -0.02], [0.51, -0.008], [0.53, 0], [0, 0],
      ].map((p) => new THREE.Vector2(p[0], p[1]));
      const pg = new THREE.LatheGeometry(prof, 120);
      const pc = [];
      const pp = pg.attributes.position;
      for (let i = 0; i < pp.count; i++) {
        const u = (pp.getY(i) + 0.068) / 0.068;
        const L = 0.004 + 0.04 * Math.pow(u, 1.3);
        pc.push(L * 0.98, L, L * 1.07);
      }
      pg.setAttribute('color', new THREE.Float32BufferAttribute(pc, 3));
      const plate = new THREE.Mesh(pg, new THREE.MeshBasicMaterial({ vertexColors: true }));
      plate.position.y = CUT;
      robot.add(plate);
    }
    {
      const thS = (90 - EPS) * D2R;
      const thL = 2 * EPS * D2R;
      const phS = Math.PI / 2 - ((PHI / 2) * D2R);
      const phL = PHI * D2R;
      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(1.004, 72, 48, phS, phL, thS, thL),
        new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })
      );
      const face = new THREE.Mesh(
        new THREE.SphereGeometry(1.006, 72, 48, phS, phL, thS, thL),
        new THREE.MeshBasicMaterial({ map: coreTex, transparent: true, depthWrite: false, toneMapped: false })
      );
      glow.renderOrder = 1;
      face.renderOrder = 2;
      robot.add(glow, face);
    }

    // soft contact shadow
    const shCan = cv(600, 120);
    let shadow;
    {
      const sx = shCan.getContext('2d');
      const sid = sx.createImageData(600, 120);
      for (let j = 0; j < 120; j++) {
        for (let i = 0; i < 600; i++) {
          const rn = Math.hypot((i - 300) / 300, (j - 60) / 60);
          const t = Math.min(1, Math.max(0, (1 - rn) / 0.6));
          const a = t * t * (3 - 2 * t) * 0.66;
          const o = (j * 600 + i) * 4;
          sid.data[o] = 8;
          sid.data[o + 1] = 9;
          sid.data[o + 2] = 11;
          sid.data[o + 3] = a * 255;
        }
      }
      sx.putImageData(sid, 0, 0);
      shadow = new THREE.Mesh(
        new THREE.PlaneGeometry(310 / REF.r, 58 / REF.r),
        new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shCan), transparent: true, depthWrite: false })
      );
      scene.add(shadow);
    }
    const BASE_Y = -0.85; // face clears the headline panel, body overlaps the circuit top
    const shadowY = (REF.h / 2 - 581) / REF.r + BASE_Y;
    shadow.position.set(0, shadowY, 0);
    robot.position.set(0, BASE_Y, 0);

    /* ----- sizing: reference framing, scaled to the canvas ----- */
    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      const a = w / h;
      camera.aspect = a;
      camera.position.set(0, 0, DIST0 * Math.max(1, 0.62 / a));
      camera.updateProjectionMatrix();
    };

    /* ----- interaction ----- */
    let yaw = 0;
    let pitch = 0;
    let vy = 0;
    let dragging = false;
    let moved = 0;
    let lx = 0;
    let ly = 0;
    let lastInput = -1e9;
    let lookX = 0;
    let lookY = 0;
    let txCur = 0;
    let tyCur = 0;
    let blinkAt = -1;
    let nextBlink = performance.now() + 2600;

    const blink = () => {
      if (blinkAt < 0) blinkAt = performance.now();
    };
    const onDown = (e) => {
      if (e.pointerType === 'touch') {
        lx = e.clientX;
        ly = e.clientY;
        moved = 0;
        dragging = true; // tap-track only; touch never rotates (page scrolls)
        return;
      }
      dragging = true;
      moved = 0;
      lx = e.clientX;
      ly = e.clientY;
      vy = 0;
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
    };
    const onMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - lx;
      const dy = e.clientY - ly;
      lx = e.clientX;
      ly = e.clientY;
      moved += Math.abs(dx) + Math.abs(dy);
      if (e.pointerType === 'touch') return;
      yaw += dx * 0.012;
      vy = dx * 0.012;
      pitch = Math.max(-0.7, Math.min(0.7, pitch + dy * 0.008));
      lastInput = performance.now();
    };
    const onUp = () => {
      if (dragging && moved < 5) blink(); // tap (mouse or touch) → wink
      dragging = false;
      lastInput = performance.now();
    };
    const onCursor = (e) => {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const span = Math.max(r.width, r.height) * 0.5;
      txCur = Math.max(-1, Math.min(1, ((e.clientX - (r.left + r.width / 2)) / span) * 1.4));
      tyCur = Math.max(-1, Math.min(1, ((e.clientY - (r.top + r.height * 0.5)) / span) * 1.4));
    };
    const onCursorLeave = () => {
      txCur = 0;
      tyCur = 0;
    };

    let raf = 0;
    const last = { o: -1, a: 0, e: 0 };
    drawFace(1, 0, 0);
    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      const t = now / 1000;
      if (!dragging) {
        yaw += vy;
        vy *= 0.92;
        if (now - lastInput > 1800) {
          yaw += (Math.round(yaw / (2 * Math.PI)) * 2 * Math.PI - yaw) * 0.05;
          pitch += (0 - pitch) * 0.05;
        }
      }
      lookX += (txCur - lookX) * 0.1;
      lookY += (tyCur - lookY) * 0.1;
      const bob = Math.sin(t * 1.1) * 0.012 * mot;
      robot.position.y = BASE_Y + bob;
      robot.rotation.set(pitch + lookY * 0.07, yaw + lookX * 0.1, 0);
      const k = 1 - bob * 1.4;
      shadow.scale.set(k, k, 1);
      shadow.material.opacity = 1 - bob * 4;

      if (!reduce && now > nextBlink && blinkAt < 0) blink();
      let open = 1;
      if (blinkAt >= 0) {
        const p = (now - blinkAt) / 240;
        if (p >= 1) {
          blinkAt = -1;
          nextBlink = now + 2600 + Math.random() * 3600;
        } else {
          open = Math.abs(1 - 2 * p);
        }
      }
      const da = lookX * 8;
      const de = -lookY * 5;
      if (Math.abs(open - last.o) > 0.02 || Math.abs(da - last.a) > 0.05 || Math.abs(de - last.e) > 0.05) {
        drawFace(open, da, de);
        last.o = open;
        last.a = da;
        last.e = de;
      }
      robot.updateMatrixWorld(true);
      clip[0].copy(localCut).applyMatrix4(robot.matrixWorld); // flat cut glued to the body
      renderer.render(scene, camera);
    };

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
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
      window.removeEventListener('pointermove', onCursor);
      document.removeEventListener('pointerleave', onCursorLeave);
      window.removeEventListener('resize', resize);
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
            if (m.map) m.map.dispose();
            m.dispose();
          });
        }
      });
      coreTex.dispose();
      glowTex.dispose();
      envRT.dispose();
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
