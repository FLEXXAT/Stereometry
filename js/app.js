const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const norm = (a) => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const lerp = (a, b, t) => add(a, mul(sub(b, a), t));
const avg = (ps) =>
  mul(
    ps.reduce((s, p) => add(s, p), [0, 0, 0]),
    1 / ps.length,
  );
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const $ = (s) => document.querySelector(s);
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
const SUBS = "₀₁₂₃₄₅₆₇₈₉";
const subIdx = (n) =>
  String(n)
    .split("")
    .map((d) => SUBS[+d])
    .join("");
const SHAPES = {
  cube: {
    t: "Куб",
    icon: '<path d="M6 11h13v13H6zM11 6h13v13H11zM6 11l5-5M19 11l5-5M19 24l5-5M6 24l5-5"/>',
    p: [["a", "Ребро", 1, 8, 4]],
  },
  box: {
    t: "Прямоугольный параллелепипед",
    icon: '<path d="M3 13h18v10H3zM9 8h18v10H9zM3 13l6-5M21 13l6-5M21 23l6-5M3 23l6-5"/>',
    p: [
      ["a", "Длина", 1, 8, 5.5],
      ["b", "Ширина", 1, 8, 3.2],
      ["c", "Высота", 1, 8, 3.5],
    ],
  },
  oblique: {
    t: "Наклонный параллелепипед",
    icon: '<path d="M2 24h16l-4-12H-2zM8 21h16l-4-12H4zM2 24l6-3M18 24l6-3M14 12l6-3M-2 12l6-3" transform="translate(4 -1)"/>',
    p: [
      ["a", "Длина", 1, 8, 4.5],
      ["b", "Ширина", 1, 8, 3],
      ["c", "Высота", 1, 8, 3.5],
      ["sx", "Наклон вдоль длины", -4, 4, 1.6],
      ["sz", "Наклон вдоль ширины", -4, 4, 0.6],
    ],
  },
  pyr4: {
    t: "Четырёхугольная пирамида",
    icon: '<path d="M4 22h16l6-5H10zM15 3 4 22M15 3l5 19M15 3l11 14M15 3 10 17"/>',
    p: [
      ["a", "Сторона основания", 1, 8, 4.5],
      ["h", "Высота", 1, 9, 4.5],
    ],
  },
  pyr3: {
    t: "Треугольная пирамида",
    icon: '<path d="M4 24h20L15 17zM14 3 4 24M14 3l10 21M14 3l1 14"/>',
    p: [
      ["a", "Сторона основания", 1, 8, 5],
      ["h", "Высота", 1, 9, 4.5],
    ],
  },
  prism3: {
    t: "Треугольная призма",
    icon: '<path d="M4 25h18l-8-6zM4 9h18l-8-6zM4 9v16M22 9v16M14 3v16"/>',
    p: [
      ["a", "Сторона основания", 1, 8, 4.5],
      ["h", "Высота", 1, 9, 4],
    ],
  },
};
SHAPES.sphere = {
  t: "Шар",
  icon: '<circle cx="15" cy="15" r="11"/><path d="M4 15a11 4 0 0 0 22 0"/><path d="M26 15a11 4 0 0 0-22 0" stroke-dasharray="2 2"/>',
  p: [["r", "Радиус", 1, 5, 3]],
};
const vals = {};
for (const k in SHAPES) vals[k] = Object.fromEntries(SHAPES[k].p.map((x) => [x[0], x[4]]));

let shapeType = "cube",
  shape = null,
  EXT = 3;

function buildShape() {
  const P = vals[shapeType],
    verts = [];
  let faces;
  const v = (n, x, y, z) => verts.push({ n, p: [x, y, z] });
  const quad = (a, b) => [
    [-a / 2, -b / 2],
    [-a / 2, b / 2],
    [a / 2, b / 2],
    [a / 2, -b / 2],
  ];
  const tri = (a) => {
    const R = a / Math.sqrt(3);
    return [
      [-a / 2, -R / 2],
      [0, R],
      [a / 2, -R / 2],
    ];
  };
  if (shapeType === "sphere") {
    const r = P.r;
    shape = {
      verts: [{ n: "O", p: [0, 0, 0] }],
      faces: [],
      edges: [],
      size: 2 * r,
      bc: [0, 0, 0],
      sphere: r,
    };
    EXT = shape.size * 0.8;
    return;
  }
  switch (shapeType) {
    case "cube":
    case "box":
    case "oblique": {
      const a = P.a,
        b = shapeType === "cube" ? P.a : P.b,
        c = shapeType === "cube" ? P.a : P.c;
      const sx = P.sx || 0,
        sz = P.sz || 0,
        q = quad(a, b);
      [..."ABCD"].forEach((n, i) => v(n, q[i][0], 0, q[i][1]));
      [..."ABCD"].forEach((n, i) => v(n + "₁", q[i][0] + sx, c, q[i][1] + sz));
      faces = [
        [0, 1, 2, 3],
        [4, 5, 6, 7],
        [0, 1, 5, 4],
        [1, 2, 6, 5],
        [2, 3, 7, 6],
        [3, 0, 4, 7],
      ];
      break;
    }
    case "pyr4": {
      const q = quad(P.a, P.a);
      [..."ABCD"].forEach((n, i) => v(n, q[i][0], 0, q[i][1]));
      v("S", 0, P.h, 0);
      faces = [
        [0, 1, 2, 3],
        [0, 1, 4],
        [1, 2, 4],
        [2, 3, 4],
        [3, 0, 4],
      ];
      break;
    }
    case "pyr3": {
      const t = tri(P.a);
      [..."ABC"].forEach((n, i) => v(n, t[i][0], 0, t[i][1]));
      v("S", 0, P.h, 0);
      faces = [
        [0, 1, 2],
        [0, 1, 3],
        [1, 2, 3],
        [2, 0, 3],
      ];
      break;
    }
    case "prism3": {
      const t = tri(P.a);
      [..."ABC"].forEach((n, i) => v(n, t[i][0], 0, t[i][1]));
      [..."ABC"].forEach((n, i) => v(n + "₁", t[i][0], P.h, t[i][1]));
      faces = [
        [0, 1, 2],
        [3, 4, 5],
        [0, 1, 4, 3],
        [1, 2, 5, 4],
        [2, 0, 3, 5],
      ];
      break;
    }
  }
  const mn = [Infinity, Infinity, Infinity],
    mx = [-Infinity, -Infinity, -Infinity];
  verts.forEach(({ p }) => {
    for (let i = 0; i < 3; i++) {
      mn[i] = Math.min(mn[i], p[i]);
      mx[i] = Math.max(mx[i], p[i]);
    }
  });
  const ctr = mul(add(mn, mx), 0.5);
  verts.forEach((v) => (v.p = sub(v.p, ctr)));
  const size = Math.max(...sub(mx, mn));
  const bc = avg(verts.map((v) => v.p));
  faces = faces.map((idx) => {
    const pts = idx.map((i) => verts[i].p),
      c = avg(pts);
    let n = norm(cross(sub(pts[1], pts[0]), sub(pts[2], pts[0])));
    if (dot(n, sub(c, bc)) < 0) {
      idx = idx.slice().reverse();
      n = mul(n, -1);
    }
    return { idx, n, c };
  });
  const em = new Map();
  faces.forEach((f, fi) =>
    f.idx.forEach((a, k) => {
      const b = f.idx[(k + 1) % f.idx.length],
        i = Math.min(a, b),
        j = Math.max(a, b),
        key = i + "-" + j;
      if (!em.has(key)) em.set(key, { i, j, faces: [], name: verts[i].n + verts[j].n });
      em.get(key).faces.push(fi);
    }),
  );
  shape = { verts, faces, edges: [...em.values()], size, bc };
  EXT = size * 0.8;
}
const S = { points: [], lines: [], sections: [], planes: [], strokes: [] };
let uid = 1,
  history = [];
function snapshot() {
  history.push(JSON.stringify({ S, uid }));
  if (history.length > 150) history.shift();
}
function undo() {
  if (!history.length) {
    toast("Отменять нечего");
    return;
  }
  const o = JSON.parse(history.pop());
  S.points = o.S.points;
  S.lines = o.S.lines;
  S.sections = o.S.sections;
  S.planes = o.S.planes || [];
  S.strokes = o.S.strokes || [];
  uid = o.uid;
  pending = [];
  hover = null;
  refreshList();
  req();
}
const POOL = [..."KLMNPQRTEFGHXYZUVWOIJ"];
function nextName() {
  const used = new Set(allPoints().map((p) => p.name));
  for (let s = 0; ; s++)
    for (const L of POOL) {
      const n = s ? L + subIdx(s) : L;
      if (!used.has(n)) return n;
    }
}
const allPoints = () =>
  shape.verts.map((v, i) => ({ id: "v" + i, name: v.n, p: v.p, vertex: true })).concat(S.points);
function findPointAt(p) {
  const tol = 1e-5 * shape.size;
  return allPoints().find((q) => len(sub(q.p, p)) < tol);
}
function addPoint(p, kind = "user") {
  const ex = findPointAt(p);
  if (ex) return ex;
  const pt = { id: uid++, name: nextName(), p, kind };
  S.points.push(pt);
  return pt;
}
function newLine(a, b, o) {
  const l = { id: uid++, a, b, solid: false, ext: false, kind: "seg", ...o };
  S.lines.push(l);
  return l;
}
function allLines() {
  const V = shape.verts;
  const edges = shape.edges.map((e, k) => ({
    key: "e" + k,
    a: V[e.i].p,
    b: V[e.j].p,
    t0: 0,
    t1: 1,
    edge: e,
    name: e.name,
  }));
  const user = S.lines.map((l) => {
    const E = l.ext ? EXT / len(sub(l.b, l.a)) : 0;
    return {
      key: "l" + l.id,
      a: l.a,
      b: l.b,
      user: l,
      solid: l.solid,
      name: l.name,
      t0: l.ext ? Math.min(-E, l.tmin ?? 0) : 0,
      t1: l.ext ? Math.max(1 + E, l.tmax ?? 1) : 1,
    };
  });
  return edges.concat(user);
}
const cv = $("#cv"),
  ctx = cv.getContext("2d");
