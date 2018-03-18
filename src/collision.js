/**
 * Created by uttam on 3/18/18.
 */

import { vec, sub, add, normalize, dot, intersect, getDistance, scale } from './math';

export const collision = (rc, sides, vel) => {
    const oldRc = rc.points.map(d => vec(d.x, d.y));
    rc.points = rc.points.map(d => {
        return add(d, vel);
    });

    let intt = 1.5;
    let line;
    let dx = vel.x;
    let dy = vel.y;
    sides.forEach(side => {
        if (line) return;
        for (let i = 1; i < side.length; i += 1) {
            const p1 = side[i - 1];
            const p2 = side[i];
            rc.points.forEach(p => {
                const oldp = sub(vel, p);
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

        const del = scale(vec(dx, dy), 1 - intt + 0.1);
        dx -= del.x;
        dy -= del.y;
        rc.points = rc.points.map(p => {
            return add(p, scale(del, -1));
        });
    });

    let low = 0, high = 1;
    let lastLine;
    while (high - low > 0.0005) {
        const mid = (low + high) / 2;
        let ints = false;
        rc.points = rc.points.map(p => {
            return sub(vec(dx - mid * dx, dy - mid * dy), p);
        });
        sides.forEach(side => {
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
        rc.points = rc.points.map(p => {
            return add(p, scale(vec(dx, dy), 1 - mid));
        });
    }

    if (high < 1) {
        rc.points = rc.points.map(p => {
            return sub(scale(vec(dx, dy), 1 - low), p);
        });
    }
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
        const normal = normalize(sub(filt.line.p1, filt.line.p2));
        const tangent = vec(normal.y, -normal.x);
        let norm = dot(rc.vel, normal);
        const dt = dot(rc.vel, tangent);
        if (norm > 0) {
            console.log('ehll');
        }
        if (norm < 0) {
            rc.vel = sub(scale(normal, 1.5 * norm), rc.vel);
        }
        return scale(tangent, dt);
    }
};