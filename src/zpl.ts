export class ZPL {
    private accumulator: string[] = []

    public start() {
        return this.command("^XA")
    }

    public origin(x: number, y: number) {
        return this.command(`^FO${x},${y}`)
    }

    public graphic(data: string, totalBytes: number, bytesPerRow: number) {
        return this.command(
            `^GFA,${totalBytes},${totalBytes},${bytesPerRow},${data}`
        )
    }

    public seperate() {
        return this.command("^FS")
    }

    public end() {
        return this.command("^XZ")
    }

    public configuration() {
        return this.command("~WC")
    }

    public calibrate() {
        return this.command("~JC")
    }

    public command(...cmd: string[]) {
        this.accumulator.push(...cmd)
        return this
    }

    public assemble() {
        return Buffer.from(this.accumulator.join(""), "ascii")
    }

    public clear() {
        this.accumulator = []
        return this
    }
}
