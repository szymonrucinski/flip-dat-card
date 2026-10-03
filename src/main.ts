import * as THREE from 'three';
import { Card } from './Card';
import { CardGenerator } from './CardGenerator';
import { Player } from './Player';

// ---------------------------------------------------------------- renderer
const canvas = document.getElementById('scene') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.shadowMap.autoUpdate = false; // updated once per frame, not once per pass

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, 0.5, 80);
camera.layers.enable(1); // layer 1 = ink hulls, hidden from the normal pass
const CAM_DIR = new THREE.Vector3(0, 1, 1.02).normalize();
const CAM_TARGET = new THREE.Vector3(0, -0.3, 0.6);
let camDist = 12;
let shake = 0;

// Cel shading: the toon material looks lighting up in this 3-texel ramp.
// NearestFilter means no blending between texels, so light falls into 3 hard bands.
const bands = new THREE.DataTexture(new Uint8Array([90, 175, 255]), 3, 1, THREE.RedFormat);
bands.minFilter = bands.magFilter = THREE.NearestFilter;
bands.needsUpdate = true;
const toon = (p: THREE.MeshToonMaterialParameters) => new THREE.MeshToonMaterial({ gradientMap: bands, ...p });
const inkMat = new THREE.MeshBasicMaterial({ color: 0x140c0a, side: THREE.BackSide });

// ---------------------------------------------------------------- helpers
function roundedRect(w: number, h: number, r: number) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

// Shape/Extrude geometries get UVs in shape units; stretch them to 0..1 so a texture covers the shape.
function fitUVs<G extends THREE.BufferGeometry>(g: G): G {
  g.computeBoundingBox();
  const b = g.boundingBox!, p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    uv.setXY(i, (p.getX(i) - b.min.x) / (b.max.x - b.min.x), (p.getY(i) - b.min.y) / (b.max.y - b.min.y));
  }
  return g;
}

function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}

const loader = new THREE.TextureLoader();
const texCache = new Map<string, THREE.Texture>();
function tex(url: string) {
  let t = texCache.get(url);
  if (!t) {
    t = loader.load(url);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    texCache.set(url, t);
  }
  return t;
}
function dropTex(url: string) {
  texCache.get(url)?.dispose();
  texCache.delete(url);
}

function shadowed<T extends THREE.Object3D>(o: T): T {
  o.traverse((m) => { if ((m as THREE.Mesh).isMesh && m.layers.isEnabled(0)) m.castShadow = m.receiveShadow = true; });
  return o;
}

// ---------------------------------------------------------------- table
const TW = 15, TH = 10, TR = 4.5;
const SLOT_NOW = new THREE.Vector3(-1.55, 0, 0.35);
const SLOT_NEXT = new THREE.Vector3(1.55, 0, 0.35);
const DECK_POS = new THREE.Vector3(-5.1, 0, 0);
const PILE_POS = new THREE.Vector3(5.1, 0, 0);
const CW = 2.4, CH = CW * 726 / 500, CD = 0.03, STEP = 0.012, CR = 0.13, INK = 0.055, INK_Z = 0.01;

