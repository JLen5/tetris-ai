import {
    RGB, Constants, Config, addVectors
} from './utilities.js'
import InputHandler from './input_handler.js'

export class Game {
    static fpsInterval = 1000 / Config.FPS
    constructor(grid) {
        this.grid = grid
        this.bag = [...Constants.pieces]
        this.currentPiece = this.getRandomPiece()
        this.nextPiece = this.getRandomPiece()

        this.fallInterval = 2 * Config.FPS // seconds * FPS = frames; seconds to wait before applying gravity
        this.fallCounter = 0

        this.lastTime = Date.now();
        this.timeElapsed = 0
    }

    /**
     * Set frame rate of loop. Returns true if the time-length of 1 frame has passed
     * - use in if() block; when true, run code for 1 frame, else do nothing
     * @returns {boolean}
     */
    tick() {
        this.timeElapsed =  Date.now() - this.lastTime
        if(this.timeElapsed > Game.fpsInterval){
            this.lastTime = Date.now() - (this.timeElapsed % Game.fpsInterval)
            return true
        }
        return false
    }

    /**
     * Update game state
     */
    update() {
        this.currentPiece.draw()  // draw current piece
        this.fallCounter += 1
        // if fallCounter satisfies interval, fall 1 tile
        if (this.fallCounter > this.fallInterval) {
            this.currentPiece.fall()
            this.fallCounter = 0
        }
    }

    /**
     * 
     * @param {InputHandler} keyboard 
     */
    handleKeys(keyboard) {
        // if key is pressed and has no cooldown, do action
        if (keyboard.isPressed(Config.keys['left']) && keyboard.isActive(Config.keys['left'])) {
            keyboard.setHoldCooldown(Config.keys['left'], 60)
            this.currentPiece.shift([-1, 0])
        }
        if (keyboard.isPressed(Config.keys['right']) && keyboard.isActive(Config.keys['right'])) {
            keyboard.setHoldCooldown(Config.keys['right'], 60)
            this.currentPiece.shift([1, 0])
        }

        if (keyboard.isPressed(Config.keys['rot-cw']) && keyboard.isActive(Config.keys['rot-cw'])) {
            keyboard.disableHold(Config.keys['rot-cw'])
            this.currentPiece.rotate(true)
        }
        if (keyboard.isPressed(Config.keys['rot-ccw']) && keyboard.isActive(Config.keys['rot-ccw'])) {
            keyboard.disableHold(Config.keys['rot-ccw'])
            this.currentPiece.rotate(false)
        }
        keyboard.tick()
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
    /**
     * @constructor
     * @param {number} gridW - # of tiles, width-wise
     * @param {number} gridH - # of tiles, height-wise
     * @param {number} tileW - width of 1 tile in grid
     */
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
    /**
     * @constructor
     * @param {number} r - row #
     * @param {number} c - column #
     * @param {number} w - tile width
     */
    constructor (r, c, w) {
        this.r = r
        this.c = c
        this.w = w
        this.colour = Constants.colours['x']  // default to background color
        this.borderColour = new RGB(255, 255, 255)
    } 
    /**
     * Set tile color
     * @param {RGB} color 
     */
    fill(color) {
        this.colour = color
    }

    empty() {
        this.colour = Constants.colours['x']
    }

    draw (ctx) {
        ctx.beginPath()
        ctx.fillStyle = this.colour.toHex()
        ctx.strokeStyle = this.borderColour.toHex()
        ctx.fillRect(this.r*this.w, this.c*this.w, this.w, this.w) // draw tile
        ctx.strokeRect(this.r*this.w, this.c*this.w, this.w, this.w) // draw border
    }
}

export class Piece {
    /**
     * @constructor
     * @param {Grid} grid 
     * @param {number} id - has value 'j', 'l', 't', 's', 'z', 'i' or 'o'
     */
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

    /**
     * Shift piece on the board in x/y direction
     * @param {Array<number>} vec - [x, y] offset applied aka [c, r] **NOT [r, c]
     */
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