let W = 0,
  H = 0,
  DPR = 1,
  F = 500;
const cam = { yaw: -0.55, pitch: 0.42, dist: 14 },
  pan = { x: 0, y: 0 };
const opt = {
  hidden: true,
  faces: true,
  labels: true,
  ortho: true,
  snap: true,
  isnap: true,
  ratio: false,
};

function toView(p) {
  const cy = Math.cos(cam.yaw),
    sy = Math.sin(cam.yaw),
    cp = Math.cos(cam.pitch),
    sp = Math.sin(cam.pitch);
  const x1 = p[0] * cy + p[2] * sy,
    z1 = -p[0] * sy + p[2] * cy;
  return [x1, p[1] * cp + z1 * sp, -p[1] * sp + z1 * cp];
}
function fromView(v) {
  const cy = Math.cos(cam.yaw),
    sy = Math.sin(cam.yaw),
    cp = Math.cos(cam.pitch),
    sp = Math.sin(cam.pitch);
  const y = v[1] * cp - v[2] * sp,
    z1 = v[1] * sp + v[2] * cp;
  return [v[0] * cy - z1 * sy, y, v[0] * sy + z1 * cy];
}
function projV(v) {
  const d = opt.ortho ? cam.dist : Math.max(0.05, v[2] + cam.dist);
  return { x: W / 2 + pan.x + (F * v[0]) / d, y: H / 2 + pan.y - (F * v[1]) / d };
}
const project = (p) => projV(toView(p));
function getRay(mx, my) {
  const sx = (mx - W / 2 - pan.x) / F,
    sy = -(my - H / 2 - pan.y) / F;
  if (opt.ortho)
    return { o: fromView([sx * cam.dist, sy * cam.dist, -1000]), d: fromView([0, 0, 1]) };
  return { o: fromView([0, 0, -cam.dist]), d: norm(fromView([sx, sy, 1])) };
}
function isFront(f) {
  if (opt.ortho) return dot(f.n, fromView([0, 0, -1])) > 0;
  return dot(f.n, sub(fromView([0, 0, -cam.dist]), f.c)) > 0;
}
function resetView() {
  cam.yaw = -0.55;
  cam.pitch = 0.42;
  pan.x = pan.y = 0;
  cam.dist = shape.size * (opt.ortho ? 2.6 : 3.4);
  req();
}
function lineLine(p0, u, q0, v) {
  const w0 = sub(p0, q0),
    a = dot(u, u),
    b = dot(u, v),
    c = dot(v, v),
    d = dot(u, w0),
    e = dot(v, w0),
    den = a * c - b * b;
  if (den < 1e-10 * a * c) return { parallel: true };
  const s = (b * e - c * d) / den,
    t = (a * e - b * d) / den,
    P = add(p0, mul(u, s)),
    Q = add(q0, mul(v, t));
  return { s, t, p: P, dist: len(sub(P, Q)) };
}
function distSeg(mx, my, a, b) {
  const dx = b.x - a.x,
    dy = b.y - a.y,
    l2 = dx * dx + dy * dy;
  const t = l2 ? clamp(((mx - a.x) * dx + (my - a.y) * dy) / l2, 0, 1) : 0;
  return Math.hypot(mx - a.x - t * dx, my - a.y - t * dy);
}
function inConvex(pts, n, X) {
  const eps = -1e-7 * shape.size * shape.size;
  return pts.every((A, k) => dot(cross(sub(pts[(k + 1) % pts.length], A), sub(X, A)), n) >= eps);
}
function polyNormal(pts) {
  const c = avg(pts);
  let n = [0, 0, 0];
  pts.forEach((p, i) => {
    n = add(n, cross(sub(p, c), sub(pts[(i + 1) % pts.length], c)));
  });
  return norm(n);
}
function facePlane(i) {
  const f = shape.faces[i],
    pts = f.idx.map((k) => shape.verts[k].p);
  return {
    key: "f" + i,
    n: f.n,
    c: f.c,
    pts,
    kind: "face",
    name: "(" + f.idx.map((k) => shape.verts[k].n).join("") + ")",
  };
}
function secPlane(s) {
  if (!s.n) s.n = polyNormal(s.poly);
  return {
    key: "s" + s.id,
    n: s.n,
    c: avg(s.poly),
    pts: s.poly,
    kind: "sec",
    name: "(" + s.name + ")",
  };
}
function planeQuad(pl) {
  const { c, e1, e2, r1, r2 } = pl;
  return [
    [1, 1],
    [-1, 1],
    [-1, -1],
    [1, -1],
  ].map(([a, b]) => add(c, add(mul(e1, a * r1), mul(e2, b * r2))));
}
function inQuad(pl, X) {
  const d = sub(X, pl.c);
  return Math.abs(dot(d, pl.e1)) <= pl.r1 + 1e-9 && Math.abs(dot(d, pl.e2)) <= pl.r2 + 1e-9;
}
function extendPlane(pl) {
  let ex = S.planes.find((p) => p.src === pl.key);
  if (ex) return ex;
  const e1 = norm(sub(pl.pts[1], pl.pts[0])),
    e2 = cross(pl.n, e1),
    R = shape.size * 1.05;
  ex = {
    id: uid++,
    src: pl.key,
    kind: pl.kind,
    n: pl.n,
    c: pl.c,
    e1,
    e2,
    r1: R,
    r2: R,
    name: pl.name,
  };
  S.planes.push(ex);
  return ex;
}
function growPlane(pl, X) {
  const d = sub(X, pl.c);
  pl.r1 = Math.max(pl.r1, Math.abs(dot(d, pl.e1)) * 1.15);
  pl.r2 = Math.max(pl.r2, Math.abs(dot(d, pl.e2)) * 1.15);
}
const userPlaneAsPlane = (p) => ({
  key: p.src,
  n: p.n,
  c: p.c,
  pts: planeQuad(p),
  kind: p.kind,
  name: p.name,
  user: p,
});
const ratioK = () => {
  const m = Math.max(0.001, +$("#rm").value || 1),
    n = Math.max(0.001, +$("#rn").value || 1);
  return m / (m + n);
};
let isectCache = null;
function getIsects() {
  if (isectCache) return isectCache;
  const out = [],
    Ls = allLines(),
    tol = 1e-4 * shape.size,
    e = 1e-6;
  const push = (p, label) => {
    if (findPointAt(p)) return;
    if (out.some((q) => len(sub(q.p, p)) < 1e-5 * shape.size)) return;
    out.push({ p, label });
  };
  for (let i = 0; i < Ls.length; i++)
    for (let j = i + 1; j < Ls.length; j++) {
      const A = Ls[i],
        B = Ls[j];
      if (A.edge && B.edge) continue;
      const r = lineLine(A.a, sub(A.b, A.a), B.a, sub(B.b, B.a));
      if (r.parallel || r.dist > tol) continue;
      if (r.s < A.t0 - e || r.s > A.t1 + e || r.t < B.t0 - e || r.t > B.t1 + e) continue;
      push(r.p, `${A.name} ∩ ${B.name}`);
    }
  const planes = [];
  shape.faces.forEach((_, i) => planes.push({ pl: facePlane(i), onlyUser: true }));
  S.sections.forEach((s) => planes.push({ pl: secPlane(s) }));
  S.planes.forEach((p) => planes.push({ pl: userPlaneAsPlane(p) }));
  for (const { pl, onlyUser } of planes) {
    for (const L of Ls) {
      if (onlyUser && !L.user) continue;
      const u = sub(L.b, L.a),
        den = dot(pl.n, u);
      if (Math.abs(den) < 1e-9 * len(u)) continue;
      const t = dot(pl.n, sub(pl.c, L.a)) / den;
      if (t < L.t0 - e || t > L.t1 + e) continue;
      const X = add(L.a, mul(u, t));
      if (pl.user ? !inQuad(pl.user, X) : !inConvex(pl.pts, pl.n, X)) continue;
      push(X, `${L.name} ∩ ${pl.name}`);
    }
  }
  if (shape.sphere) {
    for (const L of Ls) {
      if (!L.user) continue;
      for (const { t, p } of lineSphere(L.a, sub(L.b, L.a)))
        if (t >= L.t0 - e && t <= L.t1 + e) push(p, `${L.name} ∩ шар`);
    }
  }
  return (isectCache = out);
}
let tool = "point",
  pending = [],
  hover = null,
  mouse = null;

