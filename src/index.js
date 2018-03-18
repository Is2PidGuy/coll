
import keys from './keys';
import Rect from './shape';

import './styles.css';

const root = document.getElementById('root');
const w = root.clientWidth;
const h = root.clientHeight;
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = w;
canvas.height = h;

const drawLine = (a, b, color = 'black', width = 1) => {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
};

const drawRect = (rect, color) => {
    const [ a, b, c, d ] = rect.points;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(c.x, c.y);
    ctx.lineTo(d.x, d.y);
    ctx.lineTo(a.x, a.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
};

const generateTerrain = (N, start, curve = 'down') => {
    const f1 = () => 20;
    const f2 = () => Math.random() * 30 + 10;
    const param = curve === 'down' ? ({ dx: f1, dy: f2 }) : ({ dx: f2, dy: () => -f2() });
    const points = [];
    let x = start.x;
    let y = start.y;
    for (let i = 0; i < N; i += 1) {
        points.push({
            x, y,
        });
        x += param.dx();
        y += param.dy();
    }
    return points;
};

// const sideA = generateTerrain(25, { x: 20, y: 200 });
// const sideB = generateTerrain(30, { x: 250, y: 200 });

const sideA = [];
const sideB = [];

const getRc = () => {
    const sx = 500;
    const wid = 50;
    const sy = 500;
    const a = { x: sx, y: sy };
    const b = { x: sx + wid, y: sy };
    const c = { x: sx + wid, y: sy - wid };
    const d = { x: sx, y: sy - wid };
    return new Rect(a, b, c, d);
};

const rc = getRc();

const intersect = (a1, a2, b1, b2) => {
    const pq = { x: b1.x - a1.x, y: b1.y - a1.y };
    const r = { x: a2.x - a1.x, y: a2.y - a1.y };
    const s = { x: b2.x - b1.x, y: b2.y - b1.y };
    const d = r.x * s.y - r.y * s.x;
    if (d === 0) return -1;
    const u =  (pq.x * r.y - pq.y * r.x) / d;
    if (u < 0 || u > 1) return -1;
    const t =  (pq.x * s.y - pq.y * s.x) / d;
    return Math.abs(t) < 1e-4 ? 0 : t;
};

document.addEventListener('mousedown', e => {
    const ref = e.button === 1 ? sideB : sideA;
    ref.push({ x: e.pageX, y: e.pageY });
});

const centroid = (points) => {
    let x = 0;
    let y = 0;
    points.forEach(d => {
        x += d.x;
        y += d.y;
    });
    return {
        x: x / points.length,
        y: y / points.length,
    };
};

const distance = (p1, p2) => {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
};

const sub = (p1, p2) => {
    return { x: p2.x - p1.x, y: p2.y - p1.y };
};

const dot = (p1, p2) => {
    return p1.x * p2.x + p1.y * p2.y;
};

const normalize = (p) => {
    let h = Math.hypot(p.x, p.y);
    if (h === 0) h = 1;
    return { x: p.x / h, y: p.y / h }
};

const perpendicular = (p1, p2, p) => {
    const dist = distance(p1, p2);
    let v = sub(p1, p2);
    v = { x: v.x / dist, y: v.y / dist };
    let normal = { x: v.y, y: -v.x };
    const l = sub(p1, p);
    // if (dot(normal, l) < 0) {
    //     normal = { x: -normal.x, y: -normal.y };
    // }
    const dist2 = Math.abs(dot(l, normal)); 
    const proj = dot(v, l);
    const point = { x: proj * v.x + p1.x, y: proj * v.y + p1.y };
    return {
        distance: dist2,
        point,
        outOfBounds: proj < 0 || proj > dist,
    };
};

const getDistance = (p1, p2, pt) => {
    let mind = distance(p1, pt);
    let np = p1;
    let d = distance(p2, pt);
    if (d < mind) {
        mind = d;
        np = p2;
    }
    d = perpendicular(p1, p2, pt);
    if (!d.outOfBounds && d.distance < mind) {
        mind = d.distance;
        np = d.point;
    }
    return { 
        distance: mind, 
        line: {
            p1: np,
            p2: pt,
        },
    };
};

setInterval(
    () => {
        if (keys['ArrowLeft']) {
            rc.vel.x -= 0.2;
        }
        if (keys['ArrowRight']) {
            rc.vel.x += 0.2;
        }
        if (keys['ArrowUp']) {
            rc.vel.y -= 0.2;
        }
        if (keys['ArrowDown']) {
            rc.vel.y += 0.2;
        }
        rc.vel.x *= 0.99;
        rc.vel.y *= 0.99;
        const oldRc = rc.points.map(d => ({ x: d.x, y: d.y }));
        rc.points.forEach(d => {
            d.x += rc.vel.x;
            d.y += rc.vel.y;
        });

        let intt = 1.5;
        let line;
        let dx = rc.vel.x;
        let dy = rc.vel.y;
        const sides = [sideA, sideB].forEach(side => {
            if (line) return;
            for (let i = 1; i < side.length; i += 1) {
                const p1 = side[i - 1];
                const p2 = side[i];
                rc.points.forEach(p => {
                    const oldp = { x: p.x - rc.vel.x, y: p.y - rc.vel.y };
                    const i = intersect(oldp, p, p1, p2);
                    if (i > 0 && i < 1) {
                        if (i < intt) {
                            intt = i;
                            line = { p1, p2 };
                        }
                    }
                });
            }

            if (!line) return;

            const Dx = (1 - intt + 0.1) * dx;
            const Dy = (1 - intt + 0.1) * dy;
            dx -= Dx;
            dy -= Dy;
            rc.points.forEach(p => {
                p.x -= Dx;
                p.y -= Dy;
            });
        });

        let low = 0, high = 1;
        let lastLine;
        while (high - low > 0.0005) {
            const mid = (low + high) / 2;
            let ints = false;
            rc.points.forEach(p => {
                p.x -= dx - mid * dx;
                p.y -= dy - mid * dy;
            });
            [sideA, sideB].forEach(side => {
                if (ints) return;
                for (let i = 1; i < side.length; i += 1) {
                    const p1 = side[i - 1];
                    const p2 = side[i];
                    for (let j = 0; j < rc.points.length; j += 1) {
                        if (ints) return;
                        const a = rc.points[j];
                        const b = rc.points[(j + 1) % rc.points.length];
                        const i = intersect(a, b, p1, p2);
                        if (i > 0 && i < 1) {
                            ints = true;
                            lastLine = { p1, p2 };
                        }
                        if (ints) break;
                    }
                }
            });
            if (ints) {
                high = mid;
            } else {
                low = mid;
            }
            rc.points.forEach(p => {
                p.x += (1 - mid) * dx;
                p.y += (1 - mid) * dy;
            });
        }

        if (high < 1) {
            rc.points.forEach(p => {
                p.x -= dx - low * dx;
                p.y -= dy - low * dy;
            });
        }
        let axis;
        if (line || lastLine) {
            const ln = lastLine ? lastLine : line;
            let d = oldRc.map(d => {
                return getDistance(ln.p1, ln.p2, d);
            });
            oldRc.forEach((p, i) => {
                const L = d.length;
                d.push(getDistance(p, oldRc[(i + 1) % oldRc.length], ln.p1));
                d.push(getDistance(p, oldRc[(i + 1) % oldRc.length], ln.p2));
                d[L].line = { p1: d[L].line.p2, p2: d[L].line.p1 };
                d[L + 1].line = { p1: d[L + 1].line.p2, p2: d[L + 1].line.p1 };
            });
            const mind = Math.min(...d.map(d => d.distance));
            const ch = d.filter(d => d.distance === mind);
            const filt = ch[0];
            axis = filt;
            const normal = normalize(sub(filt.line.p1, filt.line.p2));
            const tangent = { x: normal.y, y: -normal.x };
            let norm = dot(rc.vel, normal);
            const dt = dot(rc.vel, tangent);
            rc.points.forEach(d => {
                d.x += dt * tangent.x;
                d.y += dt * tangent.y;
            });
            if (norm > 0) {
                console.log('ehll');
            }
            if (norm < 0) {
                rc.vel.x -= 1.5 * norm * normal.x;
                rc.vel.y -= 1.5 * norm * normal.y;
            }
        }

        // render
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, w, h);
        for (let i = 1; i < sideA.length; i += 1) {
            drawLine(sideA[i - 1], sideA[i], 'black', 3);
        }
        for (let i = 1; i < sideB.length; i += 1) {
            drawLine(sideB[i - 1], sideB[i], 'green', 3);
        }
        drawRect(rc, 'black');
    },
    20,
);
