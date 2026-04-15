const otherGamesCanvas = document.getElementById("otherGames");
const mainGameContainer = document.getElementById("mainGame");
const playerFields = {};
let layout = {};

const socket = io();

if (otherGamesCanvas && mainGameContainer) {
	const otherGamesCtx = otherGamesCanvas.getContext("2d");
	const BOARD_COLS = 10;
	const BOARD_ROWS = 20;
	const BOARD_ASPECT_RATIO = 1 / 2;
	const MAX_OTHER_FIELDS = 56;
	const MIN_BOARD_WIDTH = 22;
	const CELL_GAP = 10;
	const SAFE_MARGIN = 20;

	function setCanvasSize() {
		const dpr = window.devicePixelRatio || 1;
		const width = window.innerWidth;
		const height = window.innerHeight;

		otherGamesCanvas.width = Math.floor(width * dpr);
		otherGamesCanvas.height = Math.floor(height * dpr);
		otherGamesCanvas.style.width = `${width}px`;
		otherGamesCanvas.style.height = `${height}px`;

		otherGamesCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
	}

	function getSafeRect() {
		const bounds = mainGameContainer.getBoundingClientRect();
		return {
			x: bounds.left - SAFE_MARGIN,
			y: bounds.top - SAFE_MARGIN,
			width: bounds.width + SAFE_MARGIN * 2,
			height: bounds.height + SAFE_MARGIN * 2
		};
	}

	function buildSymmetricSlots(boardWidth, safeRect) {
		const boardHeight = boardWidth / BOARD_ASPECT_RATIO;
		const leftPanelWidth = Math.max(0, safeRect.x - CELL_GAP);
		const rightPanelStart = safeRect.x + safeRect.width;
		const rightPanelWidth = Math.max(0, window.innerWidth - CELL_GAP - rightPanelStart);
		const availableHeight = window.innerHeight - CELL_GAP * 2;

		const columnsPerSide = Math.max(
			0,
			Math.floor((Math.min(leftPanelWidth, rightPanelWidth) + CELL_GAP) / (boardWidth + CELL_GAP))
		);
		const rowsPerSide = Math.max(0, Math.floor((availableHeight + CELL_GAP) / (boardHeight + CELL_GAP)));

		if (columnsPerSide === 0 || rowsPerSide === 0) {
			return {
				slots: [],
				columnsPerSide: 0,
				rowsPerSide: 0
			};
		}

		const leftUsedWidth = columnsPerSide * boardWidth + (columnsPerSide - 1) * CELL_GAP;
		const rightUsedWidth = leftUsedWidth;
		const usedHeight = rowsPerSide * boardHeight + (rowsPerSide - 1) * CELL_GAP;

		const leftStartX = CELL_GAP + Math.max(0, (leftPanelWidth - leftUsedWidth) / 2);
		const rightStartX = rightPanelStart + Math.max(0, (rightPanelWidth - rightUsedWidth) / 2);
		const startY = CELL_GAP + Math.max(0, (availableHeight - usedHeight) / 2);

		const leftSlots = [];
		const rightSlots = [];
		for (let row = 0; row < rowsPerSide; row++) {
			for (let col = 0; col < columnsPerSide; col++) {
				leftSlots.push({
					x: leftStartX + col * (boardWidth + CELL_GAP),
					y: startY + row * (boardHeight + CELL_GAP),
					width: boardWidth,
					height: boardHeight
				});
			}
		}

		for (let row = 0; row < rowsPerSide; row++) {
			for (let col = 0; col < columnsPerSide; col++) {
				rightSlots.push({
					x: rightStartX + col * (boardWidth + CELL_GAP),
					y: startY + row * (boardHeight + CELL_GAP),
					width: boardWidth,
					height: boardHeight
				});
			}
		}

		// Interleave sides so capped rendering stays balanced.
		const slots = [];
		for (let i = 0; i < leftSlots.length; i++) {
			slots.push(leftSlots[i], rightSlots[i]);
		}

		return {
			slots,
			columnsPerSide,
			rowsPerSide
		};
	}

	function pickLayout() {
		const safeRect = getSafeRect();
		const maxBoardWidth = Math.floor(Math.min(window.innerWidth * 0.2, window.innerHeight * 0.2));
		let best = null;

		for (let width = maxBoardWidth; width >= MIN_BOARD_WIDTH; width--) {
			const candidate = buildSymmetricSlots(width, safeRect);
			if (candidate.slots.length === 0) {
				continue;
			}

			const layout = {
				boardWidth: width,
				boardHeight: width / BOARD_ASPECT_RATIO,
				slots: candidate.slots,
				columnsPerSide: candidate.columnsPerSide,
				rowsPerSide: candidate.rowsPerSide
			};

			if (candidate.slots.length >= MAX_OTHER_FIELDS) {
				return layout;
			}

			if (!best || candidate.slots.length > best.slots.length || (candidate.slots.length === best.slots.length && width > best.boardWidth)) {
				best = layout;
			}
		}

		return best;
	}

    layout = pickLayout();

    function updatePlayerFields(slot, index, boardWidth, boardHeight) {
        otherGamesCtx.fillStyle = "rgba(15, 23, 42, 0.8)";
		otherGamesCtx.fillRect(slot.x, slot.y, boardWidth, boardHeight);

		otherGamesCtx.strokeStyle = "rgba(148, 163, 184, 0.35)";
		otherGamesCtx.lineWidth = 1;
		otherGamesCtx.strokeRect(slot.x + 0.5, slot.y + 0.5, boardWidth - 1, boardHeight - 1);

		otherGamesCtx.fillStyle = "rgba(255, 255, 255, 1)";
		otherGamesCtx.textAlign = "center";
		otherGamesCtx.textBaseline = "middle";
        otherGamesCtx.font = "8px Arial";
		otherGamesCtx.fillText(`player Found`, slot.x + boardWidth / 2, slot.y + boardHeight / 2);
    }

	function drawMiniField(slot, index, boardWidth, boardHeight) {

		otherGamesCtx.fillStyle = "rgba(15, 23, 42, 0.8)";
		otherGamesCtx.fillRect(slot.x, slot.y, boardWidth, boardHeight);

		otherGamesCtx.strokeStyle = "rgba(148, 163, 184, 0.35)";
		otherGamesCtx.lineWidth = 1;
		otherGamesCtx.strokeRect(slot.x + 0.5, slot.y + 0.5, boardWidth - 1, boardHeight - 1);

		otherGamesCtx.fillStyle = "rgba(255, 255, 255, 1)";
		otherGamesCtx.textAlign = "center";
		otherGamesCtx.textBaseline = "middle";
        otherGamesCtx.font = "8px Arial";
		otherGamesCtx.fillText(`No player Found`, slot.x + boardWidth / 2, slot.y + boardHeight / 2);
	}

	function renderOtherFields() {
		otherGamesCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);

		if (!layout) {
			return;
		}

		const maxViablePairCount = Math.floor(Math.min(MAX_OTHER_FIELDS, layout.slots.length) / 2) * 2;
		const drawCount = maxViablePairCount;
		for (let i = 0; i < drawCount; i++) {
			drawMiniField(layout.slots[i], i, layout.boardWidth, layout.boardHeight);
		}
	}

	function redraw() {
		setCanvasSize();
		renderOtherFields();
	}

	window.addEventListener("resize", redraw);
	window.addEventListener("load", redraw);

	redraw();

    socket.on("playerJoined", (playerData) => {
        debugger;
        playerFields[playerData.id] = Object.keys(playerFields).length || 0;
        updatePlayerFields(layout.slots[playerFields[playerData.id]], playerFields[playerData.id], layout.boardWidth, layout.boardHeight);
    });

    socket.on("playerLeft", (playerData) => {
        delete playerFields[playerData.id];
    });
}
