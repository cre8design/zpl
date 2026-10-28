import { Printer } from "./printer"

async function main() {
    const printerIp = process.argv[2]
    if (!printerIp) {
        console.error("Usage: main <printer-ip>")
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

    await printer.calibrate()
}

main().catch(error => {
    console.error(error)
})
