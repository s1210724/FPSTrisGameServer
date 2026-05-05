/*
 TetrisHelpers (UMD)
 - This file exports a small set of Tetris helper utilities.
 - It uses a UMD wrapper so it can be used both in Node (require) and in the browser (script tag).

 Usage:
  - Node: const TetrisHelpers = require('./tetrisHelpers');
  - Browser: include the script with <script src="/js/shared/tetrisHelpers.js"></script>
             then use `TetrisHelpers` from the global object (window).
*/
(function (root, factory) {
	// Choose the proper root/global object in a safe, environment-agnostic way.
	// Prefer globalThis when available, otherwise fall back to window (browser) or this.
	var localRoot = typeof globalThis !== "undefined" ? globalThis : (typeof window !== "undefined" ? window : this);

	if (typeof module === "object" && module.exports) {
		// CommonJS / Node.js
		module.exports = factory();
	} else {
		// Browser global
		localRoot.TetrisHelpers = factory();
	}
})(typeof globalThis !== "undefined" ? globalThis : (typeof window !== "undefined" ? window : this), function () {
	const BOARD_COLS = 10;
	const BOARD_ROWS = 20;

	const PIECES = [
		[[1, 1, 1, 1]],
		[[1, 1], [1, 1]],
		[[0, 1, 0], [1, 1, 1]],
		[[1, 1, 0], [0, 1, 1]],
		[[0, 1, 1], [1, 1, 0]],
		[[1, 0, 0], [1, 1, 1]],
		[[0, 0, 1], [1, 1, 1]]
	];

	const COLORS = [
		"#00B8D4",
		"#FDD835",
		"#AB47BC",
		"#66BB6A",
		"#EF5350",
		"#42A5F5",
		"#FFA726"
	];

	/** Rotate a shape matrix clockwise. */
	function rotateClockwise(shape) {
		return shape[0].map((_, colIndex) => shape.map((row) => row[colIndex]).reverse());
	}

	/**
	 * Return an array of filled cell coordinates for a shape matrix.
	 * Example: [{row:0, col:1}, ...]
	 */
	function getFilledCells(shape) {
		const cells = [];
		for (let row = 0; row < shape.length; row++) {
			for (let col = 0; col < shape[row].length; col++) {
				if (shape[row][col]) {
					cells.push({ row, col });
				}
			}
		}
		return cells;
	}

	function buildRotationStates(shape) {
		const rotations = [shape.map((row) => [...row])];
		for (let i = 1; i < 4; i++) {
			rotations.push(rotateClockwise(rotations[i - 1]));
		}
		return rotations;
	}

	const PIECE_ROTATIONS = PIECES.map((shape) => buildRotationStates(shape));

	/** Create a new empty 10x20 field matrix. */
	function createEmptyField() {
		return Array.from({ length: BOARD_ROWS }, () => Array(BOARD_COLS).fill(0));
	}

	/** Validate that a value is a 10x20 field matrix. */
	function isValidField(field) {
		return (
			Array.isArray(field)
			&& field.length === BOARD_ROWS
			&& field.every((row) => Array.isArray(row) && row.length === BOARD_COLS)
		);
	}

	/** Get the rotation-state matrix for a piece type and rotation index. */
	function getRotationShape(type, rotation) {
		if (!PIECE_ROTATIONS[type]) {
			return null;
		}

		const normalizedRotation = ((rotation % 4) + 4) % 4;
		return PIECE_ROTATIONS[type][normalizedRotation];
	}

	return {
		BOARD_COLS,
		BOARD_ROWS,
		PIECES,
		COLORS,
		PIECE_ROTATIONS,
		createEmptyField,
		getFilledCells,
		getRotationShape,
		isValidField,
		rotateClockwise
	};
});