function feltTexture() {
  const W = 2048, H = Math.round(W * TH / TW), u = W / TW;
  const P = (x: number, z: number): [number, number] => [(x + TW / 2) * u, (z + TH / 2) * u];
  return canvasTex(W, H, (g) => {
    const grad = g.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, W * 0.62);
    grad.addColorStop(0, '#1db386'); grad.addColorStop(1, '#0a6e55');
    g.fillStyle = grad; g.fillRect(0, 0, W, H);
    // felt speckle so big areas aren't dead flat
    for (let i = 0; i < 9000; i++) {
      g.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)';
      g.fillRect(Math.random() * W, Math.random() * H, 3, 3);
    }
    const inset = 0.45 * u;
    g.lineWidth = 16; g.strokeStyle = '#140c0a';
    g.beginPath(); g.roundRect(inset, inset, W - 2 * inset, H - 2 * inset, (TR - 0.45) * u); g.stroke();
    g.lineWidth = 9; g.strokeStyle = '#ffd23f'; g.stroke();

    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `${1.15 * u}px Bangers, Impact, sans-serif`;
    g.fillStyle = 'rgba(5,40,30,0.45)';
    g.fillText('FLIP DAT CARD', ...P(0, -2.3));
    g.font = `${0.55 * u}px Bangers, Impact, sans-serif`;
    g.fillText('HIGHER OR LOWER?', ...P(-1.1, 3.25));

    const slots: [THREE.Vector3, string][] = [[SLOT_NOW, 'NOW'], [SLOT_NEXT, 'NEXT'], [DECK_POS, 'DECK'], [PILE_POS, 'PILE']];
    for (const [s, label] of slots) {
      const [x, y] = P(s.x - CW / 2 - 0.12, s.z - CH / 2 - 0.12);
      g.setLineDash([26, 18]); g.lineWidth = 8; g.strokeStyle = 'rgba(255,244,214,0.55)';
      g.beginPath(); g.roundRect(x, y, (CW + 0.24) * u, (CH + 0.24) * u, 0.2 * u); g.stroke();
      g.setLineDash([]);
      g.font = `${0.42 * u}px Bangers, Impact, sans-serif`;
      g.fillStyle = 'rgba(255,210,63,0.85)';
      g.fillText(label, ...P(s.x, s.z + CH / 2 + 0.42));
    }
  });
}

function woodTexture(w: number, h: number, base: string, boards: number) {
  return canvasTex(w, h, (g) => {
    for (let i = 0; i < boards; i++) {
      const l = 30 + Math.random() * 10;
      g.fillStyle = `hsl(${22 + Math.random() * 6}, 62%, ${l}%)`;
      g.fillRect(0, (i * h) / boards, w, h / boards);
      g.strokeStyle = 'rgba(40,15,5,0.35)'; g.lineWidth = 2;
      for (let k = 0; k < 5; k++) {
        const y = ((i + Math.random()) * h) / boards;
        g.beginPath(); g.moveTo(0, y);
        g.bezierCurveTo(w * 0.3, y + 6, w * 0.6, y - 6, w, y + 3); g.stroke();
      }
      g.fillStyle = '#140c0a'; g.fillRect(0, (i * h) / boards, w, 4);
    }
    g.fillStyle = base; g.globalAlpha = 0.15; g.fillRect(0, 0, w, h);
  });
}

function buildTable() {
  const table = new THREE.Group();

  const felt = new THREE.Mesh(
    fitUVs(new THREE.ExtrudeGeometry(roundedRect(TW, TH, TR), { depth: 0.3, bevelEnabled: false, curveSegments: 24 })),
    [toon({ map: feltTexture() }), toon({ color: 0x0a5e48 })],
  );
  felt.rotation.x = -Math.PI / 2;
  felt.position.y = -0.3;
  table.add(felt);

  // padded leather rail around the felt
  const railShape = roundedRect(TW + 1.7, TH + 1.7, TR + 0.85);
  railShape.holes.push(roundedRect(TW, TH, TR));
  const rail = new THREE.Mesh(
    new THREE.ExtrudeGeometry(railShape, { depth: 0.55, bevelEnabled: true, bevelSize: 0.2, bevelThickness: 0.22, bevelSegments: 3, curveSegments: 32 }),
    toon({ color: 0x7a2416 }),
  );
  rail.rotation.x = -Math.PI / 2;
  rail.position.y = -0.45;
  table.add(rail);

  const apron = new THREE.Mesh(
    new THREE.ExtrudeGeometry(roundedRect(TW + 1.3, TH + 1.3, TR + 0.65), { depth: 0.9, bevelEnabled: false, curveSegments: 32 }),
    toon({ map: woodTexture(512, 64, '#6b3a1f', 2) }),
  );
  apron.rotation.x = -Math.PI / 2;
  apron.position.y = -1.5;
  table.add(apron);

  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 2.4, 3, 24), toon({ color: 0x4a2412 }));
  pedestal.position.y = -3;
  table.add(pedestal);

  const floorTex = woodTexture(512, 512, '#5a3018', 6);
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(10, 10);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), toon({ map: floorTex }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -4.5;
  table.add(floor);

  return shadowed(table);
}

