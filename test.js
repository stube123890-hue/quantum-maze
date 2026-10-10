// Verification for the maze generator + solvers. Run: node test.js
const assert = require('assert');
const { Maze } = require('./maze.js');

console.log('--- generated mazes are perfect (all cells reachable) ---');
for (let t = 0; t < 20; t++) {
    const m = new Maze(15, 15).generate();
    assert(m.isPerfect(), `trial ${t}: maze must be perfect`);
}
console.log('PASS: 20/20 mazes perfect');

console.log('--- BFS and A* agree on shortest path; DFS finds a valid path ---');
for (let t = 0; t < 20; t++) {
    const m = new Maze(12, 12).generate();
    const bfs = m.solveBFS();
    const astar = m.solveAStar();
    const dfs = m.solveDFS();
    assert(bfs.path, 'BFS must find a path');
    assert(astar.path, 'A* must find a path');
    assert(dfs.path, 'DFS must find a path');
    assert.strictEqual(astar.path.length, bfs.path.length,
        `A* path (${astar.path.length}) must equal BFS shortest (${bfs.path.length})`);
    // validate every path is walkable (no wall jumps)
    for (const { path, name } of [{ path: bfs.path, name: 'BFS' }, { path: astar.path, name: 'A*' }, { path: dfs.path, name: 'DFS' }]) {
        for (let i = 1; i < path.length; i++) {
            const [r, c] = path[i - 1];
            const ok = m.neighbors(r, c).some(([nr, nc]) => nr === path[i][0] && nc === path[i][1]);
            assert(ok, `${name}: step ${i} must be a legal move`);
        }
    }
    // A* should generally explore fewer cells than BFS on open mazes
}
console.log('PASS: 20/20 trials — paths valid, A* == BFS shortest');

console.log('--- A* explores fewer cells than BFS (efficiency check) ---');
{
    let astarWins = 0;
    const trials = 30;
    for (let t = 0; t < trials; t++) {
        const m = new Maze(20, 20).generate();
        const bfs = m.solveBFS();
        const astar = m.solveAStar();
        if (astar.visitedCount <= bfs.visitedCount) astarWins++;
    }
    console.log(`A* visited <= BFS in ${astarWins}/${trials} trials (path lengths identical)`);
    assert(astarWins >= trials * 0.8, 'A* should usually explore fewer cells');
    console.log('PASS');
}

console.log('--- demo: 8x10 maze with A* path ---');
{
    const m = new Maze(10, 8).generate();
    const { path, visitedCount } = m.solveAStar();
    console.log(m.toString(path));
    console.log(`path length: ${path.length}, cells visited: ${visitedCount}`);
}

console.log('\nAll maze tests passed.');
