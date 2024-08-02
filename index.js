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
    constructor(mainColorRgb) {
        let secondColorRgb = { ...mainColorRgb };
        secondColorRgb.r -= 0x44;
        secondColorRgb.g -= 0x44;
        secondColorRgb.b -= 0x44;

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
            [[1,0],
             [1,1]],

            [[0,1],
             [1,1]],

            [[1,1],
             [0,1]],

            [[1,1],
             [1,0]],
        ]
    ];

    constructor(id, dirId, palette, loc) {
        this.dirGen = Shape.dirGenerator(Shape.SCHEMES[id], dirId);
        this.scheme = this.dirGen.next().value;
        this.loc = loc;
        this.palette = palette;
    }

    stepLeft() {
        if (this.#hasIntersection(0, -1)) return false;
        this.loc.col -= 1;
        return true;
    }

    stepRight() {
        if (this.#hasIntersection(0, 1)) return false;
        this.loc.col += 1;
        return true;
    }

    stepDown() {
        if (this.#hasIntersection(1, 0)) return false;
        this.loc.row += 1;
        return true;
    }

    flip() {
        const newScheme = this.dirGen.next().value;
        for (let row = 0; row < newScheme.length; row++) {
            for (let col = 0; col < newScheme[row].length; col++) {
                const cellLoc = Loc.sum(this.loc, row, col);
                if (
                    GRID[cellLoc.row][cellLoc.col] &&
                    newScheme[row][col]
                ) return;
            }
        }

        this.scheme = newScheme;
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

    #hasIntersection(sRow, sCol) {
        const nextLoc = Loc.sum(this.loc, sRow, sCol);
        if (
            nextLoc.col < 0 ||
            nextLoc.col+this.scheme[0].length > GRID_COLS_COUNT ||
            nextLoc.row+this.scheme.length > GRID_ROWS_COUNT
        ) return true;

        for (let row = 0; row < this.scheme.length; row++) {
            for (let col = 0; col < this.scheme[row].length; col++) {
                const cellLoc = Loc.sum(nextLoc, row, col);
                if (
                    GRID[cellLoc.row][cellLoc.col] &&
                    this.scheme[row][col]
                ) return true;
            }
        }

        return false;
    }

    static *dirGenerator(dirs, dirBeginId) {
        for (;;) {
            yield dirs[dirBeginId];
            if (dirBeginId == 0) {
                dirBeginId = dirs.length-1;
            } else {
                dirBeginId--;
            }
        }
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
    GRID_CONTEXT.fillRect(pos[0]+10, pos[1]+10, GRID_CELL_WIDTH-2*10, GRID_CELL_HEIGHT-2*10);
}

function gridRender() {
    GRID_CONTEXT.fillStyle = GRID_BG_COLOR;
    GRID_CONTEXT.fillRect(GRID_POS.x, GRID_POS.y, GRID_WIDTH, GRID_HEIGHT);

    for (let row = 0; row < GRID_ROWS_COUNT; row++) {
        for (let col = 0; col < GRID_COLS_COUNT; col++) {
            if (GRID[row][col]) {
                gridFillCell(new Palette({ r: 0xff, g: 0x00, b: 0x00 }), new Loc(row, col));
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
    console.assert(
        shape.loc.row >= 0 &&
        shape.loc.row < GRID_ROWS_COUNT &&
        shape.loc.col >= 0 &&
        shape.loc.col < GRID_COLS_COUNT
    );

    for (let row = 0; row < shape.scheme.length; row++) {
        for (let col = 0; col < shape.scheme[row].length; col++) {
            if (shape.scheme[row][col]) {
                GRID[shape.loc.row+row][shape.loc.col+col] = 1;
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
    GRID[GRID_ROWS_COUNT-1] = [0,1,1,1];
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



// TODO: animations for blocks
// TODO: maybe particles
