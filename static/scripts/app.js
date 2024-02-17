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

const canvas = document.querySelector('#game')
const ctx = canvas.getContext('2d')

const grid = new Grid(10, 20, 24)
const game = new Game(grid)

canvas.width = grid.gridW*grid.tileW
canvas.height = grid.gridH*grid.tileW


// game loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    game.nextPiece.draw()
    grid.update()
    grid.draw(ctx)
    requestAnimationFrame(gameLoop)
}
gameLoop()