function hoverFilter() {
  const place = {
    points: true,
    lines: true,
    faces: true,
    sections: true,
    planes: true,
    place: true,
  };
  switch (tool) {
    case "point":
    case "segment":
    case "line":
    case "section":
      return place;
    case "extend":
      return { lines: true, finite: true };
    case "plane":
      return { faces: true, sections: true, planes: true };
    case "parallel":
      return pending.length ? place : { lines: true };
    case "intersect":
      return { lines: true, faces: true, sections: true, planes: true };
    case "delete":
      return { points: true, lines: true, planes: true, userOnly: true };
  }
  return null;
}
function computeHover(mx, my) {
  const f = hoverFilter();
  if (!f) return null;
  if (f.points) {
    let best = null,
      bd = 11;
    for (const pt of allPoints()) {
      if (f.userOnly && pt.vertex) continue;
      const s = project(pt.p),
        d = Math.hypot(s.x - mx, s.y - my);
      if (d < bd) {
        bd = d;
        best = pt;
      }
    }
    if (best) return { kind: "point", pt: best, pos: best.p };
  }
  if (f.place && opt.isnap) {
    let best = null,
      bd = 13;
    for (const q of getIsects()) {
      const s = project(q.p),
        d = Math.hypot(s.x - mx, s.y - my);
      if (d < bd) {
        bd = d;
        best = q;
      }
    }
    if (best) return { kind: "isect", pos: best.p, label: best.label };
  }
  if (f.lines) {
    let best = null,
      bd = 7;
    for (const L of allLines()) {
      if (f.userOnly && !L.user) continue;
      if (f.finite && !(L.edge || L.solid)) continue;
      const u = sub(L.b, L.a);
      const d = distSeg(mx, my, project(add(L.a, mul(u, L.t0))), project(add(L.a, mul(u, L.t1))));
      if (d < bd) {
        bd = d;
        best = L;
      }
    }
    if (best) {
      const L = best,
        u = sub(L.b, L.a),
        r = getRay(mx, my),
        res = lineLine(L.a, u, r.o, r.d);
      let t = clamp(res.parallel ? 0.5 : res.s, L.t0, L.t1);
      if (f.place) {
        const finite = L.edge || L.solid;
        if (finite && opt.ratio) {
          const k = ratioK();
          t = clamp(t, 0, 1) < 0.5 ? k : 1 - k;
        } else if (finite && opt.snap) {
          const m = project(add(L.a, mul(u, 0.5)));
          if (Math.hypot(m.x - mx, m.y - my) < 10) t = 0.5;
        }
      }
      return { kind: "line", line: L, t, pos: add(L.a, mul(u, t)) };
    }
  }
  if (f.faces || f.sections || f.planes) {
    const cand = [];
    if (f.faces && !f.userOnly) shape.faces.forEach((_, i) => cand.push(facePlane(i)));
    if (f.sections && !f.userOnly) S.sections.forEach((s) => cand.push(secPlane(s)));
    if (f.planes) S.planes.forEach((p) => cand.push(userPlaneAsPlane(p)));
    const r = getRay(mx, my),
      tie = 1e-6 * shape.size;
    let best = null,
      bt = Infinity,
      bp = null;
    if (f.faces && !f.userOnly && shape.sphere) {
      const hit = lineSphere(r.o, r.d)[0];
      if (hit && hit.t > 0) {
        bt = hit.t;
        bp = hit.p;
        best = { sphere: true };
      }
    }
    for (const pl of cand) {
      const den = dot(pl.n, r.d);
      if (Math.abs(den) < 1e-9) continue;
      const t = dot(pl.n, sub(pl.c, r.o)) / den;
      if (t <= 0 || t >= bt - tie) continue;
      const X = add(r.o, mul(r.d, t));
      if (pl.user ? inQuad(pl.user, X) : inConvex(pl.pts, pl.n, X)) {
        bt = t;
        best = pl;
        bp = X;
      }
    }
    if (best && best.sphere) return { kind: "sphere", pos: bp };
    if (best)
      return {
        kind: best.kind === "face" && !best.user ? "face" : "plane",
        plane: best,
        pos: bp,
        hl: best.pts,
      };
  }
  return null;
}
function resolvePoint(h) {
  if (!h) return null;
  if (h.kind === "point") return h.pt;
  const ex = findPointAt(h.pos);
  if (ex) return ex;
  snapshot();
  return addPoint(h.pos);
}
function ensureReach(L, t) {
  if (t >= L.t0 - 1e-6 && t <= L.t1 + 1e-6) return;
  let l = L.user;
  if (!l) {
    l =
      S.lines.find((x) => x.src === L.key) ||
      newLine(L.a, L.b, { kind: "ext", ext: true, name: "(" + L.name + ")", src: L.key });
  }
  l.ext = true;
  l.tmin = Math.min(l.tmin ?? 0, t - 0.1);
  l.tmax = Math.max(l.tmax ?? 1, t + 0.1);
}
const POLY = [
  "",
  "",
  "",
  "треугольник",
  "четырёхугольник",
  "пятиугольник",
  "шестиугольник",
  "семиугольник",
  "восьмиугольник",
];

function lineSphere(a, u) {
  const R = shape.sphere,
    A = dot(u, u),
    B = dot(a, u),
    Cc = dot(a, a) - R * R,
    disc = B * B - A * Cc;
  if (disc < -1e-12 * A * R * R) return [];
  const q = Math.sqrt(Math.max(0, disc));
  const ts = q < 1e-9 * Math.sqrt(A) * R ? [-B / A] : [(-B - q) / A, (-B + q) / A];
  return ts.map((t) => ({ t, p: add(a, mul(u, t)) }));
}
function nextCircleName() {
  const used = new Set(S.sections.map((s) => s.name));
  for (let i = 1; ; i++) if (!used.has("ω" + subIdx(i))) return "ω" + subIdx(i);
}
function sphereSection(n, h) {
  const R = shape.sphere;
  if (Math.abs(h) >= R - 1e-9 * R) {
    toast(
      Math.abs(h) > R ? "Плоскость не пересекает шар" : "Плоскость касается шара в одной точке",
    );
    return;
  }
  const r = Math.sqrt(R * R - h * h),
    c = mul(n, h),
    helper = Math.abs(n[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0],
    e1 = norm(cross(n, helper)),
    e2 = cross(n, e1),
    poly = [];
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    poly.push(add(c, add(mul(e1, r * Math.cos(a)), mul(e2, r * Math.sin(a)))));
  }
  snapshot();
  const used = new Set(S.sections.map((s) => s.color));
  const color = [0, 1, 2].find((i) => !used.has(i)) ?? S.sections.length % 3;
  const name = nextCircleName();
  S.sections.push({ id: uid++, poly, area: Math.PI * r * r, name, color, n, circle: true, r });
  toast(`Сечение ${name} — круг радиуса ${r.toFixed(2)}, S ≈ ${(Math.PI * r * r).toFixed(2)}`);
}
function intersectLineSphere(L) {
  const u = sub(L.b, L.a),
    hits = lineSphere(L.a, u);
  if (!hits.length) {
    toast(`Прямая ${L.name} не пересекает шар`);
    return;
  }
  snapshot();
  const names = hits.map(({ t, p }) => {
    ensureReach(L, t);
    return addPoint(p).name;
  });
  toast(
    hits.length === 1
      ? `Прямая ${L.name} касается шара в точке ${names[0]}`
      : `${L.name} пересекает шар в точках ${names.join(" и ")}`,
  );
}

function makeSection(pts) {
  const [p1, p2, p3] = pts.map((x) => x.p);
  let n = cross(sub(p2, p1), sub(p3, p1));
  const nl = len(n);
  if (nl < 1e-9 * shape.size * shape.size) {
    toast("Точки лежат на одной прямой — плоскость не задана");
    return;
  }
  n = mul(n, 1 / nl);
  if (shape.sphere) {
    sphereSection(n, dot(n, p1));
    return;
  }
  const c = dot(n, p1),
    eps = 1e-7 * shape.size,
    V = shape.verts,
    raw = [];
  for (const e of shape.edges) {
    const A = V[e.i].p,
      B = V[e.j].p,
      da = dot(n, A) - c,
      db = dot(n, B) - c;
    if (Math.abs(da) < eps) raw.push(A);
    if (Math.abs(db) < eps) raw.push(B);
    if ((da > eps && db < -eps) || (da < -eps && db > eps))
      raw.push(add(A, mul(sub(B, A), da / (da - db))));
  }
  const poly = [];
  for (const p of raw) if (!poly.some((q) => len(sub(p, q)) < 1e-6 * shape.size)) poly.push(p);
  if (poly.length < 3) {
    toast("Плоскость не пересекает фигуру по многоугольнику");
    return;
  }
  const cen = avg(poly),
    e1 = norm(sub(poly[0], cen)),
    e2 = cross(n, e1);
  poly.sort((a, b) => {
    const qa = sub(a, cen),
      qb = sub(b, cen);
    return Math.atan2(dot(qa, e2), dot(qa, e1)) - Math.atan2(dot(qb, e2), dot(qb, e1));
  });
  let ar = [0, 0, 0];
  poly.forEach((p, i) => {
    ar = add(ar, cross(sub(p, cen), sub(poly[(i + 1) % poly.length], cen)));
  });
  const area = len(ar) / 2;
  snapshot();
  const name = poly.map((p) => addPoint(p, "sec").name).join("");
  const used = new Set(S.sections.map((s) => s.color));
  const color = [0, 1, 2].find((i) => !used.has(i)) ?? S.sections.length % 3;
  S.sections.push({ id: uid++, poly, area, name, color, n });
  toast(
    `Сечение ${name} — ${POLY[poly.length] || poly.length + "-угольник"}, S ≈ ${area.toFixed(2)}`,
  );
}

function planeReach(pl, X) {
  if (pl.user) {
    growPlane(pl.user, X);
    return;
  }
  if (inConvex(pl.pts, pl.n, X)) return;
  growPlane(extendPlane(pl), X);
}
function intersectLinePlane(L, pl) {
  const u = sub(L.b, L.a),
    den = dot(pl.n, u),
    h = dot(pl.n, sub(pl.c, L.a));
  if (Math.abs(den) < 1e-9 * len(u)) {
    toast(
      Math.abs(h) < 1e-6 * shape.size
        ? `Прямая ${L.name} лежит в плоскости ${pl.name}`
        : `Прямая ${L.name} параллельна плоскости ${pl.name}`,
    );
    return;
  }
  const t = h / den;
  if (Math.abs(t) > 60) {
    toast("Точка пересечения слишком далеко");
    return;
  }
  const X = add(L.a, mul(u, t));
  snapshot();
  ensureReach(L, t);
  planeReach(pl, X);
  const p = addPoint(X);
  toast(`${p.name} = ${L.name} ∩ ${pl.name}`);
}
function intersectPlanes(P1, P2) {
  const d = cross(P1.n, P2.n),
    dl = len(d);
  if (dl < 1e-7) {
    toast(
      Math.abs(dot(P1.n, sub(P2.c, P1.c))) < 1e-6 * shape.size
        ? "Это одна и та же плоскость"
        : "Плоскости параллельны",
    );
    return;
  }
  const h1 = dot(P1.n, P1.c),
    h2 = dot(P2.n, P2.c);
  let p = mul(add(mul(cross(d, P2.n), h1), mul(cross(P1.n, d), h2)), 1 / (dl * dl));
  const dn = mul(d, 1 / dl);
  p = add(p, mul(dn, dot(sub(shape.bc, p), dn)));
  if (len(sub(p, shape.bc)) > shape.size * 25) {
    toast("Линия пересечения слишком далеко");
    return;
  }
  snapshot();
  const a = add(p, mul(dn, -shape.size * 0.5)),
    b = add(p, mul(dn, shape.size * 0.5));
  newLine(a, b, { kind: "trace", ext: true, name: `${P1.name} ∩ ${P2.name}` });
  [P1, P2].forEach((pl) => {
    planeReach(pl, a);
    planeReach(pl, b);
  });
  toast(`Построена прямая ${P1.name} ∩ ${P2.name}`);
}

