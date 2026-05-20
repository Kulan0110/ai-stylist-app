import * as THREE from 'three';

// ── Palette ───────────────────────────────────────────────────────────────────

const C: Record<string, number> = {
  skin:       0xFFCBA4,
  skinShadow: 0xF0A875,
  hair:       0x5C3317,
  eyeWhite:   0xF9F9F9,
  eyeIris:    0x7B4F2E,
  eyePupil:   0x0F0F0F,
  eyeHL:      0xFFFFFF,
  blush:      0xFFB0A0,
  mouth:      0xC86644,
  shirt:      0x111111,
  shorts:     0xC9A46A,
  shortsShad: 0xB08A42,
  shoeRed:    0xCC1F1F,
  shoeSole:   0xF2F2F2,
  silver:     0xCCCCCC,
  outline:    0x1A1A1A,
  ground:     0xB5B5B5,
};

// ── Toon gradient (sharp step shading) ────────────────────────────────────────

function makeToonGrad(steps: number = 4): THREE.DataTexture {
  const d = new Uint8Array(4 * steps);
  for (let i = 0; i < steps; i++) {
    const v = Math.round((i / (steps - 1)) * 255);
    d[i*4] = d[i*4+1] = d[i*4+2] = v; d[i*4+3] = 255;
  }
  const t = new THREE.DataTexture(d, steps, 1);
  t.needsUpdate = true;
  t.minFilter = t.magFilter = THREE.NearestFilter;
  return t;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** MeshToonMaterial shorthand */
function toon(color: number, gm: THREE.DataTexture, opts: Record<string, any> = {}): THREE.MeshToonMaterial {
  return new THREE.MeshToonMaterial({ color, gradientMap: gm, ...opts });
}

/** Inverted-hull outline on any mesh */
function outline(mesh: THREE.Mesh, thick: number = 0.010): void {
  const m = new THREE.Mesh(
    mesh.geometry,
    new THREE.MeshBasicMaterial({ color: C.outline, side: THREE.BackSide })
  );
  m.scale.setScalar(1 + thick);
  mesh.add(m);
}

/** Convenience: create Mesh, add to parent, return it */
function mesh(
  parent: THREE.Object3D,
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  [x, y, z]: [number, number, number] = [0, 0, 0],
  shadow: boolean = false
): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  if (shadow) m.castShadow = true;
  parent.add(m);
  return m;
}

// ── Pokéball canvas texture ───────────────────────────────────────────────────

function makePokeballTex(): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 256;
  const g = cv.getContext('2d')!;
  const CX = 128, CY = 128, R = 112;

  g.save();
  g.beginPath(); g.arc(CX, CY, R, 0, Math.PI * 2); g.clip();

  g.fillStyle = '#DD1C1C'; g.fillRect(0, 0, 256, 128);
  g.fillStyle = '#F0F0F0'; g.fillRect(0, 128, 256, 128);

  g.fillStyle = '#111'; g.fillRect(0, 114, 256, 28);

  g.fillStyle = '#111';  g.beginPath(); g.arc(CX, CY, 33, 0, Math.PI*2); g.fill();
  g.fillStyle = '#F0F0F0'; g.beginPath(); g.arc(CX, CY, 24, 0, Math.PI*2); g.fill();
  g.fillStyle = '#CCCCCC'; g.beginPath(); g.arc(CX, CY, 14, 0, Math.PI*2); g.fill();

  g.restore();
  g.strokeStyle = '#111'; g.lineWidth = 5;
  g.beginPath(); g.arc(CX, CY, R, 0, Math.PI * 2); g.stroke();

  return new THREE.CanvasTexture(cv);
}

// ── Character builder ─────────────────────────────────────────────────────────

interface CharacterRefs {
  torso: THREE.Mesh;
  neck: THREE.Mesh;
  headGroup: THREE.Group;
  head: THREE.Mesh;
}

interface CharacterResult {
  root: THREE.Group;
  refs: Partial<CharacterRefs>;
}

