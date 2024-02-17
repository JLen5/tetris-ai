class RGB {
    constructor (r, g, b) {
        this.r = r
        this.g = g
        this.b = b
    }
    
    toHex() {
        let hex = ''
        if (this.r.toString(16).length == 1) {
            hex += '0' + this.r.toString(16)
        } else {
            hex += this.r.toString(16)
        }

        if (this.g.toString(16).length == 1) {
            hex += '0' + this.g.toString(16)
        } else {
            hex += this.g.toString(16)
        }

        if (this.b.toString(16).length == 1) {
            hex += '0' + this.b.toString(16)
        } else {
            hex += this.b.toString(16)
        }

        return hex
    }
}
