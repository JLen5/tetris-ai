import {
    RGB, Constants, Config, addVectors
} from './utilities.js'

export class Game {
    static fpsInterval = 1000 / Config.FPS
    constructor(grid) {
        this.grid = grid
        this.bag = [...Constants.pieces]
        this.currentPiece = this.getRandomPiece()
        this.nextPiece = this.getRandomPiece()

        this.fallInterval = 2 * Config.FPS // seconds * FPS = frames
        this.fallCounter = 0

        this.lastTime = Date.now();
        this.timeElapsed = 0
    }

    tick() {
        this.timeElapsed =  Date.now() - this.lastTime
        if(this.timeElapsed > Game.fpsInterval){
            this.lastTime = Date.now() - (this.timeElapsed % Game.fpsInterval)
            this.fallCounter += 1
            return true
        }
        return false
    }

    update() {
        this.currentPiece.draw()
        if (this.fallCounter > this.fallInterval) {
            // this.currentPiece.empty()
            this.currentPiece.fall()
            this.fallCounter = 0
        }
    }

    handleKeys(inputs) {
        if (Config.keys['left'] in inputs.keys) {
            if (inputs.keys[Config.keys['left']] <= 0) {
                inputs.keys[Config.keys['left']] = 60
                this.currentPiece.shift([-1, 0])
            }
        }
        if (Config.keys['right'] in inputs.keys) {
            if (inputs.keys[Config.keys['right']] <= 0) {
                console.log('hi')
                inputs.keys[Config.keys['right']] = 60
                this.currentPiece.shift([1, 0])
            }
        }
    }

    getRandomPiece() {
        // reset bag
        if (this.bag.length === 0) {
            this.bag = [...Constants.pieces]
        }

        let idx = Math.floor(Math.random()*this.bag.length)
        return new Piece(this.grid, this.bag.splice(idx, 1))
    }

    newPiece() {
        this.currentPiece = this.nextPiece
        this.nextPiece = this.getRandomPiece()
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
        this.colour = Constants.colours['x']
        this.borderColour = new RGB(255, 255, 255)
    } 

    fill(color) {
        this.colour = color
    }

    empty() {
        this.colour = Constants.colours['x']
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

    empty() {
        this.shape.forEach(pos => {
            let p = addVectors(pos, this.offset)
            let tile = this.grid.getTile(p[1], p[0])
            tile.empty()
        })
    }

    shift (vec) {
        this.empty()
        this.offset = addVectors(this.offset, vec.reverse())
    }

    fall() {
        this.shift([0, 1])
    }

}