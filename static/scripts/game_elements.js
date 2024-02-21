import {
    RGB, Constants, Config, addVectors
} from './utilities.js'
import InputHandler from './input_handler.js'

export class Game {
    static fpsInterval = 1000 / Config.FPS
    constructor(grid) {
        this.grid = grid
        this.bag = structuredClone(Constants.pieces)
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
        this.currentPiece.update()
        this.currentPiece.drawGhost()
        this.currentPiece.draw()  // draw current piece
        this.fallCounter += 1
        // if fallCounter satisfies interval, fall 1 tile
        if (this.fallCounter > this.fallInterval) {
            if (this.canMoveDown()) {
                this.currentPiece.fall()
                this.fallCounter = 0
            } else {
                this.newPiece()
            }            
        }
    }

    /**
     * 
     * @param {InputHandler} keyboard 
     */
    handleKeys(keyboard) {
        // if key is pressed and has no cooldown, do action
        // left/right
        if (keyboard.isPressed(Config.keys['left']) && keyboard.isActive(Config.keys['left'])) {
            keyboard.setHoldCooldown(Config.keys['left'], 60)
            if(!this.canMoveLeft()) return
            this.currentPiece.shift([-1, 0])
        }
        if (keyboard.isPressed(Config.keys['right']) && keyboard.isActive(Config.keys['right'])) {
            keyboard.setHoldCooldown(Config.keys['right'], 60)
            if(!this.canMoveRight()) return
            this.currentPiece.shift([1, 0])
        }
        // rotations
        if (keyboard.isPressed(Config.keys['rot-cw']) && keyboard.isActive(Config.keys['rot-cw'])) {
            keyboard.disableHold(Config.keys['rot-cw'])
            this.currentPiece.rotate(true)
        }
        if (keyboard.isPressed(Config.keys['rot-ccw']) && keyboard.isActive(Config.keys['rot-ccw'])) {
            keyboard.disableHold(Config.keys['rot-ccw'])
            this.currentPiece.rotate(false)
        }
        // drop
        if (keyboard.isPressed(Config.keys['soft-drop']) && keyboard.isActive(Config.keys['soft-drop'])) {
            keyboard.setHoldCooldown(Config.keys['soft-drop'], 30)
            if(!this.canMoveDown()) return
            this.currentPiece.fall()
            this.fallCounter = 0
        }
        keyboard.tick()
    }

    getRandomPiece() {
        // reset bag
        if (this.bag.length === 0) {
            this.bag = structuredClone(Constants.pieces)
        }

        let idx = Math.floor(Math.random()*this.bag.length)
        return new Piece(this.grid, this.bag.splice(idx, 1))
    }

    newPiece() {
        this.currentPiece = this.nextPiece
        this.nextPiece = this.getRandomPiece()
    }

    canMoveLeft() {
        return this.grid.canMoveLeft(this.currentPiece)
    }

    canMoveRight() {
        return this.grid.canMoveRight(this.currentPiece)
    }

