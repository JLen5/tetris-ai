import {
    RGB, Constants, Config, addVectors, getColumn
} from './utilities.js'
import InputHandler from './input_handler.js'

export class Game {
    static fpsInterval = 1000 / Config.FPS
    constructor(grid, lookahead, holdDisplay) {
        this.grid = grid
        this.lookahead = lookahead
        this.holdDisplay = holdDisplay
        this.bag = structuredClone(Constants.pieces)
        this.currentPiece = this.getRandomPiece()
        this.heldPiece = null
        this.queue = this.#fullQueue(Config.lookAheadCount)

        this.fallInterval = 0.9 * Config.FPS // seconds * FPS = frames; seconds to wait before applying gravity
        this.fallCounter = 0

        this.lastTime = Date.now();
        this.timeElapsed = 0
        
        this.startLevel = 1
        this.level = this.startLevel
        this.score = 0
        this.linesCleared = 0

        this.canHold = true
        this.refreshLookahead = true
        this.refreshHoldDisplay = true
        this.refreshPointsDisplay = true

        this.scoreCalc = new ScoreCalculator()
        this.play = true

        this.action = ''
    }

    computeReward() {
        switch (this.action) {
            case 'failed':
                return -5
            case 'single':
                return 40
            case 'double':
                return 100
            case 'triple':
                return 300
            case 'tetris':
                return 1200
            case 'suck':
                return -2000
            default:
                return 1
        }
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
    update(ctx) {
        // this.currentPiece.update()
        this.currentPiece.drawGhost()
        this.currentPiece.draw()  // draw current piece
        this.fallCounter += 1
        // if fallCounter satisfies interval, fall 1 tile
        if (this.fallCounter > Math.max(3, this.fallInterval - 3*(this.level-1))) {  // fall speed caps out at level 18
            if (this.canMoveDown()) {
                this.currentPiece.fall()
            } else {
                this.linesCleared += this.clearLines()
                this.level = Math.floor(this.linesCleared / 10) + this.startLevel
                this.newPiece()
                this.canHold = true
            }  
            this.fallCounter = 0          
        }
        this.grid.draw(ctx)
    }
    /**
     * 
     * @param {InputHandler} keyboard 
     */
    handleKeys(keyboard) {
        // if key is pressed and has no cooldown, do action
        // left/right
        if (keyboard.isPressed(Config.keys['left']) && keyboard.isActive(Config.keys['left'])) {
            keyboard.setHoldCooldown(Config.keys['left'], Config.repeatKeySpeed, Config.repeatKeyDelay)
            this.action = 'failed'
            if(!this.canMoveLeft()) return
            this.action = 'left'
            this.currentPiece.shift(0, -1)
        }
        if (keyboard.isPressed(Config.keys['right']) && keyboard.isActive(Config.keys['right'])) {
            keyboard.setHoldCooldown(Config.keys['right'], Config.repeatKeySpeed, Config.repeatKeyDelay)
            this.action = 'failed'
            if(!this.canMoveRight()) return
            this.action = 'right'
            this.currentPiece.shift(0, 1)
        }
        // rotations
        if (keyboard.isPressed(Config.keys['rot-cw']) && keyboard.isActive(Config.keys['rot-cw'])) {
            keyboard.disableHold(Config.keys['rot-cw'])
            this.action = 'failed'
            if(!this.currentPiece.rotate(true)) return
            this.action = 'cw'
        }
        if (keyboard.isPressed(Config.keys['rot-ccw']) && keyboard.isActive(Config.keys['rot-ccw'])) {
            keyboard.disableHold(Config.keys['rot-ccw'])
            this.action = 'failed'
            if (!this.currentPiece.rotate(false)) return
            this.action = 'ccw'
        }
        // soft drop
        if (keyboard.isPressed(Config.keys['soft-drop']) && keyboard.isActive(Config.keys['soft-drop'])) {
            keyboard.setHoldCooldown(Config.keys['soft-drop'], Config.repeatKeySpeed, Config.repeatKeyDelay)
            if(!this.canMoveDown()) return
            this.currentPiece.fall()
            this.score += 1
            this.fallCounter = 0
        }
        // hard drop
        if (keyboard.isPressed(Config.keys['hard-drop']) && keyboard.isActive(Config.keys['hard-drop'])) {
            keyboard.disableHold(Config.keys['hard-drop'])
            this.hardDrop()
            this.action = 'hardDrop'
        }

        if(Config.allowHold && keyboard.isPressed(Config.keys['hold']) && keyboard.isActive(Config.keys['hold'])) {
            keyboard.disableHold(Config.keys['hold'])
            this.action = 'failed'
            if(!this.canHold) return
            this.canHold = false
            this.hold()
            this.action = 'hold'
        }
        keyboard.tick()
    }

    getTPiece() {
        return new Piece(this.grid, 't')
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
        let tiles = this.currentPiece.getTiles()
        let tile;
        for(let i=0;i<tiles.length;i++) {
            tile = tiles[i]
            if(tile[0] == 0) {
                return this.gameOver()
            }
        }
        this.currentPiece = this.editQueue()
        tiles = this.currentPiece.getTiles()
        let flag = false
        for(let i=0;i<tiles.length;i++) {
            tile = tiles[i]
            if(this.grid.tileIsOccupied(tile[0], tile[1])) {
                flag = true
                break
            }
        }
        if(flag) return this.gameOver()
        // if(!flag) return
        // let offsetAsStr = this.currentPiece.offset.join(',')
        // if(offsetAsStr == [1, 4].join(',')) return this.gameOver()
        // for(let i=0;i<tiles.length;i++) {
        //     tile = tiles[i]
        //     if(this.grid.tileIsOccupied(tile[0]+1, tile[1]+1)) {
        //         flag = true
        //         break
        //     }
        // }
        // if(flag) return this.gameOver()
        // Piece.startOffset = [1, 4]
        // this.currentPiece.offset = [1, 4]
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
        let actions = ['hardDrop', 'single', 'double', 'triple', 'tetris']
        let linesCleared = 0
        checkRows.forEach(row => {
            if(!this.grid.rowIsFull(row)) return
            linesCleared ++
            this.grid.clearRow(row)
        })
        this.action = actions[linesCleared]
        this.score += this.scoreCalc.score(linesCleared, this.level)
        return linesCleared
    }

    #fullQueue(lookAheadCount) {
        let queue = []
        for(let i=0;i<lookAheadCount;i++) {
            queue.push(this.getRandomPiece())
        }
        return queue
    }

