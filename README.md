# Maze Generator + Solver

Generates perfect mazes (recursive backtracker — exactly one path between any two cells, no loops, no dead isolated areas) and solves them three ways. Zero dependencies, runs in Node and the browser.

An honest note: this repo was previously a single aspirational file referencing TensorFlow, Redis, and "quantum-resistant" libraries it never actually used. This is a ground-up rewrite — real algorithms, tested, runnable.

## Algorithms

| Component | Algorithm | Guarantee |
|---|---|---|
| Generator | Recursive backtracker (iterative, explicit stack) | Perfect maze |
| Solver 1 | BFS | Shortest path |
| Solver 2 | A* (Manhattan heuristic + binary heap) | Shortest path, explores fewer cells |
| Solver 3 | DFS | Fast, path not guaranteed shortest |

Measured on 20×20 mazes: A* explores fewer-or-equal cells than BFS in 30/30 trials while finding the identical shortest path.

## Run it

```bash
node test.js        # verification suite (correctness + efficiency)
npm run demo        # ASCII maze with A* path in your terminal
```

Open `demo.html` in a browser for the visual version: generate mazes, watch BFS / A* / DFS solve them with live stats (path length, cells explored, time).

## Files

- `maze.js` — generator, binary heap, all three solvers, ASCII renderer (UMD: `require` in Node, `<script>` in browser)
- `demo.html` — interactive visual demo
- `test.js` — correctness + efficiency verification

## API

```js
const { Maze } = require('./maze.js');
const maze = new Maze(25, 18).generate();

maze.solveBFS();    // { path: [[r,c],...], visitedCount }
maze.solveAStar();  // { path, visitedCount } — same shortest path, fewer visits
maze.solveDFS();    // { path, visitedCount } — valid path, not necessarily shortest
maze.isPerfect();   // true — every cell reachable
console.log(maze.toString(path));  // ASCII art
```
