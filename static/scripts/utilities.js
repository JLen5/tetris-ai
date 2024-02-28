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
        'gridline': new RGB(40, 40, 40),
        'ghost': new RGB(80, 80, 80),
        'grey': new RGB(150, 150, 150)
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
            [-1, 0], [-1, 1], [0, 0], [0, 1]
        ]
    }
    static pieces = ['j', 'l', 's', 'z', 't', 'i', 'o']
    static wallKickData = {  // for CW ; if CCW, multiply each value by -1, decrease key by 1 (i.e. wallKickData[1] for CW --> -1 * wallKickData[0] for CCW)
        0 : [
            [0, -1], [-1, -1], [2, 0], [2, -1]
        ],
        1: [
            [0, 1], [1, 1], [-2, 0], [-2, 1]
        ], 
        2: [
            [0, 1], [-1, 1], [2, 0], [2, 1]
        ], 
        3: [
            [0, -1], [1, -1], [-2, 0], [-2, -1]
        ]
    }

    static wallKickData_IPiece = {  // for CW ; if CCW, multiply each value by -1, decrease key by 1 (i.e. wallKickData[1] for CW --> -1 * wallKickData[0] for CCW)
        0: [
            [0, -2], [0, -1], [1, -2], [-2, 1]
        ], 
        1: [
            [0, -1], [0, -2], [-2, -1], [1, 2]
        ], 
        2: [
            [0, 2], [0, -1], [-1, 2], [2, -1]
        ],
        3: [
            [0, 1], [0, -2], [2, 1], [-1, -2]
        ]
    }

    static testTSpinMap = [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [1, 0, 0, 1, 1, 0, 0, 0, 0, 0],
        [1, 0, 0, 0, 1, 1, 1, 0, 0, 0],
        [1, 1, 1, 0, 1, 1, 0, 0, 0, 0],
        [1, 1, 0, 0, 1, 1, 0, 1, 1, 1],
        [1, 1, 0, 0, 0, 1, 0, 0, 1, 1],
        [1, 1, 1, 0, 1, 1, 0, 0, 1, 1],
        [1, 1, 1, 0, 1, 1, 0, 0, 0, 1],
        [1, 1, 1, 0, 1, 1, 1, 1, 1, 1],
    ]
}

export class Config {
    // player config
    static keys = {
        'left': 'j',
        'right': 'l',
        'rot-cw': 'i',
        'rot-ccw': 'o',
        'soft-drop': 'k',
        'hard-drop': ' ',
        'hold': 'c'
    }
    static allowHold = true
    static repeatKeyDelay = 8
    static repeatKeySpeed = 2 // smaller = faster; = to # of frames btwn repeats
    // game config
    static FPS = 60
    static lookAheadCount = 5

}

export function addVectors(v1, v2) {
    return v1.map((e, idx) => e + v2[idx])
}

export function getColumn(arr, idx) {
    return arr.map(x => x[idx])
}