    hold() {
        this.currentPiece.empty()
        this.currentPiece.emptyGhost()
        ;[this.heldPiece, this.currentPiece] = [this.currentPiece, this.heldPiece]
        this.heldPiece.reset()
        if(this.currentPiece == null) {
            this.currentPiece = this.editQueue()
        }
        this.refreshHoldDisplay = true
    }

    updateLookahead(ctx) {
        if(!this.refreshLookahead) return
        this.refreshLookahead = false
        let offset = [1, 1]
        this.lookahead.resetGrid()
        let v;
        this.queue.forEach(piece => {
            Constants.shapes[piece.id].forEach(tile => {
                v = addVectors(offset, tile)
                this.lookahead.fillTile(v[0], v[1], Constants.colours[piece.id])
            })
            offset[0] += 3
            
        })

        this.lookahead.draw(ctx)
    }

    editQueue() {
        this.queue.push(this.getRandomPiece())
        this.refreshLookahead = true
        return this.queue.shift()
    }

    updateHoldDisplay(ctx) {
        if(!this.refreshHoldDisplay || this.heldPiece == null) return
        this.refreshHoldDisplay = false
        this.holdDisplay.resetGrid()
        let v;
        Constants.shapes[this.heldPiece.id].forEach(tile => {
            v = addVectors(tile, [1,1])
            this.holdDisplay.fillTile(v[0], v[1], Constants.colours[this.heldPiece.id])
        })
        this.holdDisplay.draw(ctx)
    }

    updateScoreDisplay(display) {
        display.innerText = this.score
    }
    updateLevelDisplay(display) {
        display.innerText = this.level
    }
    updateLinesDisplay(display) {
        display.innerText = this.linesCleared
    }

