export class RGB {
    constructor (r, g, b) {
        this.r = r
        this.g = g
        this.b = b
    }

    get() {
        return [this.r, this.g, this.b]
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

        return '#' + hex
    }
}

export class Constants {
    static colours = {
        'j': new RGB(0, 0, 255),
        'l': new RGB(255, 128, 0),
        's': new RGB(0, 255, 0),
        'z': new RGB(255, 0, 0),
        't': new RGB(128, 0, 128),
        'i': new RGB(0, 255, 255),
        'o': new RGB(255, 255, 0),
        'x': new RGB(0, 0, 0)
    }
    static shapes = {
        'j': [
            [-1, -1], [0, -1], [0, 0], [0, 1]
        ],
        'l': [
            [0, -1], [0, 0], [0, 1], [-1, 1]
        ],
        's': [
            [-1, 0], [-1, 1], [0, -1], [0, 0]
        ],
        'z': [
            [-1, -1], [-1, 0], [0, 0], [0, 1]
        ] ,
        't': [
            [-1, 0], [0, -1], [0, 0], [0, 1]
        ],
        'i': [[0, -1], [0, 0], [0, 1], [0, 2]],
        'o': [[0, 0], [0, 1], [1, 0], [1, 1]]
    }
    static pieces = ['j', 'l', 's', 'z', 't', 'i', 'o']

}

export class Config {
    static FPS = 60
    static keys = {
        'left': 'arrowleft',
        'right': 'arrowright'
    }
}

export function addVectors(v1, v2) {
    return v1.map((e, idx) => e + v2[idx])
}

export function getColumn(arr, idx) {
    return arr.map(x => x[idx])
}