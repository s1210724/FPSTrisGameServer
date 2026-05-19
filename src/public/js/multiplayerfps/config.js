export const SHAPE_HEIGHT = 0.5;
export const ARENA_SIZE = 80;
export const ARENA_HALF_SIZE = ARENA_SIZE / 2;
export const WALL_HEIGHT = 16;

export const TETROMINO_DEFINITIONS = {
    z: { color: 0xff3333, cubes: [[0, 0], [1, 0], [1, 1], [2, 1]] },
    s: { color: 0x33cc66, cubes: [[1, 0], [2, 0], [0, 1], [1, 1]] },
    t: { color: 0xaa55ff, cubes: [[0, 0], [1, 0], [2, 0], [1, 1]] },
    l: { color: 0xff9933, cubes: [[0, 0], [0, 1], [0, 2], [1, 2]] },
    j: { color: 0x3366ff, cubes: [[1, 0], [1, 1], [1, 2], [0, 2]] },
    o: { color: 0xffdd33, cubes: [[0, 0], [1, 0], [0, 1], [1, 1]] },
    i: { color: 0x33ddff, cubes: [[0, 0], [0, 1], [0, 2], [0, 3]] }
};