    canMoveDown() {
        return this.grid.canMoveDown(this.currentPiece)
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
        for (let i = 0; i < this.gridH; i++) {
            let row = []
            for (let j = 0; j < this.gridW; j++) {
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

    canMoveLeft(piece) {
        return piece.bounds['left'] > 0
    }

    canMoveRight(piece) {
        return piece.bounds['right'] < this.gridW-1
    }

    canMoveDown(piece) {
        // return piece.bounds['bottom'] < this.gridH-1
        return piece.bottomSpacing() > 0
    }

    spaceBelowPosition(r, c) {
        let spaceCount = 0
        let rowsBelow = this.tiles.slice(r+1)
        for(let i=0;i<rowsBelow.length;i++) {
            let tile = rowsBelow[i][c]
            console.log(tile.colour)
            if (tile.isOccupied()) {
                break
            }
            spaceCount++
        }
        return spaceCount
    }

    spaceBelowTile(tile) {
        return this.spaceBelowPosition(tile.r, tile.c)
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
        this.colour = Constants.colours['x']  // default to background colour
        this.borderColour = Constants.colours['gridline']
    } 
    /**
     * Set tile colour
     * @param {RGB} colour 
     */
    fill(colour) {
        this.colour = colour
    }

    empty() {
        this.borderColour = Constants.colours['gridline']
        this.colour = Constants.colours['x']
    }

    isOccupied() {
        return !(this.colour.isEqualTo(Constants.colours['x']) || this.colour.isEqualTo(Constants.colours['ghost']))
    }

    draw (ctx) {
        ctx.beginPath()
        ctx.fillStyle = this.colour.toHex()
        ctx.strokeStyle = this.borderColour.toHex()
        ctx.fillRect(this.c*this.w, this.r*this.w, this.w, this.w) // draw tile
        ctx.strokeRect(this.c*this.w, this.r*this.w, this.w, this.w) // draw border
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
        this.colour = Constants.colours[id]
        this.offset = [1, 4]
        this.bounds;  // see updatePieceBounds() for description
        this.updatePieceBounds()  // init value of this.bounds
        this.spacing;
        this.tiles = this.getTiles()
        this.ghost = []
    }

    update() {
        this.tiles = this.getTiles()
        this.updatePieceBounds()
    }

    draw() {
        this.tiles.forEach(tile => {
            tile.fill(this.colour)
        })
    }

    empty() {
        this.tiles.forEach(tile => {
            tile.empty()
        })
    }

    drawGhost() {
        this.ghost.forEach(tile => {
            tile.empty()
        })
        this.ghost = this.getGhostTiles()
        this.ghost.forEach(tile => {
            tile.fill(Constants.colours['ghost'])
        })
    }

    /**
     * Shift piece on the board in x/y direction
     * @param {Array<number>} vec - [x, y] offset applied aka [c, r] **NOT [r, c]
     */
    shift (vec) {
        this.empty()
        this.offset = addVectors(this.offset, vec.reverse())
        console.log(this.offset)
    }

    fall() {
        this.shift([0, 1])
    }

    rotate(cw=true) {
        if(this.id == 'o') return
        this.empty()

        let shape = this.getRotatedArray(cw)
        shape = this.adjustRotate(shape)
        this.shape = shape
    }

    getRotatedArray(cw=true) {
        let a, b  // temporarily store row/col # 
        let d // direction factor (do different math for cw vs. ccw)
        let shape = structuredClone(this.shape)
        // special case: i-piece rotation
        if (this.id == 'i') {
            d = cw ? 0 : 1  // if cw, swap a = row#, b = col# to a = col#, b = row# because it works
            shape.map(pos => {
                a = pos[0+d]
                b = pos[1-d]
                pos[0+d] = b  // cw: row becomes col ; ccw: col becomes row
                pos[1-d] = 1-a  // from (a-1)*-1; it just works trust
            })
        } else { // pieces that aren't i or o
            d = cw ? 1 : -1  // if cw do nothing, if ccw switch signs because it works (#trustmebro)
            shape.map(pos => {
                a = pos[0]  // a = row#
                b = pos[1]  // b = col#
                pos[0] = b * d  // cw: row becomes col; ccw: col becomes row
                pos[1] = a *-1 * d  // cw: col becomes -row; ccw: row becomes -col; why?: because i said so 
            })
        }
        return shape
    }

    adjustRotate(s) {
        let shape = structuredClone(s)
        let rotateBounds = this.#shapeBounds(shape, this.offset)
        if(rotateBounds['left'] < 0) {
            this.offset[1] += -rotateBounds['left']
        } else if(rotateBounds['right'] > this.grid.gridW-1) {
            this.offset[1] += this.grid.gridW-rotateBounds['right']-1
        } else if(rotateBounds['bottom'] > this.grid.gridH-1) {
            this.offset[0] += this.grid.gridH-rotateBounds['bottom']-1
        }
        return shape
    }

    updatePieceBounds() {
        this.bounds = this.#shapeBounds(this.shape, this.offset)
    }

    /**
     * Returns bounds of the piece:
     * - 'left': col# of leftmost tile in piece
     * - 'right': col# of rightmost tile in piece
     * - 'bottom': row# of bottommost tile in piece
     */
    #shapeBounds(shape, offset=[0, 0]) {
        let leftBound = shape[0][1], rightBound = shape[0][1], bottomBound = shape[0][0]
        for (let i=1;i<shape.length;i++) {
            leftBound = Math.min(leftBound, shape[i][1])
            rightBound = Math.max(rightBound, shape[i][1])
            bottomBound = Math.max(bottomBound, shape[i][0])
        }

        return {'left': leftBound + offset[1], 'right': rightBound + offset[1], 'bottom': bottomBound + offset[0]}
    }

    getTiles() {
        let tiles = []
        this.shape.forEach(pos => {
            let p = addVectors(pos, this.offset)
            let tile = this.grid.getTile(p[0], p[1])
            tiles.push(tile)
        })
        return tiles
    }

    getBottomPieceTiles() {
        let tiles = []
        let cols = {}
        this.tiles.forEach(tile => {
            if(cols[tile.c] != null && cols[tile.c].r > tile.r) return
            cols[tile.c] = tile
        })
        for (const col in cols) {
            tiles.push(cols[col])
        }
        return tiles
    }

    bottomSpacing() {
        let bottomTiles = this.getBottomPieceTiles()
        let spaceBelow = this.grid.gridH
        bottomTiles.forEach(tile => {
            spaceBelow = Math.min(spaceBelow, this.grid.spaceBelowTile(tile))
            console.log("tile", tile, this.grid.spaceBelowTile(tile))
        })
        return spaceBelow
    }

    getGhostTiles() {
        let ghostTiles = []
        let bottomTiles = this.getBottomPieceTiles()
        let spaceBelow = this.grid.gridH
        bottomTiles.forEach(tile => {
            spaceBelow = Math.min(spaceBelow, this.grid.spaceBelowTile(tile))
            console.log("tile", tile, this.grid.spaceBelowTile(tile))
        })
        console.log("space below", spaceBelow)
        if(spaceBelow == 0) return []
        this.tiles.forEach(tile => {
            ghostTiles.push(this.grid.getTile(tile.r + spaceBelow, tile.c))
        })
        return ghostTiles
    }
}