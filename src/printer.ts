import { createConnection } from "node:net"
import { ZPL } from "./zpl"

const MM_TO_INCH = 25.4

type PrinterConfig = {
    host: string
    port: number
    dpi: 203 | 300
    media: {
        width: number
        height: number
    }
}

export class Printer {
    constructor(public config: PrinterConfig) {}

    get dotMediaWidth() {
        return this.dots(this.config.media.width)
    }

    get dotMediaHeight() {
        return this.dots(this.config.media.height)
    }

    private dots(mm: number) {
        return Math.round((mm / MM_TO_INCH) * this.config.dpi)
    }

    public async configurion() {
        const zplBuffer = new ZPL().configuration().assemble()
        return this.send(zplBuffer)
    }

    public async calibrate() {
        const zplBuffer = new ZPL().calibrate().assemble()
        return this.send(zplBuffer)
    }

    public async send(
        data: Buffer,
        timeoutMs: number = 30000
    ): Promise<Printer> {
        const { host, port } = this.config
        return new Promise((resolve, reject) => {
            const socket = createConnection({ host, port })
            socket.setTimeout(timeoutMs)
            socket.once("connect", () => socket.end(data))
            socket.once("error", reject)
            socket.once("timeout", () => {
                socket.destroy()
                reject(new Error(`Timeout ${host}:${port}`))
            })
            socket.once("close", () => resolve(this))
        })
    }
}
