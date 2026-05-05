/*
 FieldSync (UMD)
 - Small helper to apply a locked tetromino payload to a 10x20 field matrix and run line clears.
 - Exported as UMD so the same file can be `require()`'d on the server or included as a <script> in the browser.

 Usage:
  - Node: const FieldSync = require('./fieldSync');
  - Browser: include the script and use `FieldSync` on window.
*/
(function (root, factory) {
	var localRoot = typeof globalThis !== "undefined" ? globalThis : (typeof window !== "undefined" ? window : this);

	if (typeof module === "object" && module.exports) {
		module.exports = factory(require("./tetrisHelpers"));
	} else {
		localRoot.FieldSync = factory(localRoot.TetrisHelpers);
	}
})(typeof globalThis !== "undefined" ? globalThis : (typeof window !== "undefined" ? window : this), function (helpers) {
	function clearLines(field) {
		for (let row = helpers.BOARD_ROWS - 1; row >= 0; row--) {
			if (field[row].every((cell) => cell !== 0)) {
				field.splice(row, 1);
				field.unshift(Array(helpers.BOARD_COLS).fill(0));
				row++;
			}
		}
	}

	function applyLockedBlockToField(field, payload) {
		if (!helpers.isValidField(field) || !payload) {
			return field;
		}

		const shape = helpers.getRotationShape(payload.type, payload.rotation);
		if (!shape || typeof payload.color !== "string") {
			return field;
		}

		shape.forEach((row, rowIndex) => {
			row.forEach((cell, colIndex) => {
				if (!cell) {
					return;
				}

				const x = payload.x + colIndex;
				const y = payload.y + rowIndex;
				if (x < 0 || x >= helpers.BOARD_COLS || y < 0 || y >= helpers.BOARD_ROWS) {
					return;
				}

				field[y][x] = payload.color;
			});
		});

		clearLines(field);
		return field;
	}

	return {
		applyLockedBlockToField,
		clearLines
	};
});