function onClick(mx, my) {
  const h = computeHover(mx, my);
  switch (tool) {
    case "point": {
      if (!h || h.kind === "point") return;
      snapshot();
      const p = addPoint(h.pos);
      toast(
        h.kind === "isect"
          ? `${p.name} = ${h.label}`
          : h.kind === "sphere"
            ? `Точка ${p.name} на поверхности шара`
            : `Точка ${p.name} на ${h.kind === "line" ? (h.line.edge ? "ребре " + h.line.name : "прямой") : "плоскости " + h.plane.name}`,
      );
      break;
    }
    case "segment":
    case "line": {
      const p = resolvePoint(h);
      if (!p) break;
      if (!pending.length) {
        pending = [p];
        break;
      }
      const a = pending[0];
      if (len(sub(a.p, p.p)) < 1e-6 * shape.size) break;
      snapshot();
      if (tool === "segment")
        newLine(a.p, p.p, { kind: "seg", solid: true, name: a.name + p.name });
      else
        newLine(a.p, p.p, {
          kind: "line",
          solid: true,
          ext: true,
          name: "(" + a.name + p.name + ")",
        });
      pending = [];
      break;
    }
    case "extend": {
      if (!h) return;
      const L = h.line;
      snapshot();
      if (L.user) {
        L.user.ext = !L.user.ext;
        if (!L.user.ext) {
          delete L.user.tmin;
          delete L.user.tmax;
        }
        toast(L.user.ext ? `${L.name} продлён до прямой` : `Продолжение ${L.name} убрано`);
      } else {
        const i = S.lines.findIndex((x) => x.src === L.key);
        if (i >= 0) {
          S.lines.splice(i, 1);
          toast(`Продолжение ребра ${L.name} убрано`);
        } else {
          newLine(L.a, L.b, { kind: "ext", ext: true, name: "(" + L.name + ")", src: L.key });
          toast(`Ребро ${L.name} продлено`);
        }
      }
      break;
    }
    case "plane": {
      if (!h || h.kind === "sphere") return;
      const pl = h.plane,
        ex = S.planes.find((p) => p.src === pl.key);
      snapshot();
      if (ex) {
        S.planes = S.planes.filter((p) => p !== ex);
        toast(`Продолжение плоскости ${pl.name} убрано`);
      } else {
        extendPlane(pl);
        toast(`Плоскость ${pl.name} продлена`);
      }
      break;
    }
    case "parallel": {
      if (!pending.length) {
        if (h) pending = [{ line: h.line }];
        break;
      }
      const p = resolvePoint(h);
      if (!p) break;
      const L = pending[0].line,
        u = sub(L.b, L.a);
      snapshot();
      newLine(p.p, add(p.p, u), { kind: "par", ext: true, name: `${p.name} ∥ ${L.name}` });
      toast(`Через ${p.name} проведена прямая, параллельная ${L.name}`);
      pending = [];
      break;
    }
    case "intersect": {
      if (!h) return;
      const obj =
        h.kind === "line"
          ? { line: h.line }
          : h.kind === "sphere"
            ? { sphere: true }
            : { plane: h.plane, hl: h.hl };
      if (!pending.length) {
        pending = [obj];
        break;
      }
      const A = pending[0];
      if (
        (A.line && obj.line && A.line.key === obj.line.key) ||
        (A.plane && obj.plane && A.plane.key === obj.plane.key)
      )
        return;
      if (A.sphere && obj.sphere) return;
      pending = [];
      if (A.sphere || obj.sphere) {
        const other = A.sphere ? obj : A;
        if (other.line) intersectLineSphere(other.line);
        else sphereSection(other.plane.n, dot(other.plane.n, other.plane.c));
        break;
      }
      if (A.plane && obj.plane) {
        intersectPlanes(A.plane, obj.plane);
        break;
      }
      if (A.plane || obj.plane) {
        intersectLinePlane(A.line || obj.line, A.plane || obj.plane);
        break;
      }
      const L1 = A.line,
        L2 = obj.line;
      const r = lineLine(L1.a, sub(L1.b, L1.a), L2.a, sub(L2.b, L2.a));
      if (r.parallel) {
        toast("Прямые параллельны — общей точки нет");
        break;
      }
      if (r.dist > 1e-4 * shape.size) {
        toast("Прямые скрещиваются — они не лежат в одной плоскости");
        break;
      }
      if (Math.max(Math.abs(r.s), Math.abs(r.t)) > 60) {
        toast("Точка пересечения слишком далеко");
        break;
      }
      snapshot();
      ensureReach(L1, r.s);
      ensureReach(L2, r.t);
      const p = addPoint(r.p);
      toast(`${p.name} = ${L1.name} ∩ ${L2.name}`);
      break;
    }
    case "section": {
      const p = resolvePoint(h);
      if (!p) break;
      if (pending.some((q) => len(sub(q.p, p.p)) < 1e-6 * shape.size)) break;
      pending.push(p);
      if (pending.length === 3) {
        const pts = pending;
        pending = [];
        makeSection(pts);
      }
      break;
    }
    case "delete": {
      if (!h) return;
      snapshot();
      if (h.kind === "point") {
        S.points = S.points.filter((q) => q !== h.pt);
        toast(`Точка ${h.pt.name} удалена`);
      } else if (h.kind === "plane") {
        S.planes = S.planes.filter((p) => p !== h.plane.user);
        toast(`Плоскость ${h.plane.name} удалена`);
      } else {
        S.lines = S.lines.filter((l) => l !== h.line.user);
        toast(`${h.line.name} удалена`);
      }
      break;
    }
  }
  hover = computeHover(mx, my);
  refreshList();
  req();
}
const C = {};
const FALLBACK = {
  light: {
    ink: "#18223a",
    hidden: "#7a86a0",
    accent: "#1f3fbf",
    ext: "rgba(31,63,191,.55)",
    par: "#11875a",
    face: "rgba(31,63,191,.06)",
    facehover: "rgba(240,150,0,.17)",
    hover: "#f09600",
    halo: "#f6f8fb",
    plane: "#0f8a9a",
    planef: "rgba(15,138,154,.1)",
    sec0: "#d7263d",
    sec1: "#7b3fe4",
    sec2: "#e06a00",
    secf0: "rgba(215,38,61,.2)",
    secf1: "rgba(123,63,228,.2)",
    secf2: "rgba(224,106,0,.2)",
  },
  dark: {
    ink: "#f1f5f1",
    hidden: "#8a9c95",
    accent: "#8fb0ff",
    ext: "rgba(143,176,255,.55)",
    par: "#5fd49a",
    face: "rgba(240,245,240,.05)",
    facehover: "rgba(255,190,70,.16)",
    hover: "#ffbe46",
    halo: "#16211e",
    plane: "#4fd0dd",
    planef: "rgba(79,208,221,.09)",
    sec0: "#ff6b7d",
    sec1: "#b894ff",
    sec2: "#ffa24c",
    secf0: "rgba(255,107,125,.2)",
    secf1: "rgba(184,148,255,.2)",
    secf2: "rgba(255,162,76,.2)",
  },
};
function currentTheme() {
  const t = document.documentElement.dataset.theme;
  if (t === "light" || t === "dark") return t;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
function readColors() {
  const cs = getComputedStyle(document.documentElement),
    fb = FALLBACK[currentTheme()];
  [
    "ink",
    "hidden",
    "accent",
    "ext",
    "par",
    "face",
    "facehover",
    "hover",
    "halo",
    "plane",
    "planef",
    "sec0",
    "sec1",
    "sec2",
    "secf0",
    "secf1",
    "secf2",
  ].forEach((k) => (C[k] = cs.getPropertyValue("--c-" + k).trim() || fb[k]));
  req();
}
function seg3(a, b) {
  let va = toView(a),
    vb = toView(b);
  if (!opt.ortho) {
    const near = 0.05 - cam.dist;
    if (va[2] < near && vb[2] < near) return;
    if (va[2] < near) va = lerp(va, vb, (near - va[2]) / (vb[2] - va[2]));
    else if (vb[2] < near) vb = lerp(vb, va, (near - vb[2]) / (va[2] - vb[2]));
  }
  const pa = projV(va),
    pb = projV(vb);
  ctx.moveTo(pa.x, pa.y);
  ctx.lineTo(pb.x, pb.y);
}
function stroke(a, b, col, w, dash) {
  ctx.beginPath();
  seg3(a, b);
  ctx.strokeStyle = col;
  ctx.lineWidth = w;
  ctx.setLineDash(dash || []);
  ctx.stroke();
  ctx.setLineDash([]);
}
function isHidden(X) {
  return shape.sphere ? sphereHidden(X) : polyHidden(X);
}
function sphereHidden(X) {
  const d = opt.ortho ? fromView([0, 0, -1]) : norm(sub(fromView([0, 0, -cam.dist]), X)),
    R = shape.sphere,
    eps = 1e-4 * shape.size,
    b = dot(X, d),
    disc = b * b - (dot(X, X) - R * R);
  if (disc <= 0) return false;
  const q = Math.sqrt(disc);
  return -b + q - Math.max(-b - q, eps) > eps;
}
function polyHidden(X) {
  const d = opt.ortho ? fromView([0, 0, -1]) : norm(sub(fromView([0, 0, -cam.dist]), X));
  const eps = 1e-4 * shape.size;
  let tmin = eps,
    tmax = Infinity;
  for (const f of shape.faces) {
    const s = dot(f.n, sub(X, f.c)),
      den = dot(f.n, d);
    if (Math.abs(den) < 1e-12) {
      if (s > 1e-9) return false;
      continue;
    }
    const b = -s / den;
    if (den > 0) tmax = Math.min(tmax, b);
    else tmin = Math.max(tmin, b);
    if (tmin >= tmax - eps) return false;
  }
  return true;
}
function strokeVis(a, b, col, w, samples) {
  if (!opt.hidden) return stroke(a, b, col, w);
  const N = samples || 40,
    st = [];
  for (let i = 0; i <= N; i++) st.push(isHidden(lerp(a, b, i / N)));
  const border = (i) => {
    let lo = (i - 1) / N,
      hi = i / N;
    for (let k = 0; k < 18; k++) {
      const mid = (lo + hi) / 2;
      if (isHidden(lerp(a, b, mid)) === st[i - 1]) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  };
  const parts = [];
  let t0 = 0;
  for (let i = 1; i <= N; i++) {
    if (st[i] !== st[i - 1]) {
      const t = border(i);
      parts.push([t0, t, st[i - 1]]);
      t0 = t;
    }
  }
  parts.push([t0, 1, st[N]]);
  for (const [p, q, hidden] of parts) {
    const A = lerp(a, b, p),
      B = lerp(a, b, q);
    if (hidden) stroke(A, B, col, Math.max(1.2, w * 0.6), [6, 5]);
    else stroke(A, B, col, w);
  }
}
function strokeLoopVis(pts, col, w) {
  const n = pts.length,
    vh = pts.map((p) => opt.hidden && isHidden(p)),
    hid = vh.map((h, i) => h && vh[(i + 1) % n]);
  let start = hid.findIndex((h, i) => h !== hid[(i + n - 1) % n]);
  if (start < 0) start = 0;
  let i = 0;
  while (i < n) {
    const h = hid[(start + i) % n];
    ctx.beginPath();
    let first = true;
    while (i < n && hid[(start + i) % n] === h) {
      const k = (start + i) % n;
      if (first) seg3(pts[k], pts[(k + 1) % n]);
      else {
        const q = project(pts[(k + 1) % n]);
        ctx.lineTo(q.x, q.y);
      }
      first = false;
      i++;
    }
    ctx.strokeStyle = col;
    ctx.lineWidth = h ? Math.max(1.2, w * 0.6) : w;
    ctx.setLineDash(h ? [6, 5] : []);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}
function polyPath(pts) {
  ctx.beginPath();
  pts.forEach((p, i) => {
    const s = project(p);
    i ? ctx.lineTo(s.x, s.y) : ctx.moveTo(s.x, s.y);
  });
  ctx.closePath();
}
function lineRange(L, t0, t1) {
  const u = sub(L.b, L.a);
  return [add(L.a, mul(u, t0)), add(L.a, mul(u, t1))];
}
function label(txt, x, y, col, size) {
  ctx.font = `italic 700 ${size || 17}px "PT Serif", Georgia, serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 4;
  ctx.strokeStyle = C.halo;
  ctx.lineJoin = "round";
  ctx.strokeText(txt, x, y);
  ctx.fillStyle = col;
  ctx.fillText(txt, x, y);
}
function dotAt(p, r, fill, ring) {
  const s = project(p);
  ctx.beginPath();
  ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (ring) {
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = ring;
    ctx.stroke();
  }
  return s;
}

let raf = 0;
function req() {
  if (!raf) raf = requestAnimationFrame(render);
}
function drawSphere() {
  const R = shape.sphere,
    c = project([0, 0, 0]),
    r = opt.ortho ? (F * R) / cam.dist : (F * R) / Math.sqrt(cam.dist ** 2 - R * R);
  ctx.beginPath();
  ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
  ctx.fillStyle = hover && hover.kind === "sphere" ? C.facehover : C.face;
  if (opt.faces || (hover && hover.kind === "sphere")) ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = C.ink;
  ctx.stroke();
  const eq = [];
  for (let i = 0; i <= 96; i++) {
    const a = (i / 96) * Math.PI * 2;
    eq.push([R * Math.cos(a), 0, R * Math.sin(a)]);
  }
  eq.pop();
  strokeLoopVis(eq, C.hidden, 1.4);
}
function render() {
  raf = 0;
  updateHint();
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.lineCap = "round";
  const V = shape.verts;
  shape.faces.forEach((f) => (f.front = isFront(f)));

  if (opt.faces) {
    shape.faces
      .map((f) => ({ f, z: toView(f.c)[2] }))
      .sort((a, b) => b.z - a.z)
      .forEach(({ f }) => {
        polyPath(f.idx.map((i) => V[i].p));
        ctx.fillStyle = C.face;
        ctx.fill();
      });
  }
  if (shape.sphere) drawSphere();
  S.planes.forEach((pl) => {
    const q = planeQuad(pl);
    polyPath(q);
    ctx.fillStyle = C.planef;
    ctx.fill();
    ctx.setLineDash([3, 5]);
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = C.plane;
    ctx.stroke();
    ctx.setLineDash([]);
    const s = project(q[0]);
    if (opt.labels) label(pl.name, s.x, s.y - 12, C.plane, 14);
  });
  pending.forEach((pd) => {
    if (pd.hl) {
      polyPath(pd.hl);
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = C.planef;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = C.plane;
      ctx.stroke();
    }
  });
  if (hover && hover.hl) {
    polyPath(hover.hl);
    ctx.fillStyle = tool === "delete" ? C.secf0 : C.facehover;
    ctx.fill();
  }

  S.sections.forEach((s) => {
    polyPath(s.poly);
    ctx.fillStyle = C["secf" + s.color];
    ctx.fill();
  });

  for (const e of shape.edges) {
    const vis = e.faces.some((fi) => shape.faces[fi].front);
    if (vis) stroke(V[e.i].p, V[e.j].p, C.ink, 2);
    else
      stroke(
        V[e.i].p,
        V[e.j].p,
        opt.hidden ? C.hidden : C.ink,
        opt.hidden ? 1.4 : 2,
        opt.hidden ? [7, 6] : null,
      );
  }

  for (const L of allLines()) {
    if (!L.user) continue;
    const l = L.user,
      col = l.kind === "par" ? C.par : l.kind === "trace" ? C.plane : C.accent;
    if (l.ext) {
      const [a, b] = lineRange(L, L.t0, L.t1);
      ctx.globalAlpha = 0.62;
      strokeVis(a, b, col, 1.3);
      ctx.globalAlpha = 1;
    }
    if (l.solid) strokeVis(l.a, l.b, col, 2.4);
  }

  S.sections.forEach((s) => {
    if (s.circle) strokeLoopVis(s.poly, C["sec" + s.color], 2.4);
    else
      s.poly.forEach((p, i) =>
        strokeVis(p, s.poly[(i + 1) % s.poly.length], C["sec" + s.color], 2.4),
      );
  });
  pending.forEach((pd) => {
    if (pd.line) {
      const [a, b] = lineRange(pd.line, pd.line.t0, pd.line.t1);
      ctx.globalAlpha = 0.45;
      stroke(a, b, C.accent, 7);
      ctx.globalAlpha = 1;
    }
  });

  if (hover && hover.kind === "line") {
    const L = hover.line,
      [a, b] = lineRange(L, L.t0, L.t1);
    ctx.globalAlpha = 0.35;
    stroke(a, b, C.hover, 7);
    ctx.globalAlpha = 1;
  }
  const hp = hover && hover.pos;
  if (hp && (tool === "segment" || tool === "line") && pending.length) {
    if (tool === "line") {
      const u = sub(hp, pending[0].p);
      if (len(u) > 1e-6) {
        const E = EXT / len(u);
        ctx.globalAlpha = 0.5;
        stroke(add(pending[0].p, mul(u, -E)), add(hp, mul(u, E)), C.accent, 1.2, [4, 5]);
        ctx.globalAlpha = 1;
      }
    }
    stroke(pending[0].p, hp, C.accent, 2, [6, 5]);
  }
  if (hp && tool === "parallel" && pending.length) {
    const L = pending[0].line,
      u = norm(sub(L.b, L.a));
    stroke(add(hp, mul(u, -EXT)), add(hp, mul(u, EXT)), C.par, 1.6, [6, 5]);
  }
  if (tool === "section" && pending.length) {
    const pts = pending.map((p) => p.p);
    if (hp && pending.length === 2 && !pending.some((q) => len(sub(q.p, hp)) < 1e-9)) {
      polyPath([...pts, hp]);
      ctx.fillStyle = C.facehover;
      ctx.fill();
    }
    if (hp && pending.length < 3) stroke(pts[pts.length - 1], hp, C.hover, 1.5, [5, 5]);
    if (pts.length === 2) stroke(pts[0], pts[1], C.hover, 1.5, [5, 5]);
  }
  if (opt.isnap && hoverFilter()?.place) {
    ctx.strokeStyle = C.hover;
    ctx.lineWidth = 1.6;
    for (const q of getIsects()) {
      const s = project(q.p);
      ctx.beginPath();
      ctx.moveTo(s.x, s.y - 5);
      ctx.lineTo(s.x + 5, s.y);
      ctx.lineTo(s.x, s.y + 5);
      ctx.lineTo(s.x - 5, s.y);
      ctx.closePath();
      ctx.stroke();
    }
  }
  drawStrokes();
  const bcS = project(shape.bc);
  V.forEach((v) => {
    const s = dotAt(v.p, 3.4, C.ink);
    if (opt.labels) {
      let dx = s.x - bcS.x,
        dy = s.y - bcS.y;
      const l = Math.hypot(dx, dy);
      if (l < 1) label(v.n, s.x + 10, s.y + 14, C.ink);
      else label(v.n, s.x + (dx / l) * 17, s.y + (dy / l) * 17, C.ink);
    }
  });
  const secColor = (p) => {
    const s = S.sections.find((s) => s.poly.some((q) => len(sub(q, p.p)) < 1e-6 * shape.size));
    return s ? C["sec" + s.color] : C.sec0;
  };
  S.points.forEach((p) => {
    const col = p.kind === "sec" ? secColor(p) : C.accent;
    const s = dotAt(p.p, 4.2, col, C.halo);
    if (opt.labels) label(p.name, s.x + 12, s.y - 12, col);
  });
  pending.forEach((pd) => {
    if (pd.p) {
      const s = project(pd.p);
      ctx.beginPath();
      ctx.arc(s.x, s.y, 8, 0, 7);
      ctx.lineWidth = 2;
      ctx.strokeStyle = C.accent;
      ctx.stroke();
    }
  });

  if (hover) {
    const s = project(hover.pos);
    if (hover.kind === "point") {
      ctx.beginPath();
      ctx.arc(s.x, s.y, 9, 0, 7);
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = tool === "delete" ? C.sec0 : C.hover;
      ctx.stroke();
    } else if (hoverFilter()?.place) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, 4.6, 0, 7);
      ctx.fillStyle = C.halo;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = C.hover;
      ctx.stroke();
      if (opt.labels && tool === "point") {
        ctx.globalAlpha = 0.55;
        label(nextName(), s.x + 12, s.y - 12, C.accent);
        ctx.globalAlpha = 1;
      }
      if (hover.kind === "isect") {
        ctx.font = '500 12px "Golos Text", system-ui, sans-serif';
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.lineWidth = 4;
        ctx.strokeStyle = C.halo;
        ctx.strokeText(hover.label, s.x + 12, s.y + 14);
        ctx.fillStyle = C.hover;
        ctx.fillText(hover.label, s.x + 12, s.y + 14);
      }
    }
  }
  cv.style.cursor =
    down && down.drag
      ? "grabbing"
      : tool === "rotate"
        ? "grab"
        : tool === "pen"
          ? pen.eraser
            ? "cell"
            : "crosshair"
          : hover
            ? "pointer"
            : "crosshair";
}
const I = {
  pen: '<path d="M4 20l1.2-4.4L16 4.8a2 2 0 0 1 2.8 0l.4.4a2 2 0 0 1 0 2.8L8.4 18.8z"/><path d="M14.5 6.5l3 3"/>',
  rotate: '<path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v5h-5"/>',
  point:
    '<path d="M4 19 20 5" opacity=".35"/><circle cx="12" cy="12" r="3.4" fill="currentColor"/>',
  segment:
    '<path d="M5 18 19 6"/><circle cx="5" cy="18" r="2.2" fill="currentColor"/><circle cx="19" cy="6" r="2.2" fill="currentColor"/>',
  line: '<path d="M2 21 22 3"/><circle cx="8" cy="15.6" r="2" fill="currentColor"/><circle cx="16" cy="8.4" r="2" fill="currentColor"/>',
  plane:
    '<path d="M3 17 8 7h13l-5 10z" fill="currentColor" fill-opacity=".15"/><path d="M1 21l2-4M16 17l-2 4M8 7l2-4M21 7l2-4" stroke-dasharray="1.5 2"/>',
  extend: '<path d="M8 16 16 8"/><path d="M2.5 21.5l3-3M18.5 5.5l3-3" stroke-dasharray="1.5 2.5"/>',
  parallel: '<path d="M3 14 14 3M10 21 21 10"/>',
  intersect:
    '<path d="M3 5l18 14M3 19 21 5"/><circle cx="12" cy="12" r="2.4" fill="currentColor"/>',
  section: '<path d="M3 9l6-5 12 4-4 12-12-3z" fill="currentColor" fill-opacity=".2"/>',
  delete: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
};
const TOOLS = [
  ["rotate", "Вращать"],
  ["point", "Точка"],
  ["segment", "Отрезок"],
  ["line", "Прямая"],
  ["extend", "Продлить"],
  ["plane", "Плоскость"],
  ["parallel", "Параллель"],
  ["intersect", "Пересечь"],
  ["section", "Сечение"],
  ["delete", "Удалить"],
  ["pen", "Ручка", "P"],
];
$("#toolbar").innerHTML = TOOLS.map(
  ([id, t, k], i) =>
    `<button class="tool" data-tool="${id}" title="${t} (${k ?? (i + 1) % 10})"><kbd>${k ?? (i + 1) % 10}</kbd><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${I[id]}</svg>${t}</button>`,
).join("");
$("#toolbar").addEventListener("click", (e) => {
  const b = e.target.closest("[data-tool]");
  if (b) setTool(b.dataset.tool);
});
function setTool(id) {
  tool = id;
  pending = [];
  hover = mouse ? computeHover(mouse.x, mouse.y) : null;
  document
    .querySelectorAll(".tool")
    .forEach((b) => b.classList.toggle("on", b.dataset.tool === id));
  $("#penPanel").hidden = id !== "pen";
  if (id === "pen") buildPenPanel();
  req();
}

function updateHint() {
  const n = pending.length;
  const H = {
    rotate:
      "Тяните мышью, чтобы вращать фигуру. Колесо — масштаб, правая кнопка или Shift — сдвиг.",
    point:
      opt.isnap && getIsects().length && !opt.ratio
        ? "Ромбики — пересечения прямых и плоскостей. Наведите на ромбик, и точка встанет ровно в пересечение. Или кликните по ребру, прямой или грани."
        : opt.ratio
          ? `Кликните по ребру или отрезку — точка разделит его в отношении ${$("#rm").value}:${$("#rn").value} от ближнего конца.`
          : "Кликните по ребру, прямой или грани, чтобы поставить точку. У середины ребра срабатывает привязка.",
    segment: n
      ? `Выберите второй конец отрезка (первый — ${pending[0]?.name}).`
      : "Выберите первую точку отрезка — вершину, точку или место на ребре.",
    line: n
      ? `Выберите вторую точку прямой (первая — ${pending[0]?.name}).`
      : "Выберите первую точку, через которую пройдёт прямая.",
    extend:
      "Кликните по ребру или отрезку, чтобы продлить его до прямой. Повторный клик убирает продолжение.",
    parallel: n
      ? `Выберите точку, через которую пройдёт прямая, параллельная ${pending[0]?.line?.name}.`
      : "Выберите ребро или прямую, которой будет параллельна новая прямая.",
    plane:
      "Кликните по грани или сечению, чтобы продлить его плоскость. Повторный клик убирает продолжение.",
    intersect: n
      ? `Выберите второй объект: пересечение с ${(pending[0]?.line || pending[0]?.plane)?.name ?? "шаром"}. Прямая ∩ прямая или прямая ∩ плоскость дают точку, плоскость ∩ плоскость — прямую.`
      : "Выберите прямую, ребро, грань, плоскость или шар. Продолжения достроятся сами.",
    section: `Выберите три точки плоскости сечения: ${n} из 3${n ? " (" + pending.map((p) => p.name).join(", ") + ")" : ""}. Esc — сбросить выбор.`,
    pen: pen.eraser
      ? "Ластик: проведите по рисунку, чтобы стереть штрихи. Правая кнопка — вращение."
      : pen.screen
        ? "Пишите левой кнопкой — штрихи закреплены на экране и не вращаются. Правая кнопка — вращение, E — ластик."
        : "Рисуйте левой кнопкой — штрих ложится на грань или плоскость и вращается вместе с фигурой. Правая кнопка — вращение, E — ластик.",
    delete:
      "Кликните по своей точке, прямой или плоскости, чтобы удалить её. Сечения удаляются из списка слева.",
  };
  $("#hint").textContent = H[tool];
}

function buildShapeButtons() {
  $("#shapes").innerHTML = Object.entries(SHAPES)
    .map(
      ([k, s]) =>
        `<button class="shape${k === shapeType ? " on" : ""}" data-shape="${k}"><svg viewBox="0 0 30 30" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round">${s.icon}</svg>${s.t}</button>`,
    )
    .join("");
}
$("#shapes").addEventListener("click", (e) => {
  const b = e.target.closest("[data-shape]");
  if (!b || b.dataset.shape === shapeType) return;
  shapeType = b.dataset.shape;
  buildShapeButtons();
  buildParams();
  rebuild();
  resetView();
});
function buildParams() {
  const s = SHAPES[shapeType],
    P = vals[shapeType];
  let h = s.p
    .map(
      ([
        k,
        t,
        mn,
        mx,
      ]) => `<div class="slider"><label for="p_${k}">${t}</label><output id="o_${k}">${(+P[k]).toFixed(1)}</output>
    <input type="range" id="p_${k}" data-p="${k}" min="${mn}" max="${mx}" step="0.1" value="${P[k]}"></div>`,
    )
    .join("");
  if (shapeType === "pyr3")
    h += `<button class="minibtn" id="regTet">Сделать правильный тетраэдр</button>`;
  if (shapeType === "pyr4") h += `<button class="minibtn" id="regPyr">Все рёбра равны</button>`;
  $("#params").innerHTML = h;
}
$("#params").addEventListener("input", (e) => {
  const k = e.target.dataset.p;
  if (!k) return;
  vals[shapeType][k] = +e.target.value;
  $("#o_" + k).textContent = (+e.target.value).toFixed(1);
  rebuild();
});
$("#params").addEventListener("click", (e) => {
  const P = vals[shapeType];
  if (e.target.id === "regTet") P.h = +(P.a * Math.sqrt(2 / 3)).toFixed(2);
  else if (e.target.id === "regPyr") P.h = +(P.a / Math.SQRT2).toFixed(2);
  else return;
  buildParams();
  rebuild();
});
const PEN_COLORS = ["ink", "accent", "sec0", "par", "sec2"];
const pen = { color: "accent", w: 3, eraser: false, screen: false };
const strokeScreen = (st) =>
  st.screen ? st.pts.map((p) => ({ x: p[0] + W / 2, y: p[1] + H / 2 })) : st.pts.map(project);
let drawing = null;

function penPlaneAt(mx, my) {
  const saved = tool;
  tool = "plane";
  const h = computeHover(mx, my);
  tool = saved;
  if (h && h.kind === "sphere") return { n: norm(h.pos), c: h.pos, sphere: true };
  if (h && h.plane) return { n: h.plane.n, c: h.plane.c };
  return { n: fromView([0, 0, -1]), c: [0, 0, 0] };
}
function rayOnPlane(mx, my, pl) {
  const r = getRay(mx, my),
    den = dot(pl.n, r.d);
  if (pl.sphere) {
    const hit = lineSphere(r.o, r.d)[0];
    if (hit && hit.t > 0) return hit.p;
  }
  if (Math.abs(den) < 1e-9) return null;
  const t = dot(pl.n, sub(pl.c, r.o)) / den;
  return add(r.o, mul(r.d, t));
}
function penStart(mx, my) {
  if (pen.eraser) {
    drawing = { eraser: true, saved: false };
    penErase(mx, my);
    return;
  }
  if (pen.screen) {
    snapshot();
    const stroke = {
      id: uid++,
      color: pen.color,
      w: pen.w,
      screen: true,
      pts: [[mx - W / 2, my - H / 2, 0]],
    };
    S.strokes.push(stroke);
    drawing = { stroke, last: { x: mx, y: my } };
    req();
    return;
  }
  const plane = penPlaneAt(mx, my),
    p = rayOnPlane(mx, my, plane);
  if (!p) return;
  snapshot();
  const stroke = { id: uid++, color: pen.color, w: pen.w, pts: [p] };
  S.strokes.push(stroke);
  drawing = { stroke, plane, last: { x: mx, y: my } };
  req();
}
function penMove(mx, my) {
  if (!drawing) return;
  if (drawing.eraser) return penErase(mx, my);
  if (Math.hypot(mx - drawing.last.x, my - drawing.last.y) < 1.5) return;
  if (drawing.stroke.screen) {
    drawing.stroke.pts.push([mx - W / 2, my - H / 2, 0]);
    drawing.last = { x: mx, y: my };
    req();
    return;
  }
  const p = rayOnPlane(mx, my, drawing.plane);
  if (!p) return;
  drawing.stroke.pts.push(p);
  drawing.last = { x: mx, y: my };
  req();
}
function penEnd() {
  if (drawing && !drawing.eraser) refreshList();
  drawing = null;
}
function penErase(mx, my) {
  const hit = S.strokes.filter((st) => {
    const sp = strokeScreen(st);
    if (sp.length === 1) return Math.hypot(sp[0].x - mx, sp[0].y - my) < 10;
    for (let i = 1; i < sp.length; i++) if (distSeg(mx, my, sp[i - 1], sp[i]) < 10) return true;
    return false;
  });
  if (!hit.length) return;
  if (!drawing.saved) {
    snapshot();
    drawing.saved = true;
  }
  S.strokes = S.strokes.filter((st) => !hit.includes(st));
  refreshList();
  req();
}
function drawStrokes() {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const st of S.strokes) {
    const sp = strokeScreen(st);
    ctx.strokeStyle = C[st.color] || C.accent;
    ctx.fillStyle = ctx.strokeStyle;
    ctx.lineWidth = st.w;
    if (sp.length === 1) {
      ctx.beginPath();
      ctx.arc(sp[0].x, sp[0].y, st.w / 2, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    ctx.beginPath();
    ctx.moveTo(sp[0].x, sp[0].y);
    for (let i = 1; i < sp.length - 1; i++) {
      const mx = (sp[i].x + sp[i + 1].x) / 2,
        my = (sp[i].y + sp[i + 1].y) / 2;
      ctx.quadraticCurveTo(sp[i].x, sp[i].y, mx, my);
    }
    const last = sp[sp.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
  }
}
function buildPenPanel() {
  $("#penPanel").innerHTML =
    PEN_COLORS.map(
      (c) =>
        `<button class="swatch${!pen.eraser && pen.color === c ? " on" : ""}" data-pcolor="${c}" style="--sw:var(--c-${c})" aria-label="Цвет"></button>`,
    ).join("") +
    '<span class="sep"></span>' +
    [
      [2, "Тонкая"],
      [4, "Средняя"],
      [7, "Толстая"],
    ]
      .map(
        ([w, t]) =>
          `<button class="pw${!pen.eraser && pen.w === w ? " on" : ""}" data-pw="${w}" title="${t}" aria-label="${t}"><i style="width:${w + 2}px;height:${w + 2}px"></i></button>`,
      )
      .join("") +
    '<span class="sep"></span>' +
    `<button class="ptext${pen.screen ? " on" : ""}" data-pscreen="1" title="Штрихи не вращаются вместе с фигурой">Поверх экрана</button>` +
    `<button class="ptext${pen.eraser ? " on" : ""}" data-peraser="1">Ластик</button>` +
    '<button class="ptext" data-pclear="1">Стереть рисунки</button>';
}
$("#penPanel").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.pcolor) {
    pen.color = b.dataset.pcolor;
    pen.eraser = false;
  } else if (b.dataset.pw) {
    pen.w = +b.dataset.pw;
    pen.eraser = false;
  } else if (b.dataset.pscreen) {
    pen.screen = !pen.screen;
    pen.eraser = false;
  } else if (b.dataset.peraser) pen.eraser = !pen.eraser;
  else if (b.dataset.pclear) {
    if (S.strokes.length) {
      snapshot();
      S.strokes = [];
      refreshList();
      toast("Рисунки стёрты. Отменить — Ctrl+Z");
    }
  }
  buildPenPanel();
  req();
});

function hasConstructions() {
  return (
    S.points.length || S.lines.length || S.sections.length || S.planes.length || S.strokes.length
  );
}
function rebuild() {
  buildShape();
  if (hasConstructions()) {
    S.points = [];
    S.lines = [];
    S.sections = [];
    S.planes = [];
    S.strokes = [];
    toast("Фигура изменилась — построения сброшены");
  }
  history = [];
  pending = [];
  hover = null;
  refreshList();
  req();
}

function refreshList() {
  isectCache = null;
  const el = $("#objs");
  if (!hasConstructions()) {
    el.innerHTML =
      '<div class="empty">Здесь появятся точки, прямые и сечения. Начните с точек на рёбрах, затем выберите инструмент «Сечение».</div>';
    return;
  }
  let h = "";
  S.sections.forEach((s) => {
    h += `<div class="obj"><span class="sw" style="background:var(--c-sec${s.color})"></span>
    <div class="oi"><b>${esc(s.name)}</b><small>Сечение, ${s.circle ? "круг, r ≈ " + s.r.toFixed(2) : POLY[s.poly.length] || s.poly.length + "-угольник"}, S ≈ ${s.area.toFixed(2)}</small></div>
    <button class="minibtn" data-secpl="${s.id}" title="Продлить плоскость сечения">${S.planes.some((p) => p.src === "s" + s.id) ? "Скрыть плоскость" : "Продлить"}</button>
    <button class="del" data-del="s${s.id}" aria-label="Удалить сечение">×</button></div>`;
  });
  S.points.forEach((p) => {
    h += `<div class="obj"><span class="sw dot" style="background:${p.kind === "sec" ? "var(--c-sec0)" : "var(--c-accent)"}"></span>
    <div class="oi"><input value="${esc(p.name)}" data-ren="${p.id}" aria-label="Имя точки"><small>${p.kind === "sec" ? "Вершина сечения" : "Точка"} (${p.p.map((x) => x.toFixed(2)).join("; ")})</small></div>
    <button class="del" data-del="p${p.id}" aria-label="Удалить точку">×</button></div>`;
  });
  S.planes.forEach((p) => {
    h += `<div class="obj"><span class="sw" style="background:var(--c-plane);opacity:.7"></span>
    <div class="oi"><b>${esc(p.name)}</b><small>Плоскость ${p.kind === "sec" ? "сечения" : "грани"}, продлена</small></div>
    <button class="del" data-del="q${p.id}" aria-label="Удалить плоскость">×</button></div>`;
  });
  if (S.strokes.length)
    h += `<div class="obj"><span class="sw" style="background:var(--c-${pen.color})"></span>
    <div class="oi"><b>Рисунки</b><small>Штрихов ручкой: ${S.strokes.length}</small></div>
    <button class="del" data-del="d0" aria-label="Стереть рисунки">×</button></div>`;
  const TL = {
    seg: "Отрезок",
    line: "Прямая",
    ext: "Продолжение ребра",
    par: "Параллельная прямая",
    trace: "Линия пересечения плоскостей",
  };
  S.lines.forEach((l) => {
    const extra =
      l.kind === "seg" ? `, длина ${len(sub(l.b, l.a)).toFixed(2)}${l.ext ? ", продлён" : ""}` : "";
    h += `<div class="obj"><span class="sw" style="background:${l.kind === "par" ? "var(--c-par)" : "var(--c-accent)"};height:3px"></span>
    <div class="oi"><b>${esc(l.name)}</b><small>${TL[l.kind]}${extra}</small></div>
    <button class="del" data-del="l${l.id}" aria-label="Удалить">×</button></div>`;
  });
  el.innerHTML = h;
}
$("#objs").addEventListener("click", (e) => {
  const sp = e.target.dataset.secpl;
  if (sp) {
    const s = S.sections.find((x) => x.id === +sp);
    if (!s) return;
    snapshot();
    const k = "s" + s.id;
    if (S.planes.some((p) => p.src === k)) S.planes = S.planes.filter((p) => p.src !== k);
    else extendPlane(secPlane(s));
    refreshList();
    req();
    return;
  }
  const d = e.target.dataset.del;
  if (!d) return;
  const id = +d.slice(1);
  snapshot();
  if (d[0] === "s") S.sections = S.sections.filter((x) => x.id !== id);
  if (d[0] === "p") S.points = S.points.filter((x) => x.id !== id);
  if (d[0] === "l") S.lines = S.lines.filter((x) => x.id !== id);
  if (d[0] === "d") S.strokes = [];
  if (d[0] === "q") S.planes = S.planes.filter((x) => x.id !== id);
  if (d[0] === "s") S.planes = S.planes.filter((x) => x.src !== "s" + id);
  pending = [];
  hover = null;
  refreshList();
  req();
});
$("#objs").addEventListener("change", (e) => {
  const id = +e.target.dataset.ren;
  if (!id) return;
  const p = S.points.find((x) => x.id === id),
    nv = e.target.value.trim();
  if (!p) return;
  if (!nv || allPoints().some((q) => q !== p && q.name === nv)) {
    toast(nv ? `Имя ${nv} уже занято` : "Имя не может быть пустым");
    e.target.value = p.name;
    return;
  }
  snapshot();
  p.name = nv;
  req();
});

document.querySelectorAll("[data-opt]").forEach((cb) =>
  cb.addEventListener("change", () => {
    const k = cb.dataset.opt;
    opt[k] = cb.checked;
    if (k === "ortho") resetView();
    hover = null;
    req();
  }),
);
["#rm", "#rn"].forEach((s) => $(s).addEventListener("input", req));

let toastT = 0;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove("show"), 2600);
}