// ---------------------------------------------------------------- chips & dice
const CHIP_H = 0.12;
const chipGeo = new THREE.CylinderGeometry(0.42, 0.42, CHIP_H, 32);
const chipMats = new Map<string, THREE.Material[]>();
function chipMat(color: string) {
  let m = chipMats.get(color);
  if (!m) {
    const side = canvasTex(256, 32, (g) => {
      g.fillStyle = color; g.fillRect(0, 0, 256, 32);
      g.fillStyle = '#fff4d6';
      for (let i = 0; i < 6; i++) g.fillRect(i * 42.6 + 8, 0, 18, 32);
    });
    const top = canvasTex(128, 128, (g) => {
      g.fillStyle = color; g.fillRect(0, 0, 128, 128);
      g.strokeStyle = '#fff4d6'; g.lineWidth = 10; g.setLineDash([14, 12]);
      g.beginPath(); g.arc(64, 64, 52, 0, Math.PI * 2); g.stroke();
      g.setLineDash([]); g.lineWidth = 4;
      g.beginPath(); g.arc(64, 64, 30, 0, Math.PI * 2); g.stroke();
    });
    m = [toon({ map: side }), toon({ map: top }), toon({ map: top })];
    chipMats.set(color, m);
  }
  return m;
}
const CHIP_COLORS = ['#e63946', '#1d4ed8', '#ffd23f', '#16a34a', '#1f1f1f'];

function chip(color: string) {
  const c = new THREE.Mesh(chipGeo, chipMat(color));
  c.rotation.y = Math.random() * Math.PI;
  return shadowed(c);
}

function chipStack(x: number, z: number, n: number, color: string) {
  for (let i = 0; i < n; i++) {
    const c = chip(color);
    c.position.set(x + (Math.random() - 0.5) * 0.05, CHIP_H * (i + 0.5), z + (Math.random() - 0.5) * 0.05);
    scene.add(c);
  }
}

function die() {
  const face = (n: number) => canvasTex(128, 128, (g) => {
    g.fillStyle = '#fff4d6'; g.fillRect(0, 0, 128, 128);
    g.fillStyle = '#e63946';
    const pip: Record<number, [number, number][]> = {
      1: [[64, 64]], 2: [[34, 34], [94, 94]], 3: [[30, 30], [64, 64], [98, 98]],
      4: [[34, 34], [94, 34], [34, 94], [94, 94]], 5: [[30, 30], [98, 30], [64, 64], [30, 98], [98, 98]],
      6: [[34, 28], [94, 28], [34, 64], [94, 64], [34, 100], [94, 100]],
    };
    for (const [x, y] of pip[n]) { g.beginPath(); g.arc(x, y, 12, 0, Math.PI * 2); g.fill(); }
  });
  return shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), [1, 6, 2, 5, 3, 4].map((n) => toon({ map: face(n) }))));
}

// ---------------------------------------------------------------- cards
const cardShape = roundedRect(CW, CH, CR);
const faceGeo = fitUVs(new THREE.ShapeGeometry(cardShape, 6));
const bodyGeo = new THREE.ExtrudeGeometry(cardShape, { depth: CD, bevelEnabled: false, curveSegments: 6 }).translate(0, 0, -CD / 2);
const bodyMat = toon({ color: 0xf3ead2 });
// Inverted hull: a slightly bigger copy of the card drawn inside-out in black.
// Only its far/back faces render, so it peeks out as a thick ink line around the card.
const hullGeo = new THREE.ExtrudeGeometry(roundedRect(CW + 2 * INK, CH + 2 * INK, CR + INK), { depth: CD + 2 * INK_Z, bevelEnabled: false, curveSegments: 6 })
  .translate(0, 0, -CD / 2 - INK_Z);
const REST_Y = CD / 2 + INK_Z + 0.004;

type CardObj = { card: Card; group: THREE.Group };

function cardMesh(card: Card): CardObj {
  const group = new THREE.Group();
  const front = new THREE.Mesh(faceGeo, toon({ map: tex(card.getImg()), alphaTest: 0.5 }));
  front.position.z = CD / 2 + 0.001;
  const back = new THREE.Mesh(faceGeo, toon({ map: tex(card.getBackImg()), alphaTest: 0.5 }));
  back.rotation.y = Math.PI;
  back.position.z = -CD / 2 - 0.001;
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  const hull = new THREE.Mesh(hullGeo, inkMat);
  hull.layers.set(1);
  group.add(front, back, body, hull);
  shadowed(group);
  return { card, group };
}

