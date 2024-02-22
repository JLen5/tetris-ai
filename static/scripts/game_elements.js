import {
    RGB, Constants, Config, addVectors, getColumn
} from './utilities.js'
import InputHandler from './input_handler.js'

export class Game {
    static fpsInterval = 1000 / Config.FPS
    constructor(grid) {
        this.grid = grid
        this.bag = structuredClone(Constants.pieces)
        this.currentPiece = this.getRandomPiece()
        this.nextPiece = this.getRandomPiece()

        this.fallInterval = 0.5 * Config.FPS // seconds * FPS = frames; seconds to wait before applying gravity
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
        // this.currentPiece.update()
        this.currentPiece.drawGhost()
        this.currentPiece.draw()  // draw current piece
        this.fallCounter += 1
        // if fallCounter satisfies interval, fall 1 tile
        if (this.fallCounter > this.fallInterval) {
            if (this.canMoveDown()) {
                this.currentPiece.fall()
                this.fallCounter = 0
            } else {
                this.clearLines()
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
            this.currentPiece.shift(0, -1)
        }
        if (keyboard.isPressed(Config.keys['right']) && keyboard.isActive(Config.keys['right'])) {
            keyboard.setHoldCooldown(Config.keys['right'], 60)
            if(!this.canMoveRight()) return
            this.currentPiece.shift(0, 1)
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
        // soft drop
        if (keyboard.isPressed(Config.keys['soft-drop']) && keyboard.isActive(Config.keys['soft-drop'])) {
            keyboard.setHoldCooldown(Config.keys['soft-drop'], 30)
            if(!this.canMoveDown()) return
            this.currentPiece.fall()
            this.fallCounter = 0
        }
        // hard drop
        if (keyboard.isPressed(Config.keys['hard-drop']) && keyboard.isActive(Config.keys['hard-drop'])) {
            keyboard.disableHold(Config.keys['hard-drop'])
            this.currentPiece.hardDrop()
            this.fallCounter = this.fallInterval+1
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

    clearLines() {
        let checkRows = this.currentPiece.getOccupiedRows().sort()
        let linesCleared = 0
        checkRows.forEach(row => {
            if(!this.grid.rowIsFull(row)) return
            linesCleared ++
            this.grid.clearRow(row)
        })
        return linesCleared
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
        this.tileData = this.#buildGrid()
    }

    #buildGrid() {
        let tileData = []
        for (let i = 0; i < this.gridH; i++) {
            tileData.push(Array(this.gridW).fill(Constants.colours['x']))
        }
        return tileData
    }

    getTileData(r, c) {
        if(this.tileData[r] == null) return null
        return this.tileData[r][c]
    }

    draw(ctx) {
        for(let i=0;i<this.gridH;i++) {
            for(let j = 0;j<this.gridW;j++) {
                this.drawTile(ctx, i, j)
            }
        }
        this.drawGrid(ctx)
    }

    drawTile(ctx, r, c) {
        ctx.beginPath()
        let tile = this.tileData[r][c]
        ctx.fillStyle = tile.toHex()
        ctx.fillRect(c*this.tileW, r*this.tileW, this.tileW, this.tileW)
        
        // ctx.fillStyle = this.colour.toHex()
        // ctx.strokeStyle = this.borderColour.toHex()
        // ctx.fillRect(this.c*this.w, this.r*this.w, this.w, this.w) // draw tile
        // ctx.strokeRect(this.c*this.w, this.r*this.w, this.w, this.w) // draw border
    }

    drawGrid(ctx) {
        ctx.beginPath()
        ctx.strokeStyle = Constants.colours['gridline'].toHex()
        ctx.lineWidth = 1
        // vertical lines
        let maxX = this.gridW*this.tileW, maxY = this.gridH*this.tileW
        let x, y
        for(let j=0;j<this.gridW+1;j++) {
            x = j*this.tileW
            ctx.moveTo(x, 0)
            ctx.lineTo(x, maxY)
            ctx.stroke()
        }
        // horizontal lines
        for(let i=0;i<this.gridH+1;i++) {
            y = i*this.tileW
            ctx.moveTo(0, y)
            ctx.lineTo(maxX, y)
            ctx.stroke()
        }

    }

    canMoveLeft(piece) {
        return piece.leftSpacing() > 0
    }

    canMoveRight(piece) {
        return piece.rightSpacing() > 0
    }

    canMoveDown(piece) {
        return piece.bottomSpacing() > 0
    }

    tileIsOccupied(r, c) {
        if(typeof c !== "undefined") {
            let tileData = this.getTileData(r, c)
            return !(tileData.isEqualTo(Constants.colours['x']) || tileData.isEqualTo(Constants.colours['ghost']))
        }
        return !(r.isEqualTo(Constants.colours['x']) || r.isEqualTo(Constants.colours['ghost'])) // if only one argument, r = colour of a tile
    }

    rowIsFull(r) {
        let row = this.tileData[r]
        for(let j=0;j<row.length;j++) {
            if(!this.tileIsOccupied(row[j])) return false
        }
        return true
    }

    spaceBelowTile(r, c) {
        let spaceCount = 0
        let rowsBelow = this.tileData.slice(r+1)
        for(let i=0;i<rowsBelow.length;i++) {
            let tile = rowsBelow[i][c]
            if (this.tileIsOccupied(tile)) break
            spaceCount++
        }
        return spaceCount
    }

    spaceLeftTile(r, c) {
        let spaceCount = 0
        for(let j=c-1;j>=0;j--) {
            let tile = this.tileData[r][j]
            if(this.tileIsOccupied(tile)) break
            spaceCount++
        }
        return spaceCount
    }

    spaceRightTile(r, c) {
        let spaceCount = 0
        for(let j=c+1;j<this.gridW;j++) {
            let tile = this.tileData[r][j]
            if(this.tileIsOccupied(tile)) break
            spaceCount ++
        }
        return spaceCount
    }

    emptyTile(r, c) {
        this.tileData[r][c] = Constants.colours['x']
    }

    fillTile(r, c, colour) {
        this.tileData[r][c] = colour
    }

    clearRow (r) {
        this.tileData.splice(r, 1) // remove row from tile data
        this.tileData.splice(0, 0, Array(this.gridW).fill(Constants.colours['x']))  // add empty row to top
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
        this.spacing;
        this.ghost = []
        this.ghostOffset = 0
    }

    draw () {
        let tiles = this.getTiles()
        tiles.forEach(tile => {
            this.grid.fillTile(tile[0], tile[1], this.colour)
        })
    }

    empty() {
        let tiles = this.getTiles()
        tiles.forEach(tile => {
            this.grid.emptyTile(tile[0], tile[1])
        })
    }

    getTiles() {
        let tiles = []
        this.shape.forEach(ds => {
            tiles.push(addVectors(ds, this.offset))
        })
        return tiles
    }

    shift (r, c) {
        this.empty()
        this.emptyGhost()
        this.offset = addVectors(this.offset, [r, c])
    }

    fall() {
        this.shift(1, 0)
    }

    rotate(cw=true) {
        if(this.id == 'o') return
        this.empty()
        this.emptyGhost()

        let shape = this.getRotatedArray(cw)
        if (this.adjustRotate(shape)) {
            this.shape = shape
        }
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
        let rotatedShape = structuredClone(s)
        let offset = structuredClone(this.offset)
        for(let i=0;i<rotatedShape.length;i++) {
            let tilePos = addVectors(rotatedShape[i], offset)
            // check if tile out of bounds after rotating
            if(tilePos[1] < 0) {
                offset[1] += 1
            } else if(tilePos[1] > this.grid.gridW-1) {
                offset[1] -= 1
            } else if (tilePos[0] > this.grid.gridH-1) {
                offset[0] -= 1
            }
        }
        // check if new rotation overlaps existing blocks; if it does, cancel rotation
        for(let i=0;i<rotatedShape.length;i++) {
            let tile = addVectors(rotatedShape[i], offset)
            let tileData = this.grid.getTileData(tile[0], tile[1])
            if(tile == null || this.grid.tileIsOccupied(tileData)) return false
        }
        this.offset = offset
        return true
    }

    getBottomPieceTiles() {
        let bottomTiles = []
        let cols = {}
        let tiles = this.getTiles()
        // tiles.forEach(tile => {
        //     if(cols[tile[1]] != null && cols[tile[1]])
        // })
        tiles.forEach(tile => {
            let r = tile[0], c = tile[1]
            if(cols[c] != null && cols[c] > r) return
            cols[c] = r
        })

        for (const col in cols) {
            bottomTiles.push([cols[col], col])
        }
        return bottomTiles
    }

    getSidePieceTiles(left=true) {
        let sideTiles = []
        let rows = []
        let tiles = this.getTiles()
        let l = left ? 1 : -1
        tiles.forEach(tile => {
            let r = tile[0], c = tile[1]
            if(rows[r] != null && rows[r]*l < c*l) return
            rows[r] = c
        })
        for (const row in rows) {
            sideTiles.push([row, rows[row]])
        }
        return sideTiles
    }

    bottomSpacing() {
        let bottomTiles = this.getBottomPieceTiles()
        let spaceBelow = this.grid.gridH
        bottomTiles.forEach(tile => {
            spaceBelow = Math.min(spaceBelow, this.grid.spaceBelowTile(tile[0], tile[1]))
        })
        return spaceBelow
    }

    leftSpacing() {
        let leftTiles = this.getSidePieceTiles(true)
        let spaceLeft = this.grid.gridW
        leftTiles.forEach(tile => {
            spaceLeft = Math.min(spaceLeft, this.grid.spaceLeftTile(tile[0], tile[1]))
        })
        return spaceLeft
    }

    rightSpacing() {
        let rightTiles = this.getSidePieceTiles(false)
        let spaceRight = this.grid.gridW
        rightTiles.forEach(tile => {
            spaceRight = Math.min(spaceRight, this.grid.spaceRightTile(tile[0], tile[1]))
        })
        return spaceRight
    }

    getGhostTiles() {
        let ghostTiles = []
        let bottomTiles = this.getBottomPieceTiles()
        let spaceBelow = this.grid.gridH
        let tiles = this.getTiles()
        bottomTiles.forEach(tile => {
            spaceBelow = Math.min(spaceBelow, this.grid.spaceBelowTile(tile[0], tile[1]))
        })
        if(spaceBelow == 0) return []
        tiles.forEach(tile => {
            ghostTiles.push([tile[0] + spaceBelow, tile[1]])
        })
        this.ghostOffset = spaceBelow
        return ghostTiles
    }

    drawGhost() {
        let ghostTiles = this.getGhostTiles()
        ghostTiles.forEach(tile => {
            this.grid.fillTile(tile[0], tile[1], Constants.colours['ghost'])
        })
    }

    emptyGhost() {
        let ghostTiles = this.getGhostTiles()
        ghostTiles.forEach(tile => {
            this.grid.emptyTile(tile[0], tile[1])
        })
    }

    getOccupiedRows() {
        let rows = []
        let tiles = this.getTiles()
        tiles.forEach(tile => {
            if(rows.includes(tile[0])) return
            rows.push(tile[0])
        })
        return rows
    }

    hardDrop() {
        this.empty()
        this.offset[0] += this.ghostOffset
        let ghostTiles = this.getGhostTiles()
        ghostTiles.forEach(tile => {
            this.grid.fillTile(tile[0], tile[1], this.colour)
        })
        this.ghostOffset = 0
    }
}