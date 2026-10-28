const PBM_COMMENT_TOKEN = 0x23
const PBM_SPACE_TOKEN = 0x20
const PBM_TAB_TOKEN = 0x09
const PBM_LINE_FEED_TOKEN = 0x0a
const PBM_CARRIAGE_RETURN_TOKEN = 0x0d

export class PbmParser {
    private pos: number = 0

    constructor(private readonly buf: Buffer) {}

    private isWhitespace(byte: number): boolean {
        return [
            PBM_SPACE_TOKEN,
            PBM_TAB_TOKEN,
            PBM_LINE_FEED_TOKEN,
            PBM_CARRIAGE_RETURN_TOKEN
        ].includes(byte)
    }

    private skipWhitespaceAndComments(): void {
        while (this.pos < this.buf.length) {
            const byte = this.buf[this.pos]
            if (byte === PBM_COMMENT_TOKEN) {
                while (
                    this.pos < this.buf.length &&
                    this.buf[this.pos] !== PBM_LINE_FEED_TOKEN
                ) {
                    this.pos++
                }
            } else if (this.isWhitespace(byte)) {
                this.pos++
            } else {
                break
            }
        }
    }

    private next(): string {
        this.skipWhitespaceAndComments()
        if (this.pos >= this.buf.length) {
            throw new Error("Unexpected end of PBM file")
        }
        const start = this.pos
        while (
            this.pos < this.buf.length &&
            !this.isWhitespace(this.buf[this.pos])
        ) {
            this.pos++
        }
        const end = this.pos
        return this.buf.toString("ascii", start, end)
    }

    private consumeWhitespace(): void {
        if (
            this.pos >= this.buf.length ||
            !this.isWhitespace(this.buf[this.pos])
        ) {
            throw new Error(
                "Expected a whitespace separator before PBM raster data"
            )
        }
        this.pos++
    }

    public async parse(): Promise<{
        width: number
        height: number
        bytesPerRow: number
        totalBytes: number
        bits: Buffer
    }> {
        this.pos = 0

        if (this.next() !== "P4") {
            throw new Error("Not a binary (P4) PBM")
        }

        const width = parseInt(this.next())
        const height = parseInt(this.next())
        this.consumeWhitespace()

        const bytesPerRow = Math.ceil(width / 8)
        const total = bytesPerRow * height
        const bits = this.buf.subarray(this.pos, this.pos + total)
        if (bits.length !== total) {
            throw new Error(
                `Expected ${total} bytes of bitmap data, got ${bits.length}`
            )
        }

        return {
            width,
            height,
            bytesPerRow,
            totalBytes: total,
            bits
        }
    }
}
