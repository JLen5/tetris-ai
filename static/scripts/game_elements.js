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
        if (inputs.isPressed(Config.keys['left']) && inputs.isActive(Config.keys['left'])) {
            inputs.setHoldCooldown(Config.keys['left'], 60)
            this.currentPiece.shift([-1, 0])
        }
        if (inputs.isPressed(Config.keys['right']) && inputs.isActive(Config.keys['right'])) {
            inputs.setHoldCooldown(Config.keys['right'], 60)
            this.currentPiece.shift([1, 0])
        }

        if (inputs.isPressed(Config.keys['rot-cw']) && inputs.isActive(Config.keys['rot-cw'])) {
            inputs.disableHold(Config.keys['rot-cw'])
            this.currentPiece.rotate(true)
        }
        if (inputs.isPressed(Config.keys['rot-ccw']) && inputs.isActive(Config.keys['rot-ccw'])) {
            inputs.disableHold(Config.keys['rot-ccw'])
            this.currentPiece.rotate(false)
        }
        inputs.tick()
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
        this.id = id
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

    rotate(cw=true) {
        if(this.id == 'o') return
        this.empty()

        let a, b  // temporarily store row/col # 
        let d // direction factor (do different math for cw vs. ccw)

        // special case: i-piece rotation
        if(this.id == 'i') {
            d = cw ? 0 : 1  // if cw, swap a = row#, b = col# to a = col#, b = row# because it works
            this.shape.map(pos => {
                a = pos[0+d]
                b = pos[1-d]
                pos[0+d] = b  // cw: row becomes col ; ccw: col becomes row
                pos[1-d] = 1-a  // from (a-1)*-1; it just works trust
                // if (cw){
                //     let r = pos[0]
                //     let c = pos[1]
                //     pos[0] = c
                //     pos[1] = 1-r 
                // } else {
                //     let r = pos[0]
                //     let c = pos[1]
                //     pos[0] = 1-c
                //     pos[1] = r
                // }
            })
            return
        }

        // pieces that aren't i or o
        d = cw ? 1 : -1  // if cw do nothing, if ccw switch signs because it works (#trustmebro)
        this.shape.map(pos => {
            a = pos[0]  // a = row#
            b = pos[1]  // b = col#
            pos[0] = b * d  // cw: row becomes col; ccw: col becomes row
            pos[1] = a *-1 * d  // cw: col becomes -row; ccw: row becomes -col; why?: because i said so 
        })
    }

}