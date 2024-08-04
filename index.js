"use strict"

const GRID_ROWS_COUNT  = 20;
const GRID_COLS_COUNT  = 15;
const GRID_CELL_WIDTH  = 50;
const GRID_CELL_HEIGHT = 50;
const GRID_CELL_BORDER = 1;
const GRID_WIDTH       = GRID_COLS_COUNT * GRID_CELL_WIDTH;
const GRID_HEIGHT      = GRID_ROWS_COUNT * GRID_CELL_HEIGHT;
const GRID_POS         = {x: 0, y: 0};
const GRID_BG_COLOR    = "#101010";
const GRID             = Array.from({length: GRID_ROWS_COUNT}, e => new Array(GRID_COLS_COUNT).fill(0));
const DARKEN_FACTOR    = 0.1;

const canvas = document.getElementById("start");
canvas.width = GRID_WIDTH;
canvas.height = GRID_HEIGHT;
const GRID_CONTEXT = canvas.getContext("2d");

const SHAPE_SCHEMES = [
    [
        [[1,1],
         [1,1]],
    ],
    [
        [[1,1,0],
         [0,1,1]],
        [[0,1],
         [1,1],
         [1,0]],
    ],
    [
        [[0,1,1],
         [1,1,0]],
        [[1,0],
         [1,1],
         [0,1]],
    ],
    [
        [[0,1,0],
         [1,1,1]],
        [[0,1,0],
         [0,1,1],
         [0,1,0]],
        [[0,0,0],
         [1,1,1],
         [0,1,0]],
        [[0,1,0],
         [1,1,0],
         [0,1,0]]
    ],
    [
        [[1,0,0],
         [1,1,1]],
        [[1,1],
         [1,0],
         [1,0]],
        [[1,1,1],
         [0,0,1]],
        [[0,1],
         [0,1],
         [1,1]]
    ],
    [
        [[0,0,1],
         [1,1,1]],
        [[1,0],
         [1,0],
         [1,1]],
        [[1,1,1],
         [1,0,0]],
        [[1,1],
         [0,1],
         [0,1]],
    ],
    [
        [[0,0,0,0],
         [1,1,1,1]],
        [[0,1],
         [0,1],
         [0,1],
         [0,1]],
    ]
];



function Loc(row = 0, col = 0) {
    this.row = row;
    this.col = col;
}

function Palette(mainColor) {
    this.color1 = mainColor;
    this.color0 = Object.create(mainColor);
    this.color0.r *= DARKEN_FACTOR;
    this.color0.g *= DARKEN_FACTOR;
    this.color0.b *= DARKEN_FACTOR;
}

function Shape(schemeId, dirId, palette, loc) {
    this.dirs = SHAPE_SCHEMES[schemeId];
    this.dirId = dirId;
    this.scheme = this.dirs[dirId];
    this.loc = loc;
    this.palette = palette;
}



Loc.sum = function(l1, row, col) {
    return new Loc(l1.row+row, l1.col+col);
};

Loc.prototype.asArr = function() {
    return [this.row, this.col];
};

Loc.prototype.asPos = function() {
    return [
        GRID_POS.x + this.col*GRID_CELL_WIDTH,
        GRID_POS.y + this.row*GRID_CELL_HEIGHT
    ];
};

Palette.prototype.toStringColor0 = function() {
    return `rgb(${this.color0.r}, ${this.color0.g}, ${this.color0.b})`;
};

Palette.prototype.toStringColor1 = function() {
    return `rgb(${this.color1.r}, ${this.color1.g}, ${this.color1.b})`;
};

Shape.random = function(loc) {
    const id = Math.floor(Math.random() * SHAPE_SCHEMES.length);
    const dirId = Math.floor(Math.random() * SHAPE_SCHEMES[id].length);
    const color = {
        r: Math.floor(Math.random() * 255),
        g: Math.floor(Math.random() * 255),
        b: Math.floor(Math.random() * 255),
    };

    return new Shape(id, dirId, new Palette(color), loc);
};

Shape.prototype.stepLeft = function() {
    if (hasIntersection(this.scheme, Loc.sum(this.loc, 0, -1))) return false;
    this.loc.col -= 1;
    return true;
};

Shape.prototype.stepRight = function() {
    if (hasIntersection(this.scheme, Loc.sum(this.loc, 0, 1))) return false;
    this.loc.col += 1;
    return true;
};

Shape.prototype.stepDown = function() {
    if (hasIntersection(this.scheme, Loc.sum(this.loc, 1, 0))) return false;
    this.loc.row += 1;
    return true;
};

Shape.prototype.isAtBottom = function() {
    return hasIntersection(this.scheme, Loc.sum(this.loc, 1, 0));
};

Shape.prototype.flip = function() {
    const newId = this.dirId+1 == this.dirs.length ? 0 : this.dirId+1;
    const newScheme = this.dirs[newId];
    if (hasIntersection(newScheme, this.loc)) return;

    this.scheme = newScheme;
    this.dirId = newId;
};

