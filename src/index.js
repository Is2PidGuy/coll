
import keys from './keys';
import Rect from './shape';

import { vec, sub, add, normalize, dot, intersect, getDistance, scale } from './math';

import { collision } from './collision';

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
        points.push(vec(x, y));
        x += param.dx();
        y += param.dy();
    }
    return points;
};

const sides = [[]];

const getRc = () => {
    const sx = 500;
    const wid = 50;
    const sy = 500;
    const a = vec(sx, sy);
    const b = vec(sx + wid, sy);
    const c = vec(sx + wid, sy - wid);
    const d = vec(sx, sy - wid);
    return new Rect(a, b, c, d);
};

const rc = getRc();

document.addEventListener('mousedown', e => {
    if (e.button === 1) {
        sides.push([]);
        return;
    }
    sides[sides.length - 1].push(vec(e.pageX, e.pageY));
});

let lcoll = false;
setInterval(
    () => {
        if (keys['ArrowLeft']) {
            rc.vel.x -= 0.2;
        }
        if (keys['ArrowRight']) {
            rc.vel.x += 0.2;
        }
        if (keys[' ']) {
            if (lcoll) {
                rc.vel.y -= 8;
            }
        }
        if (keys['ArrowUp']) {
            rc.vel.y -= 0.2;
        }
        if (keys['ArrowDown']) {
            rc.vel.y += 0.2;
        }
        rc.vel.y += 0.1;
        rc.vel = scale(rc.vel, 0.99);
        const nv = collision(rc, sides, rc.vel);
        // for the tangent component of velocity
        if (nv) {
            collision(rc, sides, nv);
            lcoll = true;
        } else lcoll = false;
        // render

        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, w, h);
        sides.forEach(side => {
            for (let i = 1; i < side.length; i += 1) {
                drawLine(side[i - 1], side[i], 'black', 3);
            }
        });
        drawRect(rc, 'black');
    },
    20,
);
