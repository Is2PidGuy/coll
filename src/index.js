
import keys from './keys';

import './styles.css';

const root = document.getElementById('root');
const w = root.clientWidth;
const h = root.clientHeight;
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = w;
canvas.height = h;

class Rect {
    constructor(a, b, c, d) {
        this.points = [a, b, c, d];
        this.vel = { x: 0, y: 0 };
    }
}

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
        rc.points.forEach(d => {
            d.x += rc.vel.x;
            d.y += rc.vel.y;
        });

        let intt = 1.5;
        let line;
        const sides = [sideA, sideB].forEach(side => {
            if (line) return;
            for (let i = 1; i < side.length; i += 1) {
                const p1 = side[i - 1];
                const p2 = side[i];
                rc.points.forEach(p => {
                    const oldp = { x: p.x - rc.vel.x, y: p.y - rc.vel.y };
                    const i = intersect(oldp, p, p1, p2);
                    if (i >= -0.05 && i <= 1.005) {
                        if (i < intt) {
                            intt = i;
                            line = { p1, p2 };
                        }
                    }
                });
            }

            if (line) {
                rc.points.forEach(p => {
                    p.x -= (1 - intt + 0.1) * rc.vel.x;
                    p.y -= (1 - intt + 0.1) * rc.vel.y;
                });
                let normal = { x: line.p1.x - line.p2.x, y: line.p1.y - line.p2.y };
                const mag = Math.hypot(normal.x, normal.y);
                normal.x /= mag;
                normal.y /= mag;
                normal = { x: -normal.y, y: normal.x };

                const norm = rc.vel.x * normal.x + rc.vel.y * normal.y;
                rc.vel.x -= 1.5 * norm * normal.x;
                rc.vel.y -= 1.5 * norm * normal.y;
            }
        });

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
        if (line) {
            drawLine(line.p1, line.p2, 'red', 8);
        }
    },
    20,
);