function disposeCard(c: CardObj) {
  scene.remove(c.group);
  c.group.traverse((m) => {
    const mat = (m as THREE.Mesh).material;
    if (mat instanceof THREE.MeshToonMaterial && mat !== bodyMat) mat.dispose();
  });
  dropTex(c.card.getImg());
}

// A stack of cards drawn as one block: cheap no matter how many cards it holds.
const unitBodyGeo = new THREE.ExtrudeGeometry(cardShape, { depth: 1, bevelEnabled: false, curveSegments: 6 });
const unitHullGeo = new THREE.ExtrudeGeometry(roundedRect(CW + 2 * INK, CH + 2 * INK, CR + INK), { depth: 1, bevelEnabled: false, curveSegments: 6 });
// side texture of a pile: a light card edge with a thin dark gap, repeated once per card
const edgeTex = canvasTex(4, 8, (g) => {
  g.fillStyle = '#f3ead2'; g.fillRect(0, 0, 4, 8);
  g.fillStyle = '#b9a98a'; g.fillRect(0, 7, 4, 1);
});
edgeTex.wrapS = edgeTex.wrapT = THREE.RepeatWrapping;
edgeTex.magFilter = THREE.NearestFilter;
function pile(pos: THREE.Vector3, withTop: boolean) {
  const g = new THREE.Group();
  g.position.copy(pos);
  g.rotation.x = -Math.PI / 2;
  const edges = edgeTex.clone();
  const body = new THREE.Mesh(unitBodyGeo, [bodyMat, toon({ map: edges })]);
  const hull = new THREE.Mesh(unitHullGeo, inkMat);
  hull.layers.set(1);
  const top = new THREE.Mesh(faceGeo, toon({ alphaTest: 0.5 }));
  top.visible = withTop;
  g.add(body, hull, top);
  shadowed(g);
  scene.add(g);
  return {
    top: top.material as THREE.MeshToonMaterial,
    setHeight(h: number) {
      g.visible = h > 0;
      body.scale.z = Math.max(h, 1e-3);
      edges.repeat.y = h / STEP;
      hull.scale.z = h + 2 * INK_Z;
      hull.position.z = -INK_Z;
      top.position.z = h + 0.001;
    },
  };
}

// ---------------------------------------------------------------- lights
scene.add(new THREE.HemisphereLight(0xffe2b8, 0x3b2216, 0.9));
const spot = new THREE.SpotLight(0xffd9a0, 6, 0, 0.5, 0.6, 0);
spot.position.set(-3.5, 13, 5);
spot.target.position.set(0, 0, 0.3);
spot.castShadow = true;
spot.shadow.mapSize.set(2048, 2048);
spot.shadow.camera.near = 4;
spot.shadow.camera.far = 30;
spot.shadow.bias = -0.0004;
scene.add(spot, spot.target);
const rim = new THREE.DirectionalLight(0x7fb7ff, 1.6);
rim.position.set(9, 5, -8);
scene.add(rim);

