// Maze generator + solvers. Zero dependencies. Runs in Node and the browser.
//
// Generator: iterative recursive backtracker -> produces a "perfect" maze
//   (exactly one path between any two cells, no loops, no isolated areas).
// Solvers: BFS (guaranteed shortest), A* with Manhattan heuristic
//   (guaranteed shortest, explores fewer cells), DFS (fast, not shortest).

class BinaryHeap {
    constructor(scoreFn) {
        this.items = [];
        this.scoreFn = scoreFn;
    }
    get size() { return this.items.length; }
    push(item) {
        this.items.push(item);
        this._bubbleUp(this.items.length - 1);
    }
    pop() {
        const top = this.items[0];
        const end = this.items.pop();
        if (this.items.length > 0) {
            this.items[0] = end;
            this._sinkDown(0);
        }
        return top;
    }
    _bubbleUp(i) {
        const item = this.items[i];
        while (i > 0) {
            const parent = (i - 1) >> 1;
            if (this.scoreFn(item) >= this.scoreFn(this.items[parent])) break;
            this.items[i] = this.items[parent];
            i = parent;
        }
        this.items[i] = item;
    }
    _sinkDown(i) {
        const item = this.items[i];
        const n = this.items.length;
        for (;;) {
            const left = 2 * i + 1, right = 2 * i + 2;
            let smallest = i;
            if (left < n && this.scoreFn(this.items[left]) < this.scoreFn(this.items[smallest])) smallest = left;
            if (right < n && this.scoreFn(this.items[right]) < this.scoreFn(this.items[smallest])) smallest = right;
            if (smallest === i) break;
            this.items[i] = this.items[smallest];
            i = smallest;
        }
        this.items[i] = item;
    }
}

class Maze {
    constructor(cols, rows) {
        this.cols = cols;
        this.rows = rows;
        // walls: true = wall present. cell key: r * cols + c
        this.walls = new Array(cols * rows);
        for (let i = 0; i < this.walls.length; i++) {
            this.walls[i] = { n: true, e: true, s: true, w: true };
        }
    }

    key(r, c) { return r * this.cols + c; }
    inBounds(r, c) { return r >= 0 && r < this.rows && c >= 0 && c < this.cols; }

    // Iterative recursive backtracker.
    generate(rand = Math.random) {
        const visited = new Array(this.cols * this.rows).fill(false);
        const stack = [[0, 0]];
        visited[0] = true;
        const dirs = [[-1, 0, 'n', 's'], [0, 1, 'e', 'w'], [1, 0, 's', 'n'], [0, -1, 'w', 'e']];

        while (stack.length > 0) {
            const [r, c] = stack[stack.length - 1];
            const options = [];
            for (const [dr, dc, wall, opp] of dirs) {
                const nr = r + dr, nc = c + dc;
                if (this.inBounds(nr, nc) && !visited[this.key(nr, nc)]) {
                    options.push([nr, nc, wall, opp]);
                }
            }
            if (options.length === 0) {
                stack.pop(); // backtrack
            } else {
                const [nr, nc, wall, opp] = options[(rand() * options.length) | 0];
                this.walls[this.key(r, c)][wall] = false;
                this.walls[this.key(nr, nc)][opp] = false;
                visited[this.key(nr, nc)] = true;
                stack.push([nr, nc]);
            }
        }
        return this;
    }

    // Reachable neighbors of (r, c) — i.e. no wall between.
    neighbors(r, c) {
        const out = [];
        const w = this.walls[this.key(r, c)];
        if (!w.n && this.inBounds(r - 1, c)) out.push([r - 1, c]);
        if (!w.e && this.inBounds(r, c + 1)) out.push([r, c + 1]);
        if (!w.s && this.inBounds(r + 1, c)) out.push([r + 1, c]);
        if (!w.w && this.inBounds(r, c - 1)) out.push([r, c - 1]);
        return out;
    }

    // A maze is "perfect" if every cell is reachable from (0,0).
    isPerfect() {
        const seen = new Set([0]);
        const queue = [[0, 0]];
        while (queue.length > 0) {
            const [r, c] = queue.shift();
            for (const [nr, nc] of this.neighbors(r, c)) {
                const k = this.key(nr, nc);
                if (!seen.has(k)) { seen.add(k); queue.push([nr, nc]); }
            }
        }
        return seen.size === this.cols * this.rows;
    }

