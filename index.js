
const fs = require("fs");
const {PDFDocument, rgb} = require("pdf-lib");
const fontkit= require("@pdf-lib/fontkit");
const dotenv = require('dotenv');
dotenv.config();

const logo = fs.readFileSync("./logo_wc.png");
const header = "Raport z przepracowanego czasu pracy";

const state = {
    currentY: 0,
    paragraphSize: 20,
}


async function generate() {

    const pdfDoc = await PDFDocument.create();
    await pdfDoc.registerFontkit(fontkit);

    const robotoFontBytes = await fs.readFileSync("./Roboto-Light.ttf");
    const robotoFont = await pdfDoc.embedFont(robotoFontBytes);
    const fontSize = 22;

    const page = pdfDoc.addPage();
    const {width, height} = page.getSize();


    const headerStyles = {
        x: width / 2 - robotoFont.widthOfTextAtSize(header, fontSize) / 2,
        y: height - 200,
        size: fontSize,
        font: robotoFont,
        color: rgb(0, 0, 0),
    };

    const paragraphStyles = {
        ...headerStyles,
        size: 12,
    };


    const pngImage = await pdfDoc.embedPng(logo);
    const pngDims = pngImage.scale(0.5);

    page.drawImage(pngImage, {
       x: width / 2 - pngDims.width / 2,
       y: height - 150,
       width: pngDims.width,
       height: pngDims.height
    });

    setState(state, "currentY", height - 150 + state.paragraphSize)

    //header
    addText(page,header,headerStyles);

    setState(state, "currentY", state.currentY - state.paragraphSize)


    //three data paragraphs
    const today = new Date();
    addText(
        page,
        "Dotyczy: " + getDocDate(),
        {
            ...paragraphStyles,
            y: state.currentY,
        }
        )

    addText(page, "Imię i nazwisko: " + process.env.WHO , {
        ...paragraphStyles,
        y:state.currentY,
    })

    addText(page, "Adres: " + process.env.ADDRESS,
        {
            ...paragraphStyles,
            y:state.currentY,
        })

    setState(state,"currentY", state.currentY - state.paragraphSize)


    //main content
    addText(page, "W bieżącym miesiącu na realizację zadań dla WebCrafters Sp. z o.o.", {
        ...paragraphStyles,
        y:state.currentY
    })
    addText(page, "poświęciłem "+ process.env.HOURS +" roboczo-godzin.", {
        ...paragraphStyles,
        y:state.currentY
    })

    setState(state,"currentY", state.currentY - state.paragraphSize)

    //signature
    addText(page, "Michał Sarzała", {
        ...paragraphStyles,
        y:state.currentY,
        x: width - robotoFont.widthOfTextAtSize(process.env.WHO, paragraphStyles.size) * 2 - 35
    })

    const pdfBytes = await pdfDoc.save();

    await fs.writeFile("./ewidencja-michal-sarzala-"+ getDocDate("-") +".pdf", pdfBytes, function (err) {
        if (err) console.log(err)
    });


}

function addText(page, text, styles) {
    setState(state,"currentY", styles.y - state.paragraphSize);
    return page.drawText(text, styles);
}

function setState(state, key, value) {
    return state[key] = value;
}

function getDocDate(sign = "/") {
    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();

    return month + sign + year;
}

generate();