Shape.prototype.render = function() {
    for (let row = 0; row < this.scheme.length; row++) {
        for (let col = 0; col < this.scheme[row].length; col++) {
            if (this.scheme[row][col]) {
                gridFillCell(
                    this.palette,
                    Loc.sum(this.loc, row, col)
                );
            }
        }
    }
};

Shape.prototype.clear = function() {
    console.log();
    for (let row = 0; row < this.scheme.length; row++) {
        for (let col = 0; col < this.scheme[row].length; col++) {
            if (this.scheme[row][col]) {
                gridClearCell(new Loc(this.loc.row+row, this.loc.col+col));
            }
        }
    }
};



function hasIntersection(scheme, loc) {
    for (let row = 0; row < scheme.length; row++) {
        for (let col = 0; col < scheme[row].length; col++) {
            const cellGlobalLoc = Loc.sum(loc, row, col);
            if (
                scheme[row][col] &&
                (cellGlobalLoc.col < 0 ||
                cellGlobalLoc.col == GRID_COLS_COUNT ||
                cellGlobalLoc.row == GRID_ROWS_COUNT ||
                GRID[cellGlobalLoc.row][cellGlobalLoc.col])
            ) return true;
        }
    }

    return false;
};

function gridFillCell(palette, loc) {
    console.assert(
        loc.row >= 0 &&
        loc.row < GRID_ROWS_COUNT &&
        loc.col >= 0 &&
        loc.col < GRID_COLS_COUNT
    );

    const pos = loc.asPos();
    GRID_CONTEXT.fillStyle = palette.toStringColor0();
    GRID_CONTEXT.fillRect(...pos, GRID_CELL_WIDTH, GRID_CELL_HEIGHT);
    GRID_CONTEXT.fillStyle = palette.toStringColor1();
    GRID_CONTEXT.fillRect(
        pos[0]+GRID_CELL_BORDER,
        pos[1]+GRID_CELL_BORDER,
        GRID_CELL_WIDTH-2*GRID_CELL_BORDER,
        GRID_CELL_HEIGHT-2*GRID_CELL_BORDER
    );
}

function gridRender() {
    GRID_CONTEXT.fillStyle = GRID_BG_COLOR;
    GRID_CONTEXT.fillRect(GRID_POS.x, GRID_POS.y, GRID_WIDTH, GRID_HEIGHT);

    for (let row = 0; row < GRID_ROWS_COUNT; row++) {
        for (let col = 0; col < GRID_COLS_COUNT; col++) {
            const palette = GRID[row][col];
            if (palette) {
                gridFillCell(palette, new Loc(row, col));
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
    GRID.forEach((row, idx) => {
        if (row.every(e => e !== 0)) {
            GRID.splice(idx, 1);
            GRID.unshift(new Array(GRID_COLS_COUNT).fill(0));
            count++;
        }
    });

    return count;
}

function gridAdd(shape) {
    for (let row = 0; row < shape.scheme.length; row++) {
        for (let col = 0; col < shape.scheme[row].length; col++) {
            if (shape.scheme[row][col]) {
                GRID[shape.loc.row+row][shape.loc.col+col] = shape.palette;
            }
        }
    }
}



const PLAYER = {
    shape: Shape.random(new Loc()),

    eventListener(e) {
        if (e.code === "KeyH") {
            PLAYER.shape.clear();
            PLAYER.shape.stepLeft();
            PLAYER.shape.render();
        }

        if (e.code === "KeyJ") {
            PLAYER.shape.clear();
            PLAYER.shape.stepDown();
            if (PLAYER.shape.isAtBottom()) {
                playerAtBottomCallback();
            }
            PLAYER.shape.render();
        }

        if (e.code === "KeyL") {
            PLAYER.shape.clear();
            PLAYER.shape.stepRight();
            PLAYER.shape.render();
        }

        if (e.code === "KeyK") {
            PLAYER.shape.clear();
            PLAYER.shape.flip();
            PLAYER.shape.render();
        }
    }
};

gridRender();
document.addEventListener("keypress", PLAYER.eventListener);
const GAME_LOOP = setInterval(() => {
    PLAYER.shape.clear();
        PLAYER.shape.stepDown()
        if (PLAYER.shape.isAtBottom()) {
            playerAtBottomCallback();
        }
    PLAYER.shape.render();
}, 1000);

function playerAtBottomCallback() {
    if (PLAYER.shape.loc.row == 0) {
        console.log("GAME OVER!");
        document.removeEventListener("keypress", PLAYER.eventListener);
        clearInterval(GAME_LOOP);
        return;
    }

    gridAdd(PLAYER.shape)
    gridRemoveFilledLines();
    gridRender();
    PLAYER.shape = Shape.random(new Loc());
}




// TODO: add hud
// TODO: add particles