function buildCharacter(gm: THREE.DataTexture): CharacterResult {
  const root = new THREE.Group();
  const refs: Partial<CharacterRefs> = {};

  const skinMat    = toon(C.skin,       gm);
  const skinShMat  = toon(C.skinShadow, gm);
  const hairMat    = toon(C.hair,       gm);
  const shirtMat   = toon(C.shirt,      gm);
  const shortsMat  = toon(C.shorts,     gm);
  const shortsShMat= toon(C.shortsShad, gm);
  const shoeMat    = toon(C.shoeRed,    gm);
  const soleMat    = toon(C.shoeSole,   gm);
  const silverMat  = new THREE.MeshBasicMaterial({ color: C.silver });
  const laceMat    = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
  const whtBasic   = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });

  // ── SHOES ──────────────────────────────────────────────────────────────────
  for (const s of [-1, 1]) {
    const sg = new THREE.Group();
    sg.position.set(s * 0.115, -1.065, 0.045);
    root.add(sg);

    // Main shoe body
    const body = mesh(sg, new THREE.BoxGeometry(0.178, 0.20, 0.395), shoeMat, [0,0,0], true);
    outline(body, 0.014);

    // Toe box
    mesh(sg, new THREE.BoxGeometry(0.175, 0.115, 0.080), shoeMat, [0, -0.040, 0.228]);

    // White rubber sole
    const sole = mesh(sg, new THREE.BoxGeometry(0.190, 0.058, 0.415), soleMat, [0, -0.125, 0]);
    outline(sole, 0.010);

    // High-top collar
    const collar = mesh(sg, new THREE.CylinderGeometry(0.090, 0.090, 0.068, 16), shoeMat, [0, 0.128, 0]);
    outline(collar, 0.011);

    // Side circle badge (like Converse star)
    const badge = mesh(sg, new THREE.CircleGeometry(0.028, 16), whtBasic, [s > 0 ? 0.093 : -0.093, 0.005, 0]);
    badge.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2;

    // Laces
    for (let i = 0; i < 4; i++) {
      mesh(sg, new THREE.BoxGeometry(0.152, 0.008, 0.008), laceMat, [0, -0.042 + i * 0.047, 0.200]);
    }

    // Chain on right shoe only
    if (s === 1) {
      const chain = mesh(sg, new THREE.TorusGeometry(0.048, 0.007, 8, 16), silverMat, [0.093, -0.068, 0]);
      chain.rotation.z = Math.PI / 2;
    }
  }

  // ── SHINS (skin visible below shorts) ────────────────────────────────────
  for (const x of [-0.115, 0.115]) {
    const shin = mesh(root, new THREE.CylinderGeometry(0.058, 0.054, 0.20, 14), skinMat, [x, -0.80, 0]);
    outline(shin, 0.009);
  }

  // ── CARGO SHORTS ──────────────────────────────────────────────────────────
  const shorts = mesh(root, new THREE.CylinderGeometry(0.228, 0.198, 0.54, 16), shortsMat, [0, -0.48, 0], true);
  outline(shorts, 0.011);

  // Waistband
  mesh(root, new THREE.CylinderGeometry(0.235, 0.232, 0.058, 16), toon(0xA87A30, gm), [0, -0.205, 0]);

  // Cargo pockets (sides + front)
  const pocketData: [number, number, number][] = [
    [-0.200, -0.460,  0.072],
    [ 0.200, -0.460,  0.072],
    [-0.080, -0.560,  0.218],
    [ 0.080, -0.560,  0.218],
  ];
  for (const [x, y, z] of pocketData) {
    mesh(root, new THREE.BoxGeometry(0.110, 0.120, 0.022), shortsShMat, [x, y, z]);
    mesh(root, new THREE.BoxGeometry(0.110, 0.036, 0.024), toon(0xC09848, gm), [x, y + 0.077, z + 0.001]);
  }

  // ── BLACK T-SHIRT ──────────────────────────────────────────────────────────
  const torso = mesh(root, new THREE.CylinderGeometry(0.208, 0.198, 0.545, 16), shirtMat, [0, 0.09, 0], true);
  outline(torso, 0.011);
  refs.torso = torso;

  // Hem strip
  mesh(root, new THREE.CylinderGeometry(0.218, 0.210, 0.056, 16), shirtMat, [0, -0.175, 0]);

  // Pokéball decal (flat circle on front)
  mesh(root, new THREE.CircleGeometry(0.116, 32),
    new THREE.MeshBasicMaterial({ map: makePokeballTex() }),
    [0, 0.112, 0.212]);

  // ── SHIRT SLEEVES & ARMS ───────────────────────────────────────────────────
  for (const s of [-1, 1]) {
    const xB = s * 0.250;

    // Sleeve
    const sl = mesh(root, new THREE.CylinderGeometry(0.075, 0.065, 0.160, 12), shirtMat, [xB, 0.196, 0], true);
    sl.rotation.z = s * -0.10; outline(sl, 0.009);

    // Upper arm
    const ua = mesh(root, new THREE.CylinderGeometry(0.058, 0.052, 0.205, 12), skinMat, [xB, 0.055, 0], true);
    ua.rotation.z = s * -0.10; outline(ua, 0.009);

    // Lower arm — right arm angled inward (hand-in-pocket)
    const lrz = s === 1 ?  0.40 : s * -0.12;
    const lrx = s === 1 ?  0.25 : 0;
    const la  = mesh(root, new THREE.CylinderGeometry(0.046, 0.040, 0.34, 12), skinMat,
      [xB + s * 0.020, s === 1 ? -0.075 : -0.098, s === 1 ? 0.058 : 0], true);
    la.rotation.set(lrx, 0, lrz); outline(la, 0.009);

    // Hand
    const hd = mesh(root, new THREE.SphereGeometry(0.050, 14, 14), skinMat,
      [xB + s * 0.024, s === 1 ? -0.218 : -0.258, s === 1 ? 0.118 : 0]);
    hd.scale.set(1.0, 0.78, 0.90); outline(hd, 0.009);
  }

  // ── NECK ──────────────────────────────────────────────────────────────────
  const neck = mesh(root, new THREE.CylinderGeometry(0.058, 0.072, 0.118, 16), skinMat, [0, 0.418, 0]);
  outline(neck, 0.008);
  refs.neck = neck;

  // ── NECKLACE ──────────────────────────────────────────────────────────────
  const necklace = mesh(root, new THREE.TorusGeometry(0.072, 0.008, 8, 32), silverMat, [0, 0.386, 0]);
  necklace.rotation.x = 0.30;

  // ── HEAD GROUP ─────────────────────────────────────────────────────────────
  const headG = new THREE.Group();
  headG.position.y = 0.648;
  root.add(headG);
  refs.headGroup = headG;

  // Main head
  const head = mesh(headG, new THREE.SphereGeometry(0.190, 36, 36), skinMat, [0,0,0], true);
  head.scale.set(1.0, 0.955, 0.975);
  outline(head, 0.012);
  refs.head = head;

  // Soft cheek blush
  for (const bx of [-0.122, 0.122]) {
    const blush = mesh(headG, new THREE.SphereGeometry(0.056, 16, 16),
      toon(C.blush, gm, { transparent: true, opacity: 0.48 }), [bx, -0.038, 0.166]);
    blush.scale.z = 0.28;
  }

  // ── EYES ────────────────────────────────────────────────────────────────
  for (const [ex, ey] of [[-0.075, 0.040], [0.075, 0.040]]) {
    const eg = new THREE.Group();
    eg.position.set(ex, ey, 0.157);
    headG.add(eg);

    // White sclera
    mesh(eg, new THREE.SphereGeometry(0.044, 22, 22), new THREE.MeshBasicMaterial({ color: C.eyeWhite }));

    // Iris
    const iris = mesh(eg, new THREE.SphereGeometry(0.030, 18, 18), new THREE.MeshBasicMaterial({ color: C.eyeIris }), [0, 0, 0.018]);

    // Pupil
    mesh(eg, new THREE.SphereGeometry(0.020, 14, 14), new THREE.MeshBasicMaterial({ color: C.eyePupil }), [0, 0, 0.028]);

    // Highlight reflection
    mesh(eg, new THREE.SphereGeometry(0.009, 8, 8), new THREE.MeshBasicMaterial({ color: C.eyeHL }), [0.015, 0.013, 0.040]);

    // Small second highlight
    mesh(eg, new THREE.SphereGeometry(0.005, 6, 6), new THREE.MeshBasicMaterial({ color: C.eyeHL }), [-0.016, -0.010, 0.042]);

    // Eyelid shadow (lower)
    const lid = mesh(eg, new THREE.SphereGeometry(0.047, 16, 8, 0, Math.PI*2, Math.PI*0.55, Math.PI*0.15), skinShMat);
    lid.rotation.x = 0.22; lid.position.z = -0.002;
  }

  // ── EYEBROWS ─────────────────────────────────────────────────────────────
  for (const [bx, brz] of [[-0.077, 0.18], [0.077, -0.18]]) {
    const brow = mesh(headG, new THREE.CapsuleGeometry(0.022, 0.044, 4, 8), hairMat, [bx, 0.100, 0.178]);
    brow.scale.set(1.0, 0.36, 0.46);
    brow.rotation.z = brz;
  }

  // ── NOSE ─────────────────────────────────────────────────────────────────
  const nose = mesh(headG, new THREE.SphereGeometry(0.018, 12, 12), skinShMat, [0, -0.026, 0.186]);
  nose.scale.set(1.1, 0.84, 0.82);

  // ── MOUTH (gentle smile arc) ──────────────────────────────────────────────
  const smile = mesh(headG,
    new THREE.TorusGeometry(0.038, 0.0085, 8, 16, Math.PI * 0.66),
    toon(C.mouth, gm), [0, -0.080, 0.175]);
  smile.rotation.set(0.22, 0, Math.PI + 0.48);

  // ── HAIR (brown bob) ──────────────────────────────────────────────────────
  // Main cap
  const hairCap = mesh(headG,
    new THREE.SphereGeometry(0.202, 32, 32, 0, Math.PI*2, 0, Math.PI*0.54),
    hairMat, [0, 0.004, 0], true);
  outline(hairCap, 0.012);

  // Bob sides — two soft volume pieces
  for (const [bsx, bsrz] of [[-0.122, 0.12], [0.122, -0.12]]) {
    const side = mesh(headG, new THREE.SphereGeometry(0.148, 26, 26), hairMat, [bsx, -0.072, 0.005], true);
    side.scale.set(0.60, 1.10, 0.68); side.rotation.z = bsrz; outline(side, 0.010);
  }

  // Front bangs
  const bangs = mesh(headG, new THREE.SphereGeometry(0.150, 28, 18), hairMat, [0.008, 0.132, 0.150]);
  bangs.scale.set(1.08, 0.42, 0.60); outline(bangs, 0.009);

  // Back volume (slight extension)
  const back = mesh(headG, new THREE.SphereGeometry(0.140, 20, 20), hairMat, [0, -0.080, -0.068]);
  back.scale.set(0.88, 0.82, 0.72);

  // Messy top strands
  for (const [mx, my, mrz] of [[0.055, 0.205, 0.30], [-0.042, 0.218, -0.22]]) {
    const s = mesh(headG, new THREE.SphereGeometry(0.055, 12, 12), hairMat, [mx, my, -0.040]);
    s.scale.set(0.90, 0.62, 0.88); s.rotation.z = mrz;
  }

  // 3/4 angle rotation
  root.rotation.y = -Math.PI / 10;

  return { root, refs };
}