$("#undo").onclick = $("#undo2").onclick = undo;
$("#clear").onclick = () => {
  if (!hasConstructions()) return;
  snapshot();
  S.points = [];
  S.lines = [];
  S.sections = [];
  S.planes = [];
  S.strokes = [];
  pending = [];
  hover = null;
  refreshList();
  req();
  toast("Построения очищены. Отменить — Ctrl+Z");
};
$("#resetView").onclick = resetView;
const zoom = (k) => {
  cam.dist = clamp(cam.dist * k, shape.size * (opt.ortho ? 1 : 2.2), shape.size * 9);
  req();
};
$("#zin").onclick = () => zoom(1 / 1.15);
$("#zout").onclick = () => zoom(1.15);
let down = null;
cv.addEventListener("pointerdown", (e) => {
  cv.setPointerCapture(e.pointerId);
  if (tool === "pen" && e.button === 0 && !e.shiftKey) {
    down = { pen: true };
    penStart(e.offsetX, e.offsetY);
    return;
  }
  down = {
    x: e.offsetX,
    y: e.offsetY,
    btn: e.button,
    pan: tool === "pen" ? e.button === 1 || e.shiftKey : e.button !== 0 || e.shiftKey,
    drag: false,
    yaw: cam.yaw,
    pitch: cam.pitch,
    px: pan.x,
    py: pan.y,
  };
});
cv.addEventListener("pointermove", (e) => {
  mouse = { x: e.offsetX, y: e.offsetY };
  if (down && down.pen) {
    penMove(e.offsetX, e.offsetY);
    return;
  }
  if (down) {
    const dx = e.offsetX - down.x,
      dy = e.offsetY - down.y;
    if (!down.drag && Math.hypot(dx, dy) > 4) down.drag = true;
    if (down.drag) {
      if (down.pan) {
        pan.x = down.px + dx;
        pan.y = down.py + dy;
      } else {
        cam.yaw = down.yaw - dx * 0.008;
        cam.pitch = clamp(down.pitch + dy * 0.008, -1.55, 1.55);
      }
      hover = null;
      req();
      return;
    }
  }
  hover = computeHover(mouse.x, mouse.y);
  req();
});
cv.addEventListener("pointerup", (e) => {
  const d = down;
  down = null;
  if (d && d.pen) {
    penEnd();
    return;
  }
  if (d && !d.drag && d.btn === 0) onClick(e.offsetX, e.offsetY);
  else {
    hover = computeHover(e.offsetX, e.offsetY);
    req();
  }
});
cv.addEventListener("pointerleave", () => {
  if (!down) {
    hover = null;
    mouse = null;
    req();
  }
});
cv.addEventListener("pointercancel", () => {
  if (down && down.pen) penEnd();
  down = null;
});
cv.addEventListener("contextmenu", (e) => e.preventDefault());
cv.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    zoom(Math.exp(e.deltaY * 0.0012));
  },
  { passive: false },
);
addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT") return;
  if (
    ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") ||
    ((e.ctrlKey || e.metaKey) && e.code === "KeyZ")
  ) {
    e.preventDefault();
    undo();
    return;
  }
  if ((e.ctrlKey || e.metaKey) && e.code === "KeyS") {
    e.preventDefault();
    saveToFile();
    return;
  }
  if ((e.ctrlKey || e.metaKey) && e.code === "KeyO") {
    e.preventDefault();
    $("#fileInput").click();
    return;
  }
  if (e.key === "Escape") {
    pending = [];
    req();
    return;
  }
  if (e.code === "KeyP" && !e.ctrlKey && !e.metaKey) {
    setTool("pen");
    return;
  }
  if (e.code === "KeyE" && tool === "pen") {
    pen.eraser = !pen.eraser;
    buildPenPanel();
    req();
    return;
  }
  if (/^[0-9]$/.test(e.key)) {
    const i = (+e.key + 9) % 10;
    if (TOOLS[i]) setTool(TOOLS[i][0]);
  }
});
const FILE_FORMAT = "stereometry";

