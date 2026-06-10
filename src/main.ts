import { Magick } from "./magick"
import { Pbm } from "./pbm"
import { Printer } from "./printer"
import { ZPL } from "./zpl"

async function main() {
    const printerIp = process.argv[2]
    const filePath = process.argv[3]
    if (!printerIp || !filePath) {
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
    const pdfPath = filePath
    const pbmPath = filePath.replace(/\.pdf$/i, ".pbm")
    const pbmBuffer = await new Magick()
        .density(printer.config.dpi)
        .input(pdfPath)
        .background("white")
        .flatten()
        .resize(printer.dotMediaWidth, printer.dotMediaWidth)
        .background("white")
        .gravity("northwest")
        .extend(printer.dotMediaWidth, printer.dotMediaHeight)
        .threshold(50)
        .type("bilevel")
        .output(pbmPath)
        .toBuffer()
    const pbmData = await new Pbm(pbmBuffer).parse()
    const zplBuffer = new ZPL()
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

main().catch(error => {
    console.error(error)
})
