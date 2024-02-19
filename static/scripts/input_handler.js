export default class InputHandler {
    constructor () {
        this.keys = {}

        addEventListener('keydown', (e) => {
            let k = e.key.toLowerCase()
            if (this.isPressed(k)) return
            this.keys[k] = 0
        })

        addEventListener('keyup', (e) => {
            delete this.keys[e.key.toLowerCase()]
        })
    }
    /**
     * Action(s) for one frame
     */
    tick() {
        Object.keys(this.keys).filter( // filter to get only keys with cooldowns
            k => {
                this.keys[k] > 0
            }
        ).forEach(k => {  // subtract 1 from cooldown counter
            this.keys[k] -= 1
        })
    }

    /**
     * Check if key is being pressed
     * @param {String} k - keyboard key
     * @returns {boolean} is `k` being pressed?
     */
    isPressed(k) {
        return k in this.keys
    }

    /**
     * Check if key being pressed has finished cooldown
     * @param {String} k - keyboard key
     * @returns {boolean} is `k`'s cooldown done (==0)?
     */
    isActive(k) {
        return this.keys[k] == 0
    }

    /**
     * Set cooldown for keypress
     * - amount of time before holding down key repeats the action
     * @param {String} k - keyboard key
     * @param {number} ticks 
     */
    setHoldCooldown(k, ticks) {
        this.keys[k] = ticks
    }

    /**
     * Selected key will not do anything until user releases and re-presses button
     * - i.e. holding down this key will not result in any further actions
     * @param {String} k - keyboard key
     */
    disableHold(k) {
        this.keys[k] = -1
    }
}