// ---------------------------------------------------------------- post: ink + hatching
// Pass 1 renders colour+depth, pass 2 renders view-space normals. The final shader
// draws ink wherever depth or normals jump (silhouettes, creases) and hatches dark areas.
const rtColor = new THREE.WebGLRenderTarget(1, 1, { samples: 4, depthTexture: new THREE.DepthTexture(1, 1) });
const rtNormal = new THREE.WebGLRenderTarget(1, 1, { samples: 4 });
const normalMat = new THREE.MeshNormalMaterial();
const post = new THREE.ShaderMaterial({
  uniforms: {
    tColor: { value: rtColor.texture },
    tDepth: { value: rtColor.depthTexture },
    tNormal: { value: rtNormal.texture },
    texel: { value: new THREE.Vector2() },
    near: { value: camera.near },
    far: { value: camera.far },
    pr: { value: 1 },
  },
  vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
  fragmentShader: /* glsl */ `
    #include <packing>
    uniform sampler2D tColor, tDepth, tNormal;
    uniform vec2 texel;
    uniform float near, far, pr;
    varying vec2 vUv;
    float viewZ(vec2 uv) { return -perspectiveDepthToViewZ(texture2D(tDepth, uv).x, near, far); }
    vec3 nrm(vec2 uv) { return texture2D(tNormal, uv).xyz * 2.0 - 1.0; }
    float hatch(vec2 p, float dir) {
      float d = abs(fract((p.x + dir * p.y) / 6.0) - 0.5) * 6.0;
      return 1.0 - smoothstep(0.55, 1.3, d);
    }
    void main() {
      vec2 o = texel * 1.6 * pr;
      vec2 ox = vec2(o.x, 0.0), oy = vec2(0.0, o.y);
      float d = viewZ(vUv);
      // Laplacian of depth: zero on flat or tilted planes, spikes at silhouettes
      float lap = abs(viewZ(vUv - ox) + viewZ(vUv + ox) + viewZ(vUv - oy) + viewZ(vUv + oy) - 4.0 * d) / d;
      float depthEdge = smoothstep(0.012, 0.035, lap);
      vec3 n = nrm(vUv);
      float nd = distance(n, nrm(vUv - ox)) + distance(n, nrm(vUv + ox)) + distance(n, nrm(vUv - oy)) + distance(n, nrm(vUv + oy));
      float normalEdge = smoothstep(0.5, 0.9, nd);
      float edge = max(depthEdge, normalEdge);

      vec3 col = linearToOutputTexel(texture2D(tColor, vUv)).rgb;
      float l = dot(col, vec3(0.299, 0.587, 0.114));
      col = clamp(mix(vec3(l), col, 1.3), 0.0, 1.0); // punchier colours

      vec2 p = gl_FragCoord.xy / pr;
      float h = smoothstep(0.42, 0.24, l) * hatch(p, 1.0);
      h = max(h, smoothstep(0.24, 0.1, l) * hatch(p, -1.0));
      col *= 1.0 - 0.5 * h;

      float v = length((vUv - 0.5) * vec2(1.1, 1.0));
      col *= mix(1.0, 0.45, smoothstep(0.35, 0.85, v));
      col = mix(col, vec3(0.08, 0.05, 0.04), edge);
      gl_FragColor = vec4(col, 1.0);
    }`,
});
const postScene = new THREE.Scene();
postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post));
const postCam = new THREE.OrthographicCamera();

function render() {
  renderer.shadowMap.needsUpdate = true;
  renderer.setRenderTarget(rtColor);
  renderer.render(scene, camera);

  scene.overrideMaterial = normalMat;
  camera.layers.disable(1);
  renderer.setRenderTarget(rtNormal);
  renderer.render(scene, camera);
  camera.layers.enable(1);
  scene.overrideMaterial = null;

  renderer.setRenderTarget(null);
  renderer.render(postScene, postCam);
}

function resize() {
  const w = innerWidth, h = innerHeight, pr = Math.min(devicePixelRatio, 2);
  renderer.setPixelRatio(pr);
  renderer.setSize(w, h, false);
  rtColor.setSize(w * pr, h * pr);
  rtNormal.setSize(w * pr, h * pr);
  post.uniforms.texel.value.set(1 / (w * pr), 1 / (h * pr));
  post.uniforms.pr.value = pr;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  // keep the play area (deck..pile, or just the two cards on portrait) in frame
  const fitW = camera.aspect < 1 ? 6.6 : 16.5;
  const halfFovX = Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
  camDist = Math.max(11.5, fitW / 2 / Math.tan(halfFovX));
}

// ---------------------------------------------------------------- tweening
type Tween = { t0: number; dur: number; step: (k: number) => void; done: () => void };
const tweens: Tween[] = [];
const animate = (dur: number, step: (k: number) => void) =>
  new Promise<void>((done) => tweens.push({ t0: performance.now(), dur, step, done }));
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const easeInOut = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2);
const bounce = (k: number) => {
  const n = 7.5625, d = 2.75;
  if (k < 1 / d) return n * k * k;
  if (k < 2 / d) return n * (k -= 1.5 / d) * k + 0.75;
  if (k < 2.5 / d) return n * (k -= 2.25 / d) * k + 0.9375;
  return n * (k -= 2.625 / d) * k + 0.984375;
};