// ── Main scene setup ──────────────────────────────────────────────────────────

export interface CartoonSceneHandle {
  dispose(): void;
  exportPNG(rw?: number, rh?: number): string;
  exportGLB(): Promise<string>;
  resetCamera(): void;
  rotateLeft(): void;
  rotateRight(): void;
  zoomIn(): void;
  zoomOut(): void;
}

export async function buildCartoonScene(
  canvas: HTMLCanvasElement,
  onStep?: (msg: string) => void
): Promise<CartoonSceneHandle> {
  onStep?.('Renderer тохируулж байна...');
  await wait(60);

  const W = canvas.parentElement?.clientWidth  || 620;
  const H = canvas.parentElement?.clientHeight || 700;
  canvas.width  = W;
  canvas.height = H;

  // ── Renderer ─────────────────────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled  = true;
  renderer.shadowMap.type     = THREE.PCFSoftShadowMap;
  renderer.toneMapping        = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure= 1.05;

  const scene  = new THREE.Scene();
  scene.background = new THREE.Color(0xC8C8C8);

  const camera = new THREE.PerspectiveCamera(38, W / H, 0.01, 100);
  camera.position.set(0.28, 0.22, 3.85);
  camera.lookAt(0, 0.12, 0);

  // ── 3-Point Lighting ─────────────────────────────────────────────────────
  onStep?.('Гэрэлтүүлэг тохируулж байна...');
  await wait(50);

  scene.add(new THREE.AmbientLight(0xFFFFFF, 0.32));

  // Key: warm, strong, upper-right-front
  const key = new THREE.DirectionalLight(0xFFF5D5, 1.60);
  key.position.set(3, 5.5, 3.5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near   = 0.5;
  key.shadow.camera.far    = 22;
  key.shadow.camera.left   = key.shadow.camera.bottom = -3;
  key.shadow.camera.right  = key.shadow.camera.top    =  3;
  key.shadow.radius        = 3.5;
  scene.add(key);

  // Fill: cool, softer, left
  const fill = new THREE.DirectionalLight(0xD2E5FF, 0.50);
  fill.position.set(-3, 2.5, 2.0);
  scene.add(fill);

  // Rim: warm accent, behind-right
  const rim = new THREE.DirectionalLight(0xFFEEDD, 0.75);
  rim.position.set(1, 4, -4.5);
  scene.add(rim);

  // ── Ground planes ─────────────────────────────────────────────────────────
  const shadowGround = new THREE.Mesh(
    new THREE.CircleGeometry(3.5, 64),
    new THREE.ShadowMaterial({ opacity: 0.22 })
  );
  shadowGround.rotation.x = -Math.PI / 2;
  shadowGround.position.y = -1.20;
  shadowGround.receiveShadow = true;
  scene.add(shadowGround);

  const groundDisc = new THREE.Mesh(
    new THREE.CircleGeometry(1.15, 64),
    new THREE.MeshBasicMaterial({ color: 0xB8B8B8, transparent: true, opacity: 0.42 })
  );
  groundDisc.rotation.x = -Math.PI / 2;
  groundDisc.position.set(0, -1.195, 0);
  scene.add(groundDisc);

  // ── Build character ────────────────────────────────────────────────────────
  onStep?.('Character загварлаж байна...');
  await wait(80);

  const gm = makeToonGrad(4);
  const { root, refs } = buildCharacter(gm);
  scene.add(root);

  onStep?.('Анимейшн & орбит тохируулж байна...');
  await wait(60);

  // ── Orbit control ─────────────────────────────────────────────────────────
  let drag = false, pX = 0, pY = 0;
  let theta = -0.28, phi = 1.50, radius = 3.85;

  function applyCamera() {
    camera.position.set(
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi) + 0.22,
      radius * Math.sin(phi) * Math.cos(theta)
    );
    camera.lookAt(0, 0.12, 0);
  }
  applyCamera();

  canvas.style.cursor = 'grab';
  canvas.onmousedown  = (e: MouseEvent) => { drag = true; pX = e.clientX; pY = e.clientY; canvas.style.cursor = 'grabbing'; };
  canvas.onmousemove  = (e: MouseEvent) => {
    if (!drag) return;
    theta -= (e.clientX - pX) * 0.011; pX = e.clientX;
    phi    = clamp(phi + (e.clientY - pY) * 0.009, 0.55, 2.45); pY = e.clientY;
    applyCamera();
  };
  canvas.onmouseup = canvas.onmouseleave = () => { drag = false; canvas.style.cursor = 'grab'; };
  canvas.onwheel   = (e: WheelEvent) => {
    e.preventDefault();
    radius = clamp(radius + e.deltaY * 0.005, 1.6, 7.5);
    applyCamera();
  };

  let lp = 0;
  canvas.ontouchstart = (e: TouchEvent) => {
    if (e.touches.length === 1) { drag = true; pX = e.touches[0].clientX; pY = e.touches[0].clientY; }
    if (e.touches.length === 2)  lp = pinchD(e);
  };
  canvas.ontouchmove  = (e: TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1 && drag) {
      theta -= (e.touches[0].clientX - pX) * 0.013; pX = e.touches[0].clientX;
      phi    = clamp(phi + (e.touches[0].clientY - pY) * 0.011, 0.55, 2.45); pY = e.touches[0].clientY;
      applyCamera();
    }
    if (e.touches.length === 2) {
      const d = pinchD(e);
      radius = clamp(radius - (d - lp) * 0.011, 1.6, 7.5);
      lp = d; applyCamera();
    }
  };
  canvas.ontouchend = () => { drag = false; };

  // ── Breathing + head-bob animation ────────────────────────────────────────
  let animId: number;
  const t0 = Date.now();

  function animate() {
    animId = requestAnimationFrame(animate);
    const t  = (Date.now() - t0) * 0.001;
    const b  = Math.sin(t * 1.15) * 0.011;    // breath
    const hb = Math.sin(t * 0.55) * 0.013;    // head bob sway

    if (refs.torso) {
      refs.torso.scale.set(1 + b * 0.35, 1 + b, 1 + b * 0.35);
      refs.torso.position.y = 0.090 + b * 0.30;
    }
    if (refs.neck)      refs.neck.position.y      = 0.418 + b * 0.30;
    if (refs.headGroup) {
      refs.headGroup.position.y = 0.648 + b * 0.30 + Math.sin(t * 1.15) * 0.005;
      refs.headGroup.rotation.z = hb;
    }

    renderer.render(scene, camera);
  }
  animate();

  // ── Resize handler ─────────────────────────────────────────────────────────
  const onResize = () => {
    const w = canvas.parentElement?.clientWidth  || W;
    const h = canvas.parentElement?.clientHeight || H;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', onResize);

  // ── Public API ─────────────────────────────────────────────────────────────
  return {
    dispose() {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      canvas.onmousedown = canvas.onmousemove = canvas.onmouseup =
        canvas.onmouseleave = canvas.onwheel =
        canvas.ontouchstart = canvas.ontouchmove = canvas.ontouchend = null;
      renderer.dispose();
    },

    exportPNG(rw: number = 2048, rh: number = 2048): string {
      renderer.setSize(rw, rh);
      camera.aspect = rw / rh; camera.updateProjectionMatrix();
      renderer.render(scene, camera);
      const data = canvas.toDataURL('image/png');
      const cw = canvas.parentElement?.clientWidth  || W;
      const ch = canvas.parentElement?.clientHeight || H;
      renderer.setSize(cw, ch);
      camera.aspect = cw / ch; camera.updateProjectionMatrix();
      return data;
    },

    async exportGLB(): Promise<string> {
      const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');
      return new Promise((res, rej) => {
        new GLTFExporter().parse(
          root,
          (glb: any) => res(URL.createObjectURL(new Blob([glb], { type: 'model/gltf-binary' }))),
          rej,
          { binary: true }
        );
      });
    },

    resetCamera() { theta = -0.28; phi = 1.50; radius = 3.85; applyCamera(); },
    rotateLeft()  { theta -= 0.30; applyCamera(); },
    rotateRight() { theta += 0.30; applyCamera(); },
    zoomIn()      { radius = clamp(radius - 0.45, 1.6, 7.5); applyCamera(); },
    zoomOut()     { radius = clamp(radius + 0.45, 1.6, 7.5); applyCamera(); },
  };
}

// ── Tiny helpers ──────────────────────────────────────────────────────────────

const wait   = (ms: number): Promise<void> => new Promise(r => setTimeout(r, ms));
const clamp  = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));
const pinchD = (e: TouchEvent): number => Math.hypot(
  e.touches[0].clientX - e.touches[1].clientX,
  e.touches[0].clientY - e.touches[1].clientY
);
