import {
    RGB,
    Constants
} from './utilities.js'

import {
    Grid, 
    Tile,
    Piece,
    Game
} from './game_elements.js'

import InputHandler from './input_handler.js'


const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')

const grid = new Grid(10, 20, 24)
const game = new Game(grid)
const inputs = new InputHandler()

canvas.width = grid.gridW*grid.tileW
canvas.height = grid.gridH*grid.tileW

// game loop
function gameLoop() {
    if(game.tick()) {
        ctx.clearRect(0, 0, canvas.width, canvas.height) // clear canvas
        game.handleKeys(inputs)
        
        game.update()
        grid.update()
        grid.draw(ctx)
    }
    requestAnimationFrame(gameLoop)
}


gameLoop()