"use strict"

const GAME_TICK_MS     = 1;
const GRID_ROWS_COUNT  = 18;
const GRID_COLS_COUNT  = 13;
const GRID_CELL_WIDTH  = 50;
const GRID_CELL_HEIGHT = 50;
const GRID_CELL_BORDER_WIDTH = 1;
const GRID_CELL_BORDER_COLOR = "#101010";
const GRID_WIDTH       = GRID_COLS_COUNT * GRID_CELL_WIDTH;
const GRID_HEIGHT      = GRID_ROWS_COUNT * GRID_CELL_HEIGHT;
const GRID_BG_COLOR    = "#101010";
const GRID             = Array.from({length: GRID_ROWS_COUNT}, e => new Array());
const DARKEN_FACTOR    = 0.1;
const PLAYER_SPAWN_POS = new Loc(0, Math.floor(GRID_COLS_COUNT/2));

const STEP_LEFT  = new Loc(0, -1);
const STEP_RIGHT = new Loc(0, 1);
const STEP_DOWN  = new Loc(1, 0);

const SHAPE_SCHEMES = [
    [
        [[0,1],
         [0,1]],
    ],
    [
        [[0,1],
         [1,2]],

        [[1],
         [0,1],
         [0]],
    ],
    [
        [[1,2],
         [0,1]],

        [[0],
         [0,1],
         [1]],
    ],
    [
        [[1],
         [0,1,2]],

        [[1],
         [1,2],
         [1]],

        [[],
         [0,1,2],
         [1]],

        [[1],
         [0,1],
         [1]],
    ],
    [
        [[0],
         [0,1,2]],

        [[0,1],
         [0],
         [0]],

        [[0,1,2],
         [2]],

        [[1],
         [1],
         [0,1]],
    ],
    [
        [[2],
         [0,1,2]],

        [[0],
         [0],
         [0,1]],

        [[0,1,2],
         [0]],

        [[0,1],
         [1],
         [1]],
    ],
    [
        [[],
         [0,1,2,3]],
        [[1],
         [1],
         [1],
         [1]]
    ],
];



function Loc(row = 0, col = 0) {
    this.row = row;
    this.col = col;
}

function Shape(schemeId, dirId, color, loc) {
    this.dirs = SHAPE_SCHEMES[schemeId];
    this.dirId = dirId;
    this.scheme = this.dirs[dirId];
    this.loc = loc;
    this.color = color;
}



let GRID_CONTEXT;
let PLAYER;
let GAME_IS_FROZEN = false;


function startGame() {
    const canvas = document.getElementById("start");
    console.assert(canvas, "Canvas is not defined");
    canvas.style.background = GRID_BG_COLOR;
    canvas.width = GRID_WIDTH;
    canvas.height = GRID_HEIGHT;
    GRID_CONTEXT = canvas.getContext("2d");

    animate({
        duration: 2000,
        timing: (t) => t,
        draw: (p) => {
            GRID_CONTEXT.reset();
            GRID_CONTEXT.fillStyle = "white";
            GRID_CONTEXT.font = "100px serif";
            GRID_CONTEXT.globalAlpha = p < 0.5 ? p/0.5 : (1.0-p)/0.5;
            GRID_CONTEXT.textAlign = "center";
            GRID_CONTEXT.fillText("Welcome!", GRID_WIDTH/2, GRID_HEIGHT/2);
        },
    }).then(() => {
        requestAnimationFrame(gameTick);
        PLAYER = {
            shape: Shape.random(PLAYER_SPAWN_POS),
            filledLines: 0
        }
        document.addEventListener("keypress", playerEventListener);
    });
}

Loc.sum = function(l1, row, col) {
    return new Loc(l1.row+row, l1.col+col);
};

Loc.prototype.asArr = function() {
    return [this.row, this.col];
};

Loc.prototype.asPos = function() {
    return [
        this.col*GRID_CELL_WIDTH,
        this.row*GRID_CELL_HEIGHT
    ];
};

Shape.random = function(loc) {
    const id = Math.floor(Math.random() * SHAPE_SCHEMES.length);
    const dirId = Math.floor(Math.random() * SHAPE_SCHEMES[id].length);
    const color = {
        r: Math.floor(Math.random() * 255),
        g: Math.floor(Math.random() * 255),
        b: Math.floor(Math.random() * 255),
    };

    return new Shape(id, dirId, `rgb(${color.r}, ${color.g}, ${color.b})`, loc);
};

Shape.prototype.step = function(stepLoc) {
    const newLoc = Loc.sum(this.loc, ...stepLoc.asArr());
    if (hasIntersection(this.scheme, newLoc)) {
        return false;
    }

    this.loc = newLoc;
    return true;
}

Shape.prototype.flip = function() {
    const newId = this.dirId+1 == this.dirs.length ? 0 : this.dirId+1;
    const newScheme = this.dirs[newId];
    if (hasIntersection(newScheme, this.loc)) return;

    this.scheme = newScheme;
    this.dirId = newId;
};

Shape.prototype.render = function() {
    this.forEnabledCells((row, col) => {
        gridFillCell(
            this.color,
            Loc.sum(this.loc, row, col)
        );
    });
};

Shape.prototype.clear = function() {
    this.forEnabledCells((row, col) => {
        gridClearCell(Loc.sum(this.loc, row, col));
    });
};

Shape.prototype.forEnabledCells = function(fn) {
    for (let row = 0; row < this.scheme.length; row++) {
        for (const col of this.scheme[row]) {
            fn(row, col);
        }
    }
}



