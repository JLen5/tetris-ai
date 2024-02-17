// import {Config} from './utilities'
export default class InputHandler {
    constructor () {
        this.keys = {}

        addEventListener('keydown', (e) => {
            let k = e.key.toLowerCase()
            // if(!this.keys.includes(k)) {
            if(!(k in this.keys)){
                this.keys[k] = 0
            }
            console.log(this.keys)
        })

        addEventListener('keyup', (e) => {
            // this.keys.splice(this.keys.indexOf(e.key), 1)
            delete this.keys[e.key.toLowerCase()]
        })
    }
    tick() {
        Object.keys(this.keys).forEach(k => {
            this.keys[k] -= 1
        })
    }
}