async function saveToFile() {
  const data = {
    format: FILE_FORMAT,
    version: 1,
    shape: shapeType,
    params: vals[shapeType],
    view: { yaw: cam.yaw, pitch: cam.pitch, dist: cam.dist, ortho: opt.ortho },
    uid,
    constructions: S,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  const fileName = `stereometry-${shapeType}-${stamp}.json`;
  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [{ description: "Построения", accept: { "application/json": [".json"] } }],
      });
      const w = await handle.createWritable();
      await w.write(blob);
      await w.close();
      toast(`Сохранено: ${handle.name}`);
      return;
    } catch (err) {
      if (err.name === "AbortError") return;
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast("Построения сохранены в файл");
}

function isVec(v) {
  return Array.isArray(v) && v.length === 3 && v.every(Number.isFinite);
}

function loadData(data) {
  if (!data || data.format !== FILE_FORMAT || !SHAPES[data.shape]) {
    throw new Error("Это не файл конструктора сечений");
  }
  const c = data.constructions || {};
  const points = (c.points || []).filter((p) => isVec(p.p) && p.name);
  const lines = (c.lines || []).filter((l) => isVec(l.a) && isVec(l.b));
  const sections = (c.sections || []).filter(
    (s) => Array.isArray(s.poly) && s.poly.length >= 3 && s.poly.every(isVec),
  );
  const strokes = (c.strokes || [])
    .filter((st) => Array.isArray(st.pts) && st.pts.length && st.pts.every(isVec))
    .map((st) => ({
      id: +st.id || 0,
      color: PEN_COLORS.includes(st.color) ? st.color : "accent",
      w: clamp(+st.w || 3, 1, 12),
      screen: !!st.screen,
      pts: st.pts,
    }));
  const planes = (c.planes || []).filter(
    (p) => isVec(p.n) && isVec(p.c) && isVec(p.e1) && isVec(p.e2),
  );

  shapeType = data.shape;
  for (const [k, , mn, mx] of SHAPES[shapeType].p) {
    const v = +data.params?.[k];
    if (Number.isFinite(v)) vals[shapeType][k] = clamp(v, mn, mx);
  }
  buildShapeButtons();
  buildParams();
  buildShape();

  S.points = points;
  S.lines = lines;
  S.sections = sections;
  S.planes = planes;
  S.strokes = strokes;
  const ids = [...points, ...lines, ...sections, ...planes, ...strokes].map((o) => +o.id || 0);
  uid = Math.max(+data.uid || 1, ...ids.map((i) => i + 1));
  history = [];
  pending = [];
  hover = null;

  if (typeof data.view?.ortho === "boolean") {
    opt.ortho = data.view.ortho;
    $('[data-opt="ortho"]').checked = opt.ortho;
  }
  resetView();
  if (data.view) {
    const { yaw, pitch, dist } = data.view;
    if (Number.isFinite(yaw)) cam.yaw = yaw;
    if (Number.isFinite(pitch)) cam.pitch = clamp(pitch, -1.55, 1.55);
    if (Number.isFinite(dist)) cam.dist = clamp(dist, shape.size, shape.size * 9);
  }
  refreshList();
  req();
}