// Move a card along an arc, optionally flipping it around its long edge on the way.
function toss(c: CardObj, to: THREE.Vector3, opts: { dur: number; lift: number; flipTo?: number; yaw?: number }) {
  const g = c.group;
  const from = g.position.clone(), flip0 = g.rotation.y, yaw0 = g.rotation.z;
  const flip1 = opts.flipTo ?? flip0, yaw1 = opts.yaw ?? yaw0;
  return animate(opts.dur, (k) => {
    const e = easeInOut(k);
    g.position.lerpVectors(from, to, e);
    g.position.y += Math.sin(Math.PI * k) * opts.lift;
    const f = THREE.MathUtils.clamp((k - 0.2) / 0.7, 0, 1);
    g.rotation.y = THREE.MathUtils.lerp(flip0, flip1, easeInOut(f));
    g.rotation.z = THREE.MathUtils.lerp(yaw0, yaw1, e);
  });
}

// ---------------------------------------------------------------- game
const $ = (id: string) => document.getElementById(id)!;
const ui = {
  score: $('score'), scoreBox: $('scoreBox'), deck: $('deck'), popup: $('popup'),
  higher: $('higher') as HTMLButtonElement, lower: $('lower') as HTMLButtonElement,
  gameover: $('gameover'), final: $('final'), restart: $('restart') as HTMLButtonElement,
};

const player = new Player();
const generator = new CardGenerator();
let deckPile: ReturnType<typeof pile>;
let discardPile: ReturnType<typeof pile>;
let current: CardObj | undefined;
let discard: CardObj[] = [];
let discardCount = 0;
let scoreChips: THREE.Mesh[] = [];
let busy = true;

function setBusy(b: boolean) {
  busy = b;
  ui.higher.disabled = ui.lower.disabled = b;
}

function updateHud(bump = false) {
  ui.score.textContent = String(player.score);
  ui.deck.textContent = String(player.deck.length);
  deckPile.setHeight(player.deck.length * STEP);
  if (player.deck[0]) deckPile.top.map = tex(player.deck[0].getBackImg());
  deckPile.top.needsUpdate = true;
  if (bump) {
    ui.scoreBox.classList.remove('bump');
    void ui.scoreBox.offsetWidth;
    ui.scoreBox.classList.add('bump');
  }
}

function popup(text: string, good: boolean) {
  ui.popup.className = 'stroke';
  ui.popup.textContent = text;
  void ui.popup.offsetWidth; // restart the CSS animation
  ui.popup.classList.add(good ? 'good' : 'bad');
}

async function deal(card: Card, slot: THREE.Vector3) {
  const c = cardMesh(card);
  c.group.position.set(DECK_POS.x, player.deck.length * STEP + REST_Y, DECK_POS.z);
  c.group.rotation.set(-Math.PI / 2, Math.PI, 0); // face down
  scene.add(c.group);
  updateHud();
  if (player.deck[0]) tex(player.deck[0].getImg()); // preload the card after this one
  await toss(c, new THREE.Vector3(slot.x, REST_Y, slot.z), { dur: 820, lift: 1.9, flipTo: 0 });
  return c;
}

async function toDiscard(c: CardObj) {
  const y = discardCount * STEP + REST_Y;
  await toss(c, new THREE.Vector3(PILE_POS.x + (Math.random() - 0.5) * 0.25, y, PILE_POS.z + (Math.random() - 0.5) * 0.25), {
    dur: 520, lift: 0.9, yaw: (Math.random() - 0.5) * 0.5,
  });
  discard.push(c);
  discardCount++;
  // only the top few cards stay real meshes; the rest becomes the pile block
  if (discard.length > 4) disposeCard(discard.shift()!);
  discardPile.setHeight((discardCount - discard.length) * STEP);
}

function dropChip() {
  const n = scoreChips.length, s = Math.floor(n / 12);
  const c = chip(CHIP_COLORS[s % CHIP_COLORS.length]);
  const x = 2.9 + (s % 3) * 0.92, z = 2.95 + Math.floor(s / 3) * 0.95, y = CHIP_H * ((n % 12) + 0.5);
  c.position.set(x, y + 4, z);
  scene.add(c);
  scoreChips.push(c);
  animate(650, (k) => { c.position.y = y + 4 * (1 - bounce(k)); });
}

