import {
    Grid,
    Game
} from './game_elements.js'

import InputHandler from './input_handler.js'
import { Constants } from './utilities.js'


const canvasMain = document.querySelector('canvas#game')
const ctxMain = canvasMain.getContext('2d')

const canvasLookahead = document.querySelector('canvas#lookahead')
const ctxLookahead = canvasLookahead.getContext('2d')

const canvasHold = document.querySelector('canvas#hold')
const ctxHold = canvasHold.getContext('2d')

const scoreDisplay = document.querySelector('span#score')
const levelDisplay = document.querySelector('span#level')
const linesDisplay = document.querySelector('span#lines')

const tileW = 24
const grid = new Grid(10, 20, tileW, Constants.colours['gridline'])
const lookahead = new Grid(4, 14, tileW)
const holdDisplay = new Grid(4, 2, tileW)

const game = new Game(grid, lookahead, holdDisplay)
const inputs = new InputHandler()

canvasMain.width = grid.gridW*grid.tileW
canvasMain.height = grid.gridH*grid.tileW

canvasLookahead.width = grid.tileW*4
canvasLookahead.height = grid.tileW*14

canvasHold.width = grid.tileW*4
canvasHold.height = grid.tileW*2

// game loop
function gameLoop() {
    if(game.tick()) {
        ctxMain.clearRect(0, 0, canvasMain.width, canvasMain.height) // clear canvas
        ctxLookahead.clearRect(0, 0, canvasLookahead.width, canvasLookahead.height) // clear canvas
        
        game.handleKeys(inputs)
        game.update(ctxMain)
        game.updateLookahead(ctxLookahead)
        game.updateHoldDisplay(ctxHold)
        game.updateScoreDisplay(scoreDisplay)
        game.updateLevelDisplay(levelDisplay)
        game.updateLinesDisplay(linesDisplay)
        lookahead.draw(ctxLookahead)
        holdDisplay.draw(ctxHold)
        

        // grid.draw(ctxMain)
    }
    requestAnimationFrame(gameLoop)
}


gameLoop()