function hasIntersection(scheme, loc) {
    for (let row = 0; row < scheme.length; row++) {
        for (const col of scheme[row]) {
            const cellGlobalLoc = Loc.sum(loc, row, col);
            if (
                cellGlobalLoc.col < 0 ||
                cellGlobalLoc.col == GRID_COLS_COUNT ||
                cellGlobalLoc.row == GRID_ROWS_COUNT ||
                GRID[cellGlobalLoc.row][cellGlobalLoc.col]
            ) return true;
        }
    }

    return false;
};

function gridFillCell(color, loc) {
    console.assert(
        loc.row >= 0 &&
        loc.row < GRID_ROWS_COUNT &&
        loc.col >= 0 &&
        loc.col < GRID_COLS_COUNT
    );

    const pos = loc.asPos();
    GRID_CONTEXT.fillStyle = GRID_CELL_BORDER_COLOR;
    GRID_CONTEXT.fillRect(...pos, GRID_CELL_WIDTH, GRID_CELL_HEIGHT);
    GRID_CONTEXT.fillStyle = color;
    GRID_CONTEXT.fillRect(
        pos[0]+GRID_CELL_BORDER_WIDTH,
        pos[1]+GRID_CELL_BORDER_WIDTH,
        GRID_CELL_WIDTH-2*GRID_CELL_BORDER_WIDTH,
        GRID_CELL_HEIGHT-2*GRID_CELL_BORDER_WIDTH
    );
}

function gridRender() {
    for (let row = 0; row < GRID_ROWS_COUNT; row++) {
        for (let col = 0; col < GRID[row].length; col++) {
            const color = GRID[row][col];
            if (color) {
                gridFillCell(color, new Loc(row, col));
            }
        }
    }
}

function gridClearCell(loc) {
    console.assert(
        loc.row >= 0 &&
        loc.row < GRID_ROWS_COUNT &&
        loc.col >= 0 &&
        loc.col < GRID_COLS_COUNT
    );

    GRID_CONTEXT.fillStyle = GRID_BG_COLOR;
    GRID_CONTEXT.fillRect(...loc.asPos(), GRID_CELL_WIDTH, GRID_CELL_HEIGHT);
}

function gridRemoveFilledLines() {
    let count = 0;
    rows: for (let row = 0; row < GRID_ROWS_COUNT; row++) {
        if (GRID[row].length == GRID_COLS_COUNT) {
            for (let col = 0; col < GRID[row].length; col++) {
                if (!GRID[row][col]) continue rows;
            }

            playRemoveRowAnim(row).then(() => {
                GRID.splice(row, 1);
                GRID.unshift(new Array());
                PLAYER.shape.render();
            });
            count++;
        }
    }

    return count;
}

function gridAdd(shape) {
    shape.forEnabledCells((row, col) => {
        GRID[shape.loc.row+row][shape.loc.col+col] = shape.color;
    });
}

function playerAtBottomCallback() {
    if (PLAYER.shape.loc.row == 0) {
        console.log("GAME OVER!");
        document.removeEventListener("keypress", playerEventListener);
        GAME_IS_FROZEN = true;
        return;
    }

    gridAdd(PLAYER.shape)
    PLAYER.filledLines += gridRemoveFilledLines();
    PLAYER.shape = Shape.random(PLAYER_SPAWN_POS);
}

function HUDRender() {
    GRID_CONTEXT.font = "40px serif";
    GRID_CONTEXT.fillStyle = "white";
    GRID_CONTEXT.fillText(`Filled lines: ${PLAYER.filledLines}`, 30, 50);
}

let last = 0;
function gameTick(dt) {
    if (GAME_IS_FROZEN) return;

    GRID_CONTEXT.reset();
    gridRender();
    PLAYER.shape.render();
    HUDRender();

    if (!last || dt - last >= 1000-PLAYER.filledLines*15) {
        last = dt;
        if (!PLAYER.shape.step(STEP_DOWN)) {
            playerAtBottomCallback();
        }
    }

    requestAnimationFrame(gameTick);
}

function playerEventListener(e) {
    switch (e.code) {
        case "KeyH":
            PLAYER.shape.step(STEP_LEFT);
            break;

        case "KeyJ":
            PLAYER.shape.step(STEP_DOWN);
            break;

        case "KeyL":
            PLAYER.shape.step(STEP_RIGHT);
            break;

        case "KeyK":
            PLAYER.shape.flip();
            break;

        case "Space":
            while (PLAYER.shape.step(STEP_DOWN)) {}
            playerAtBottomCallback();
            break;
    }
}

function playRemoveRowAnim(row) {
    return animate({
        timing: (t) => t,
        duration: 250,
        draw: (progress) => {
            GRID_CONTEXT.fillStyle = GRID_BG_COLOR;
            GRID_CONTEXT.fillRect(
                0,
                row*GRID_CELL_HEIGHT,
                GRID_WIDTH,
                GRID_CELL_HEIGHT*progress
            );
        },
    });
}

function animate({timing, draw, duration}) {
    return new Promise((resolve) => {
        let start = performance.now();

        requestAnimationFrame(function animate(time) {
            let timeFraction = (time - start) / duration;
            if (timeFraction > 1) timeFraction = 1;

            let progress = timing(timeFraction);

            draw(progress);

            if (timeFraction < 1) {
                requestAnimationFrame(animate);
            } else resolve();
        });
    });
}



(() => {
    startGame();
})();

// TODO: the ability to freeze the game
// TODO: the game over screen
// TODO: add particles
