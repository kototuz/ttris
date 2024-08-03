"use strict"

const canvas = document.getElementById("start");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.onresize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
};

const GRID_CONTEXT     = canvas.getContext("2d");
const GRID_POS         = {x: 0, y: 0};
const GRID_ROWS_COUNT  = 10;
const GRID_COLS_COUNT  = 10;
const GRID_CELL_WIDTH  = 50;
const GRID_CELL_HEIGHT = 50;
const GRID_CELL_BORDER = 1;
const GRID_WIDTH       = GRID_COLS_COUNT * GRID_CELL_WIDTH;
const GRID_HEIGHT      = GRID_ROWS_COUNT * GRID_CELL_HEIGHT;
const GRID_BG_COLOR    = "#101010";
const GRID             = Array.from({length: GRID_HEIGHT}, e => new Array());

class Loc {
    constructor(row = 0, col = 0) {
        this.row = row;
        this.col = col;
    }

    asArr() {
        return [this.row, this.col];
    }

    asPos() {
        return [
            GRID_POS.x + this.col*GRID_CELL_WIDTH,
            GRID_POS.y + this.row*GRID_CELL_HEIGHT
        ];
    }

    static sum(l1, row, col) {
        return new Loc(l1.row+row, l1.col+col);
    }
}

class Palette {
    static DARKEN_FACTOR = 0.1;

    constructor(mainColorRgb) {
        let secondColorRgb = { ...mainColorRgb };
        secondColorRgb.r *= Palette.DARKEN_FACTOR;
        secondColorRgb.g *= Palette.DARKEN_FACTOR;
        secondColorRgb.b *= Palette.DARKEN_FACTOR;

        this.color1 = mainColorRgb;
        this.color2 = secondColorRgb;
    }

    toStringColor0() {
        return `rgb(${this.color1.r}, ${this.color1.g}, ${this.color1.b})`;
    }

    toStringColor1() {
        return `rgb(${this.color2.r}, ${this.color2.g}, ${this.color2.b})`;
    }
}

class Shape {
    static SCHEMES = [
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
        ]
    ];

    constructor(schemeId, dirId, palette, loc) {
        this.dirs = Shape.SCHEMES[schemeId];
        this.dirId = dirId;
        this.scheme = this.dirs[dirId];
        this.loc = loc;
        this.palette = palette;
    }

    stepLeft() {
        if (this.#hasIntersection(this.scheme, 0, -1)) return false;
        this.loc.col -= 1;
        return true;
    }

    stepRight() {
        if (this.#hasIntersection(this.scheme, 0, 1)) return false;
        this.loc.col += 1;
        return true;
    }

    stepDown() {
        if (this.#hasIntersection(this.scheme, 1, 0)) return false;
        this.loc.row += 1;
        return true;
    }

    flip() {
        const newId = this.dirId+1 == this.dirs.length ? 0 : this.dirId+1;
        const newScheme = this.dirs[newId];
        if (this.#hasIntersection(newScheme, 0, 0)) return;

        this.scheme = newScheme;
        this.dirId = newId;
    }

    render() {
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
    }

    clear() {
        for (let row = 0; row < this.scheme.length; row++) {
            for (let col = 0; col < this.scheme[row].length; col++) {
                if (this.scheme[row][col]) {
                    gridClearCell(new Loc(this.loc.row+row, this.loc.col+col));
                }
            }
        }
    }

    #hasIntersection(scheme, sRow, sCol) {
        const nextLoc = Loc.sum(this.loc, sRow, sCol);
        for (let row = 0; row < scheme.length; row++) {
            for (let col = 0; col < scheme[row].length; col++) {
                const cellGlobalLoc = Loc.sum(nextLoc, row, col);
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
    }

    static random(loc) {
        const id = Math.floor(Math.random() * Shape.SCHEMES.length);
        const dirId = Math.floor(Math.random() * Shape.SCHEMES[id].length);
        const color = {
            r: Math.floor(Math.random() * 255),
            g: Math.floor(Math.random() * 255),
            b: Math.floor(Math.random() * 255),
        };

        return new Shape(id, dirId, new Palette(color), loc);
    }
}

function gridFillCell(palette, loc) {
    console.assert(
        loc.row >= 0 &&
        loc.row < GRID_ROWS_COUNT &&
        loc.col >= 0 &&
        loc.col < GRID_COLS_COUNT
    );

    const pos = loc.asPos();
    GRID_CONTEXT.fillStyle = palette.toStringColor1();
    GRID_CONTEXT.fillRect(...pos, GRID_CELL_WIDTH, GRID_CELL_HEIGHT);
    GRID_CONTEXT.fillStyle = palette.toStringColor0();
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


(() => {
    gridRender();

    document.addEventListener("keypress", PLAYER.eventListener);

    const i = setInterval(() => {
        PLAYER.shape.clear();
            if (!PLAYER.shape.stepDown()) {
                if (PLAYER.shape.loc.row == 0) {
                    console.log("GAME OVER!");
                    clearInterval(i);
                    document.removeEventListener("keypress", PLAYER.eventListener);
                    return;
                }

                gridAdd(PLAYER.shape)
                gridRender();
                PLAYER.shape = Shape.random(new Loc());
            }
        PLAYER.shape.render();
    }, 1000);
})();



// TODO: player points
// TODO: animations for blocks
// TODO: maybe particles
