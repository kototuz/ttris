"use strict"

const canvas = document.getElementById("start");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.onresize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
};

const CONTEXT = canvas.getContext("2d");

const BLOCK_WIDTH  = 50;
const BLOCK_HEIGHT = 50;
const BLOCK_COLOR  = [0xff, 0x50, 0x50];

const BORDER = 5;
const INNER_BLOCK_WIDTH = BLOCK_WIDTH-2*BORDER;
const INNER_BLOCK_HEIGHT = BLOCK_HEIGHT-2*BORDER;

const PG_POS              = {x: 0, y: 0};
const PG_WIDTH_IN_BLOCKS  = 10;
const PG_HEIGHT_IN_BLOCKS = 10;
const PG_WIDTH            = PG_WIDTH_IN_BLOCKS*BLOCK_WIDTH;
const PG_HEIGHT           = PG_HEIGHT_IN_BLOCKS*BLOCK_HEIGHT;
const PG_COLOR            = "#101010";
const PG_BLOCKS           = Array.from({length: PG_HEIGHT_IN_BLOCKS}, e => new Array());

const SHAPE_WIDTH  = 4;
const SHAPE_HEIGHT = 4;
const SHAPE_DIRECTIONS = [
    [
        [[0,0,1,0],
         [0,0,1,0],
         [0,0,1,0],
         [0,0,1,0]],
        [[0,0,0,0],
         [0,0,0,0],
         [1,1,1,1],
         [0,0,0,0]],
    ],
    [
        [[1,1,0,0],
         [1,1,0,0],
         [0,0,0,0],
         [0,0,0,0]],
    ]
];

const PLAYER = {
    loc: {row: 2, col: 2},
    shapeRenderer: generateShapeRenderer(),
    atBottom: false,

    render() {
        this.shapeRenderer.render(this.loc);
    },

    moveRight() {
        const shape = this.shapeRenderer.shape.getArr();
        const n = this.loc.col+SHAPE_WIDTH - PG_WIDTH_IN_BLOCKS;
        if (n >= 0) {
            const col = SHAPE_WIDTH - n - 1;
            for (let i = 0; i < SHAPE_HEIGHT; i++) {
                if (shape[i][col] >= 1) return;
            }
        }

        const loc = {row: this.loc.row, col: this.loc.col+1};
        for (let row = 0; row < SHAPE_HEIGHT; row++) {
            for (let col = 0; col < SHAPE_WIDTH; col++) {
                if (
                    PG_BLOCKS[loc.row+row][loc.col+col] &&
                    shape[row][col] >= 1
                ) return;
            }
        }

        this.shapeRenderer.clear(this.loc);
        this.loc.col++;
        this.shapeRenderer.render(this.loc);
    },

    moveLeft() {
        const shape = this.shapeRenderer.shape.getArr();
        if (this.loc.col <= 0) {
            const col = -this.loc.col;
            for (const row of shape) {
                if (row[col] >= 1) return;
            }
        }

        const loc = {col: this.loc.col-1, row: this.loc.row};
        for (let row = 0; row < SHAPE_HEIGHT; row++) {
            for (let col = 0; col < SHAPE_WIDTH; col++) {
                if (
                    PG_BLOCKS[loc.row+row][loc.col+col] &&
                    shape[row][col] >= 1
                ) return;
            }
        }

        this.shapeRenderer.clear(this.loc);
        this.loc.col--;
        this.shapeRenderer.render(this.loc);
    },

    nextDirection() {
        if (
            this.loc.col < 0 ||
            this.loc.col+SHAPE_WIDTH > PG_WIDTH_IN_BLOCKS
        ) return;

        const nextDirShape = this.shapeRenderer.shape.peekNextDirection();
        for (let row = 0; row < SHAPE_HEIGHT; row++) {
            for (let col = 0; col < SHAPE_WIDTH; col++) {
                if (
                    nextDirShape[row][col] &&
                    PG_BLOCKS[this.loc.row+row][this.loc.col+col]
                ) return;
            }
        }

        this.shapeRenderer.clear(this.loc);
        this.shapeRenderer.shape.nextDirection();
        this.shapeRenderer.render(this.loc);
    },

    moveDown() {
        const n = this.loc.row+SHAPE_HEIGHT - PG_HEIGHT_IN_BLOCKS;
        if (n >= 0) {
            const row = this.shapeRenderer.shape.getArr()[SHAPE_HEIGHT - n - 1];
            for (const block of row) {
                if (block) {
                    this.atBottom = true;
                    return;
                }
            }
        }

        this.shapeRenderer.clear(this.loc);
        this.loc.row++;
        this.shapeRenderer.render(this.loc);
    },
};

