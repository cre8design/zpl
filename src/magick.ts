import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { readFile, unlink } from "node:fs/promises"

export class ImageMagickCmdBuilder {
    private _input: string = ""

    private _output: string = ""

    private accumulator: string[] = []

    public input(input: string) {
        this._input = input
        return this.command(input)
    }

    public output(output: string) {
        this._output = output
        return this.command(output)
    }

    public density(dpi: number) {
        return this.command("-density", dpi.toString())
    }

    public background(color: string) {
        return this.command("-background", color)
    }

    public flatten() {
        return this.command("-flatten")
    }

    public resize(width: number, height: number) {
        return this.command("-resize", `${width}x${height}`)
    }

    public extend(width: number, height: number) {
        return this.command("-extent", `${width}x${height}`)
    }

    public gravity(gravity: string) {
        return this.command("-gravity", gravity)
    }

    public threshold(percent: number) {
        return this.command("-threshold", `${percent}%`)
    }

    public type(type: "bilevel" | "grayscale" | "truecolor") {
        return this.command("-type", type)
    }

    public command(...cmd: string[]) {
        this.accumulator.push(...cmd)
        return this
    }

    public clear() {
        this.accumulator = []
    }

    public async exec() {
        if (!this._input) {
            throw new Error("Input file is not specified")
        }
        if (!this._output) {
            throw new Error("Output file is not specified")
        }
        await promisify(execFile)("magick", this.accumulator)
    }

    public async toBuffers(): Promise<Buffer[]> {
        await this.exec()
        const buffers: Buffer[] = []

        let page = 0
        while (true) {
            const file = this._output.replace(/%d/g, page.toString())
            try {
                const buffer = await readFile(file)
                buffers.push(buffer)
                await unlink(file)
                page++
            } catch (error) {
                if ((error as NodeJS.ErrnoException).code === "ENOENT") {
                    break
                }
                throw error
            }
        }

        return buffers
    }
}