    _reconstruct(cameFrom, goalKey) {
        const path = [];
        let k = goalKey;
        while (k !== undefined) {
            path.push([Math.floor(k / this.cols), k % this.cols]);
            k = cameFrom.get(k);
        }
        return path.reverse();
    }

    // BFS — guaranteed shortest path. Returns { path, visitedCount }.
    solveBFS(start = [0, 0], goal = null) {
        goal = goal || [this.rows - 1, this.cols - 1];
        const goalKey = this.key(goal[0], goal[1]);
        const cameFrom = new Map([[this.key(start[0], start[1]), undefined]]);
        const queue = [start];
        let visitedCount = 0;
        while (queue.length > 0) {
            const [r, c] = queue.shift();
            visitedCount++;
            if (this.key(r, c) === goalKey) {
                return { path: this._reconstruct(cameFrom, goalKey), visitedCount };
            }
            for (const [nr, nc] of this.neighbors(r, c)) {
                const k = this.key(nr, nc);
                if (!cameFrom.has(k)) {
                    cameFrom.set(k, this.key(r, c));
                    queue.push([nr, nc]);
                }
            }
        }
        return { path: null, visitedCount }; // unreachable (can't happen in a perfect maze)
    }

    // DFS — fast, but the path is not guaranteed shortest.
    solveDFS(start = [0, 0], goal = null) {
        goal = goal || [this.rows - 1, this.cols - 1];
        const goalKey = this.key(goal[0], goal[1]);
        const cameFrom = new Map([[this.key(start[0], start[1]), undefined]]);
        const stack = [start];
        let visitedCount = 0;
        while (stack.length > 0) {
            const [r, c] = stack.pop();
            visitedCount++;
            if (this.key(r, c) === goalKey) {
                return { path: this._reconstruct(cameFrom, goalKey), visitedCount };
            }
            for (const [nr, nc] of this.neighbors(r, c)) {
                const k = this.key(nr, nc);
                if (!cameFrom.has(k)) {
                    cameFrom.set(k, this.key(r, c));
                    stack.push([nr, nc]);
                }
            }
        }
        return { path: null, visitedCount };
    }

    // A* with Manhattan heuristic — guaranteed shortest, explores fewer cells than BFS.
    solveAStar(start = [0, 0], goal = null) {
        goal = goal || [this.rows - 1, this.cols - 1];
        const goalKey = this.key(goal[0], goal[1]);
        const h = (r, c) => Math.abs(r - goal[0]) + Math.abs(c - goal[1]);
        const gScore = new Map([[this.key(start[0], start[1]), 0]]);
        const cameFrom = new Map([[this.key(start[0], start[1]), undefined]]);
        const open = new BinaryHeap(item => item.f);
        open.push({ r: start[0], c: start[1], f: h(start[0], start[1]) });
        const closed = new Set();
        let visitedCount = 0;

        while (open.size > 0) {
            const { r, c } = open.pop();
            const k = this.key(r, c);
            if (closed.has(k)) continue;
            closed.add(k);
            visitedCount++;
            if (k === goalKey) {
                return { path: this._reconstruct(cameFrom, goalKey), visitedCount };
            }
            for (const [nr, nc] of this.neighbors(r, c)) {
                const nk = this.key(nr, nc);
                if (closed.has(nk)) continue;
                const tentative = gScore.get(k) + 1;
                if (tentative < (gScore.get(nk) === undefined ? Infinity : gScore.get(nk))) {
                    gScore.set(nk, tentative);
                    cameFrom.set(nk, k);
                    open.push({ r: nr, c: nc, f: tentative + h(nr, nc) });
                }
            }
        }
        return { path: null, visitedCount };
    }

    // ASCII rendering (for the terminal demo).
    toString(path = null) {
        const pathSet = new Set((path || []).map(([r, c]) => this.key(r, c)));
        let out = '+' + '---+'.repeat(this.cols) + '\n';
        for (let r = 0; r < this.rows; r++) {
            let top = '|', bottom = '+';
            for (let c = 0; c < this.cols; c++) {
                const w = this.walls[this.key(r, c)];
                const mark = pathSet.has(this.key(r, c)) ? ' * ' : '   ';
                top += mark + (w.e ? '|' : ' ');
                bottom += (w.s ? '---' : '   ') + '+';
            }
            out += top + '\n' + bottom + '\n';
        }
        return out;
    }
}

if (typeof module !== 'undefined') {
    module.exports = { Maze, BinaryHeap };
}