    hardDrop() {
        this.score += this.currentPiece.hardDrop()
        this.linesCleared += this.clearLines()
        this.level = Math.floor(this.linesCleared / 10) + this.startLevel
        this.newPiece()
        this.canHold = true
        this.fallCounter = 0
    }
    
    gameOver() {
        this.play = false
        this.action = 'suck'
        console.log('you suck')
    }
}

export class Grid {
    /**
     * @constructor
     * @param {number} gridW - # of tiles, width-wise
     * @param {number} gridH - # of tiles, height-wise
     * @param {number} tileW - width of 1 tile in grid
     */
    constructor (gridW, gridH, tileW, lineColour, tilesAbove=0) {
        this.gridW = gridW
        this.gridH = gridH
        this.tileW = tileW
        this.lineColour = lineColour
        this.tilesAbove = tilesAbove
        this.tileData = this.#buildGrid()
    }

    getState() {
        let newRow;
        return this.tileData.map(row => {
            newRow = []
            row.forEach(td => {
                if(this.tileIsOccupied(td)) {
                    newRow.push(1)
                } else {
                    newRow.push(0)
                }
            })
            return newRow
        })
    }

    #buildGrid() {
        let tileData = []
        for (let i = 0; i < this.gridH; i++) {
            tileData.push(Array(this.gridW).fill(Constants.colours['x']))
        }
        return tileData
    }

    loadTSpinMap() {
        let tileData = []
        let row, newRow = [];
        for(let i=0;i<Constants.testTSpinMap.length;i++) {
            row = Constants.testTSpinMap[i]
            newRow = []
            row.forEach(t => {
                if(t == 0) {
                    newRow.push(Constants.colours['x'])
                } else {
                    newRow.push(Constants.colours['grey'])
                }
            })
            tileData.push(newRow)
        }
        this.tileData = tileData
    }

    resetGrid() {
        this.tileData = this.#buildGrid()
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
        ctx.fillRect((c)*this.tileW, (r-this.tilesAbove)*this.tileW, this.tileW, this.tileW)
    }

    drawGrid(ctx) {
        if(this.lineColour == null) return
        ctx.beginPath()
        ctx.strokeStyle = this.lineColour.toHex()
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
     * @param {String} id - has value 'j', 'l', 't', 's', 'z', 'i' or 'o'
     */

    static startOffset = [1, 4]
    constructor (grid, id) {
        this.grid = grid
        this.id = id
        this.shape = Constants.shapes[id]
        this.colour = Constants.colours[id]
        this.offset = structuredClone(Piece.startOffset)
        this.spacing;
        this.ghost = []
        this.ghostOffset = 0
        this.rotationState = 0
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

    reset() {
        this.offset = structuredClone(Piece.startOffset)
        this.shape = Constants.shapes[this.id]
        this.ghost = []
        this.ghostOffset = 0
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
        this.draw()
        this.drawGhost()
    }

    fall() {
        this.shift(1, 0)
    }

    rotate(cw=true) {
        if(this.id == 'o') return
        this.empty()
        this.emptyGhost()

        let shape = this.getRotatedArray(cw)
        if (this.adjustRotate(shape, cw)) {
            this.shape = shape
            this.rotationState += cw ? 1 : -1
            if(this.rotationState == -1) {
                this.rotationState = 3
            } else if(this.rotationState == 4) {
                this.rotationState = 0
            }
            return true
        }
        return false
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

    // rotationIsValid(s) {
    //     let rotatedShape = structuredClone(s)
    //     let offset = structuredClone(this.offset)
    //     for(let i=0;i<rotatedShape.length;i++) {
    //         let tilePos = addVectors(rotatedShape[i], offset)
    //         // check if tile out of bounds after rotating
    //         if(tilePos[1] < 0) {
    //             offset[1] += 1
    //         } else if(tilePos[1] > this.grid.gridW-1) {
    //             offset[1] -= 1
    //         } else if (tilePos[0] > this.grid.gridH-1) {
    //             offset[0] -= 1
    //         }
    //     }
    //     // check if new rotation overlaps existing blocks; if it does, cancel rotation
    //     for(let i=0;i<rotatedShape.length;i++) {
    //         let tile = addVectors(rotatedShape[i], offset)
    //         let tileData = this.grid.getTileData(tile[0], tile[1])
    //         if(tile == null || this.grid.tileIsOccupied(tileData)) return false
    //     }                    
    //     this.offset = offset
    //     return true
    // }

    adjustRotate(s, cw) {
        let rotatedShape = structuredClone(s)
        let offset = structuredClone(this.offset)
        let rotationCheck, rotationOffset;

        let state = this.rotationState
        if(!cw) {
            state -= 1
            if(state == -1) {
                state = 3
            }
        }
        if(this.id == 'i') {
            rotationCheck = structuredClone(Constants.wallKickData_IPiece[state])
        } else {
            rotationCheck = structuredClone(Constants.wallKickData[state])
        }
        // console.log(rotationCheck)
        console.log(this.rotationState)
        rotationCheck.splice(0, 0, [0, 0]) // to check normal rotation
        
        let rotationInvalid = false
        let tile;
        for(let j=0;j<rotationCheck.length;j++) {  // go through each rotation check
            rotationInvalid = false;
            rotationOffset = rotationCheck[j]
            if(!cw) {
                rotationOffset.map(v => {
                    return -v
                })
            }
            console.log("rotationOffset", rotationOffset)
            for (let i=0;i<rotatedShape.length;i++) {  // check each tile
                tile = addVectors(addVectors(rotatedShape[i], offset), rotationOffset)
                // console.log("tile", tile)
                // if not null and not occupied
                // console.log("a", this.grid.getTileData(tile[0], tile[1]) == null)
                // if(this.grid.getTileData(tile[0], tile[1]) != null) console.log("b", this.grid.tileIsOccupied(tile[0], tile[1]))
                // console.log("c", !this.grid.tileInPiece(tile[0], tile[1], this))
                if(this.grid.getTileData(tile[0], tile[1]) == null || (this.grid.tileIsOccupied(tile[0], tile[1]))) {
                    rotationInvalid = true
                    break
                }
            }
            if(!rotationInvalid) break // if detected valid, stop checking new rotation offsets
        }
        // if no detected valid rotation offsets, return false
        if(rotationInvalid) return false
        this.offset = addVectors(offset, rotationOffset)  // adjust valid offset
        return true
        // if grid.getTileData == null (out of bounds) || grid.tileIsOccupied
    
        // for(let i=0;i<rotatedShape.length;i++) {
        //     let tilePos = addVectors(rotatedShape[i], offset)
        //     // check if tile out of bounds after rotating
        //     if(tilePos[1] < 0) {
        //         offset[1] += 1
        //     } else if(tilePos[1] > this.grid.gridW-1) {
        //         offset[1] -= 1
        //     } else if (tilePos[0] > this.grid.gridH-1) {
        //         offset[0] -= 1
        //     }
        // }
        // check if new rotation overlaps existing blocks; if it does, cancel rotation
        // for(let i=0;i<rotatedShape.length;i++) {
        //     let tile = addVectors(rotatedShape[i], offset)
        //     let tileData = this.grid.getTileData(tile[0], tile[1])
        //     if(tile == null || this.grid.tileIsOccupied(tileData)) return false
        // }
        // this.offset = offset
        // return true
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
        this.ghostOffset = spaceBelow
        if(spaceBelow == 0) return []
        tiles.forEach(tile => {
            ghostTiles.push([tile[0] + spaceBelow, tile[1]])
        })
        return ghostTiles
    }

    drawGhost() {
        let ghostTiles = this.getGhostTiles()
        ghostTiles.forEach(tile => {
            this.grid.fillTile(tile[0], tile[1], Constants.colours['ghost'])
        })
        this.ghost = ghostTiles
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
        if(this.ghostOffset == 0) return 0
        this.empty()
        this.offset[0] += this.ghostOffset
        let score = this.ghostOffset * 2
        this.ghost.forEach(tile => {
            this.grid.fillTile(tile[0], tile[1], this.colour)
        })
        this.ghostOffset = 0
        return score
    }
}

export class ScoreCalculator {
    // based on NES tetris
    constructor() {
        this.multiplierByLines = {
            1: 40,
            2: 100,
            3: 300,
            4: 1200
        }
    }

    score(lines, level) {
        if(lines == 0) return 0
        return this.multiplierByLines[lines]*(level+1)
    }
}