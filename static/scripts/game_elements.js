import {
    RGB, Constants, addVectors
} from './utilities.js'

export class Game {
    constructor(grid) {
        this.grid = grid
        this.bag = [...Constants.pieces]
        this.nextPiece = this.getRandomPiece()
    }

    getRandomPiece() {
        if (this.bag.length === 0) {
            this.bag = [...Constants.pieces]
        }
        let idx = Math.floor(Math.random()*this.bag.length)
        return new Piece(this.grid, this.bag.splice(idx))
    }
}

export class Grid {
    constructor (gridW, gridH, tileW) {
        this.gridW = gridW
        this.gridH = gridH
        this.tileW = tileW
        this.tiles = this.#buildGrid()
    }

    #buildGrid() {
        let tiles = []
        for (let i = 0; i < this.gridW; i++) {
            let row = []
            for (let j = 0; j < this.gridH; j++) {
                row.push(new Tile(i, j, this.tileW))
            }
            tiles.push(row)
        }
        return tiles
    }

    getTile(r, c) {
        return this.tiles[r][c]
    }

    update() {
        
    }

    draw(ctx) {
        this.tiles.forEach(row => {
            row.forEach( t => {
                t.draw(ctx)
            })
        })
    }
}

export class Tile {
    constructor (r, c, w) {
        this.r = r
        this.c = c
        this.w = w
        this.colour = new RGB(0, 0, 0)
        this.borderColour = new RGB(255, 255, 255)
    } 
    fill(color) {
        this.colour = color
    }

    draw (ctx) {
        ctx.beginPath()
        ctx.strokeStyle = this.borderColour.toHex()
        ctx.fillStyle = this.colour.toHex()
        ctx.fillRect(this.r*this.w, this.c*this.w, this.w, this.w)
        ctx.strokeRect(this.r*this.w, this.c*this.w, this.w, this.w)
    }
}

export class Piece {
    // id = 'j', 'l', 't', 's', 'z', 'i', 'o'
    constructor (grid, id) {
        this.grid = grid
        this.shape = Constants.shapes[id]
        this.color = Constants.colours[id]
        this.offset = [1, 4]
    }

    draw() {
        this.shape.forEach(pos => {
            let p = addVectors(pos, this.offset)
            let tile = this.grid.getTile(p[1], p[0])
            tile.fill(this.color)
        })
    }

}