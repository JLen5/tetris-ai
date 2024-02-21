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

    isEqualTo(colour) {
        return this.r == colour.r && this.g == colour.g && this.b == colour.b
    }

    getOpposite() {
        return new RGB(255-this.r, 255-this.g, 255-this.b)
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
        'x': new RGB(0, 0, 0),
        'gridline': new RGB(128, 128, 128),
        'ghost': new RGB(0, 255, 120)
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
        'i': [
            [0, -1], [0, 0], [0, 1], [0, 2]
        ],
        'o': [
            [0, 0], [0, 1], [1, 0], [1, 1]
        ]
    }
    static pieces = ['j', 'l', 's', 'z', 't', 'i', 'o']

}

export class Config {
    static FPS = 60
    static keys = {
        'left': 'arrowleft',
        'right': 'arrowright',
        'rot-cw': 'arrowup',
        'rot-ccw': 'o',
        'soft-drop': 'arrowdown',
        'hard-drop': ' '
    }
}

export function addVectors(v1, v2) {
    return v1.map((e, idx) => e + v2[idx])
}

export function getColumn(arr, idx) {
    console.log(arr)
    console.log(idx)
    return arr.map(x => x[idx])
}