async function guess(statement: 'greater' | 'smaller') {
  if (busy || !current || player.deck.length === 0) return;
  setBusy(true);
  const prev = current;
  const correct = player.nextCardGreater(prev.card, statement);
  const next = await deal(player.getCardFromDeck()!, SLOT_NEXT);
  const pick = (a: string[]) => a[Math.floor(Math.random() * a.length)];
  if (correct) {
    popup(pick(['NICE!', 'BOOM!', 'CRITICAL!', 'SWEET!', 'BADASS!']), true);
    dropChip();
  } else {
    popup(next.card.value === prev.card.value ? 'SAME VALUE!' : pick(['NOPE!', 'OUCH!', 'WHIFF!', 'MISSED!']), false);
    shake = 0.35;
  }
  updateHud(correct);
  await wait(700);
  await Promise.all([toDiscard(prev), toss(next, new THREE.Vector3(SLOT_NOW.x, REST_Y, SLOT_NOW.z), { dur: 560, lift: 0.7 })]);
  current = next;
  if (player.deck.length === 0) {
    ui.final.textContent = `You scored ${player.score} / 51`;
    ui.gameover.hidden = false;
    ui.restart.focus();
    return;
  }
  setBusy(false);
}

async function newGame() {
  setBusy(true);
  ui.gameover.hidden = true;
  for (const c of [...discard, ...(current ? [current] : [])]) disposeCard(c);
  for (const c of scoreChips) scene.remove(c);
  discard = []; scoreChips = []; discardCount = 0; current = undefined;
  discardPile.setHeight(0);
  player.deck = generator.generateCards();
  player.score = 0;
  updateHud();
  current = await deal(player.getCardFromDeck()!, SLOT_NOW);
  setBusy(false);
}

ui.higher.addEventListener('click', () => guess('greater'));
ui.lower.addEventListener('click', () => guess('smaller'));
ui.restart.addEventListener('click', () => newGame());
addEventListener('keydown', (e) => {
  if (!ui.gameover.hidden) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); newGame(); }
    return;
  }
  if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'h') guess('greater');
  if (e.key === 'ArrowDown' || e.key.toLowerCase() === 'l') guess('smaller');
});

// ---------------------------------------------------------------- boot
function loop(now: number) {
  requestAnimationFrame(loop);
  for (const tw of [...tweens]) {
    const k = Math.min(1, (now - tw.t0) / tw.dur);
    tw.step(k);
    if (k === 1) { tweens.splice(tweens.indexOf(tw), 1); tw.done(); }
  }
  const t = now / 1000;
  shake *= 0.9;
  camera.position.copy(CAM_DIR).multiplyScalar(camDist).add(CAM_TARGET);
  camera.position.x += Math.sin(t * 0.35) * 0.35 + (Math.random() - 0.5) * shake;
  camera.position.y += Math.sin(t * 0.5) * 0.15 + (Math.random() - 0.5) * shake;
  camera.lookAt(CAM_TARGET);
  render();
}

async function boot() {
  await document.fonts.load('64px Bangers').catch(() => undefined);
  scene.add(buildTable());
  chipStack(-2.4, -3.75, 7, '#e63946');
  chipStack(-1.5, -3.95, 4, '#1f1f1f');
  chipStack(1.6, -3.8, 9, '#ffd23f');
  chipStack(2.55, -3.6, 5, '#1d4ed8');
  chipStack(2.1, -4.45, 3, '#16a34a');
  const d1 = die(), d2 = die();
  d1.position.set(-4.6, 0.35, -2.7); d1.rotation.set(0, 0.5, 0);
  d2.position.set(-3.75, 0.35, -3.3); d2.rotation.set(Math.PI / 2, 1.1, 0);
  scene.add(d1, d2);
  deckPile = pile(new THREE.Vector3(DECK_POS.x, INK_Z, DECK_POS.z), true);
  discardPile = pile(new THREE.Vector3(PILE_POS.x, INK_Z, PILE_POS.z), false);
  // both card backs are on screen from the first frame: load them before revealing the table
  await Promise.all(['red', 'black'].map(async (c) => {
    const url = `./images/card_back_${c}.png`;
    const t = await loader.loadAsync(url);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    texCache.set(url, t);
  }));
  resize();
  addEventListener('resize', resize);
  requestAnimationFrame(loop);
  $('loading').hidden = true;
  await newGame();
}

boot();
