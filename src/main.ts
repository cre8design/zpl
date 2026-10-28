import { ImageMagickCmdBuilder } from "./magick"
import { PbmParser } from "./pbm"
import { Printer } from "./printer"
import { ZPLBuilder } from "./zpl"

async function main() {
    const printerIp = process.argv[2]
    const pdfPath = process.argv[3]
    if (!printerIp || !pdfPath) {
        console.error("Usage: main <printer-ip> <file-path>")
        process.exit(1)
    }

    const printer = new Printer({
        host: printerIp,
        port: 9100,
        dpi: 300,
        media: {
            width: 95,
            height: 145
        }
    })

    const pbmPathPattern = pdfPath.replace(/\.pdf$/i, "-%d.pbm")
    const pbmBuffers = await new ImageMagickCmdBuilder()
        .density(printer.config.dpi)
        .input(pdfPath)
        .background("white")
        .command("-alpha", "remove")
        .resize(printer.dotMediaWidth, printer.dotMediaWidth)
        .background("white")
        .gravity("northwest")
        .extend(printer.dotMediaWidth, printer.dotMediaHeight)
        .threshold(50)
        .type("bilevel")
        .output(pbmPathPattern)
        .toBuffers()

    for (const pbmBuffer of pbmBuffers) {
        const pbmData = await new PbmParser(pbmBuffer).parse()
        const zplBuffer = new ZPLBuilder()
            .start()
            .origin(0, 0)
            .graphic(
                pbmData.bits.toString("hex").toUpperCase(),
                pbmData.totalBytes,
                pbmData.bytesPerRow
            )
            .seperate()
            .end()
            .assemble()
        await printer.send(zplBuffer)
    }
}

main().catch(error => {
    console.error(error)
})