function renderBlock(loc, bg0, bg1) {
    CONTEXT.fillStyle = bg0;
    CONTEXT.fillRect(PG_POS.x + loc.col*BLOCK_WIDTH, PG_POS.y + loc.row*BLOCK_HEIGHT, BLOCK_WIDTH, BLOCK_HEIGHT);
    CONTEXT.fillStyle = bg1;
    CONTEXT.fillRect(
        PG_POS.x + loc.col*BLOCK_WIDTH + BORDER,
        PG_POS.y + loc.row*BLOCK_HEIGHT + BORDER,
        INNER_BLOCK_WIDTH,
        INNER_BLOCK_HEIGHT
    );
}

function clearBlock(loc) {
    CONTEXT.fillStyle = PG_COLOR;
    CONTEXT.fillRect(
        PG_POS.x+loc.col*BLOCK_WIDTH,
        PG_POS.y+loc.row*BLOCK_HEIGHT,
        BLOCK_WIDTH,
        BLOCK_HEIGHT,
    );
}

function Shape(shapeId, shapeDirectionId = 0) {
    return {
        directions:  SHAPE_DIRECTIONS[shapeId],
        directionId: shapeDirectionId,

        getArr() {
            return this.directions[this.directionId];
        },

        nextDirection() {
            this.directionId+1 == this.directions.length
                ? this.directionId = 0
                : this.directionId++;
        },

        peekNextDirection() {
            return this.directionId+1 == this.directions.length
                ? this.directions[0]
                : this.directions[this.directionId+1];
        }
    };
}

function generateShapeRenderer() {
    let bg1 = [
        Math.floor(Math.random()*255), 
        Math.floor(Math.random()*255), 
        Math.floor(Math.random()*255)
    ];
    let bg0 = bg1.map(e => e *= 0.5);

    return {
        shape: Shape(Math.floor(Math.random()*SHAPE_DIRECTIONS.length)),
        blockBg0: `rgb(${bg0.toString()})`,
        blockBg1: `rgb(${bg1.toString()})`,

        render(loc) {
            let shape = this.shape.getArr();
            for (let y = 0; y < SHAPE_HEIGHT; y++) {
                for (let x = 0; x < SHAPE_WIDTH; x++) {
                    if (shape[y][x]) {
                        renderBlock(
                            {row: loc.row+y, col: loc.col+x},
                            this.blockBg0,
                            this.blockBg1,
                        );
                    }
                }
            }
        },

        clear(loc) {
            let shape = this.shape.getArr();
            for (let y = 0; y < SHAPE_HEIGHT; y++) {
                for (let x = 0; x < SHAPE_WIDTH; x++) {
                    if (!shape[y][x]) continue;
                    clearBlock({row: loc.row+y, col: loc.col+x});
                }
            }
        },
    };
}

function renderPg() {
    CONTEXT.clearRect(PG_POS.x, PG_POS.y, PG_WIDTH, PG_HEIGHT);

    CONTEXT.fillStyle = PG_COLOR;
    CONTEXT.fillRect(PG_POS.x, PG_POS.y, PG_WIDTH, PG_HEIGHT);

    for (let y = 0; y < PG_HEIGHT_IN_BLOCKS; y++) {
        for (let x = 0; x < PG_WIDTH_IN_BLOCKS; x++) {
            const block = PG_BLOCKS[y][x];
            if (!block) continue;
            renderBlock({row: y, col: x}, block.bg0, block.bg1);
        }
    }
}




document.addEventListener("keypress", e => {
    switch (e.code) {
        case "KeyH":
            PLAYER.moveLeft();
            break;

        case "KeyL":
            PLAYER.moveRight();
            break;

        case "KeyK":
            PLAYER.nextDirection();
            break;
    }
});

const palette = {bg0: "#aa0000", bg1:  "#ff0000"};
PG_BLOCKS[0][0] = palette;
PG_BLOCKS[1][0] = palette;
PG_BLOCKS[1][1] = palette;

PG_BLOCKS[0][PG_WIDTH_IN_BLOCKS-1] = palette;
PG_BLOCKS[1][PG_WIDTH_IN_BLOCKS-1] = palette;
PG_BLOCKS[1][PG_WIDTH_IN_BLOCKS-2] = palette;

setInterval(() => {
    PLAYER.moveDown();
}, 1000);

renderPg();
PLAYER.render();