async function openFile(file) {
  if (!file) return;
  try {
    loadData(JSON.parse(await file.text()));
    toast(`Открыт файл ${file.name}`);
  } catch (err) {
    toast(err instanceof SyntaxError ? "Файл повреждён: не удалось прочитать JSON" : err.message);
  }
}

$("#saveFile").onclick = saveToFile;
$("#openFile").onclick = () => $("#fileInput").click();
$("#fileInput").addEventListener("change", (e) => {
  openFile(e.target.files[0]);
  e.target.value = "";
});
$("#wrap").addEventListener("dragover", (e) => e.preventDefault());
$("#wrap").addEventListener("drop", (e) => {
  e.preventDefault();
  openFile(e.dataTransfer.files[0]);
});

function resize() {
  const r = $("#wrap").getBoundingClientRect();
  DPR = window.devicePixelRatio || 1;
  W = r.width;
  H = r.height;
  cv.width = Math.round(W * DPR);
  cv.height = Math.round(H * DPR);
  F = Math.min(W, H) * 0.95;
  req();
}
new ResizeObserver(resize).observe($("#wrap"));
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", readColors);
new MutationObserver(readColors).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["data-theme"],
});

buildShapeButtons();
buildParams();
buildShape();
refreshList();
readColors();
setTool("point");
resize();
resetView();
document.fonts && document.fonts.ready.then(readColors);
addEventListener("load", readColors);
addEventListener("pageshow", readColors);
