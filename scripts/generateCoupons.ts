#!/usr/bin/env tsx
/**
 * Script to generate LA Youth Count coupon PDFs (English and Spanish versions).
 * Creates a two-sided PDF with English on page 1 and Spanish on page 2.
 *
 * Usage:
 * 1. Make sure you are in the `server` directory.
 * 2. Run: npm run generate-coupons -- [how-many]
 *    Example: npm run generate-coupons -- 10  (generates 10 two-sided coupons)
 *    Example: npm run generate-coupons      (generates 1 two-sided coupon)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createRequire } from 'module';

// Create require from server directory to access server's node_modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverRequire = createRequire(path.join(__dirname, '../server/package.json'));

// Dynamically require dependencies from the server's context
const PDFDocument = serverRequire('pdfkit');

// ===== PDF Generation Helper Functions =====

function createOutputDirectory(): string {
    const outputDir = path.join(__dirname, 'coupons');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    return outputDir;
}

function generateTimestampFilename(outputDir: string, count: number): string {
    const now = new Date();
    const timestamp = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
        String(now.getHours()).padStart(2, '0'),
        String(now.getMinutes()).padStart(2, '0'),
        String(now.getSeconds()).padStart(2, '0')
    ].join('');
    const filename = `la-youth-count-coupons-${count}-${timestamp}.pdf`;
    return path.join(outputDir, filename);
}

function addEnglishPage(doc: any): void {
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 30;
    const contentWidth = pageWidth - margin * 2;

    let currentY = margin;

    // Header with title and QR code
    const qrSize = 120;
    const qrX = pageWidth - margin - qrSize;
    const titleWidth = qrX - margin - 10;

    // Title
    doc.fontSize(21)
        .font('Helvetica-Bold')
        .fillColor('#1a1a1a')
        .text('LOS ANGELES YOUTH COUNT', margin, currentY, {
            width: titleWidth,
            align: 'left'
        });

    currentY += 40;

    doc.fontSize(15)
        .font('Helvetica-Bold')
        .text('UNSHELTERED YOUTH COUNT COUPON', margin, currentY, {
            width: titleWidth,
            align: 'left'
        });

    // QR Code box
    doc.lineWidth(2)
        .rect(qrX, margin, qrSize, qrSize)
        .stroke();

    doc.fontSize(9.25)
        .font('Helvetica-Oblique')
        .text('QR CODE', qrX, margin + qrSize / 2 - 6, {
            width: qrSize,
            align: 'center'
        });

    currentY = margin + qrSize + 20;

    // Intro paragraph
    const introText = 'Young people under the age of 25 who are sleeping outside or in RVs, cars, or other locations not meant for human habitation are needed for a survey from January 5th through 31st. ';
    const introBoldText = 'PLEASE BRING THIS COUPON TO A LOCATION BELOW.';
    
    const fullIntroText = introText + introBoldText;
    const introHeight = doc.heightOfString(fullIntroText, {
        width: contentWidth,
        align: 'justify'
    });
    
    doc.fontSize(11.5)
        .font('Helvetica')
        .text(introText, margin, currentY, {
            width: contentWidth,
            align: 'justify',
            continued: true
        })
        .font('Helvetica-Bold')
        .text(introBoldText);

    currentY += introHeight + 35;

    // Incentive
    const incentiveText = '$20 Visa cards will be provided to those who complete the survey!';
    const incentiveHeight = doc.heightOfString(incentiveText, {
        width: contentWidth
    });
    
    doc.fontSize(11.5)
        .font('Helvetica-Bold')
        .text(incentiveText, margin, currentY, {
            width: contentWidth,
            align: 'left'
        });

    currentY += incentiveHeight + 20;

    // Hub sites header box
    const hubBoxY = currentY;
    const hubBoxHeight = 75;
    
    doc.rect(margin, hubBoxY, contentWidth, hubBoxHeight)
        .fillAndStroke('#f9f9f9', '#1a1a1a');

    doc.fillColor('#1a1a1a')
        .fontSize(14.5)
        .font('Helvetica-Bold')
        .text('HOLLYWOOD AND SOUTH LA HUB SITES (SPA 4 and 6)', margin + 15, hubBoxY + 12, {
            width: contentWidth - 30,
            align: 'center'
        });

    doc.fontSize(10.75)
        .font('Helvetica')
        .text('View all Hub Sites in LA County at youthcount.org/map', margin + 15, hubBoxY + 35, {
            width: contentWidth - 30,
            align: 'center'
        });

    doc.fontSize(9.25)
        .font('Helvetica')
        .text('TIMES LISTED BELOW ARE DESIGNATED SURVEYING HOURS. AGENCIES OPEN OUTSIDE OF THESE HOURS.', margin + 15, hubBoxY + 55, {
            width: contentWidth - 30,
            align: 'center'
        });

    currentY = hubBoxY + hubBoxHeight;

    // Locations table
    const tableY = currentY;
    const tableHeight = 230;
    
    // Draw outer border (without top)
    doc.lineWidth(2)
        .rect(margin, tableY, contentWidth, tableHeight)
        .stroke();

    // Column configuration
    const colPadding = 10;
    const colGap = 10;
    const col1X = margin + colPadding;
    const col1Width = (contentWidth - colGap - colPadding * 2) / 2;
    const col2X = margin + col1Width + colGap + colPadding;
    const col2Width = col1Width;

    // Left column - 3 locations
    let leftY = tableY + 16;

    // Location 1: East Hollywood
    doc.fontSize(11.5).font('Helvetica-Bold').fillColor('#1a1a1a');
    let textHeight = doc.heightOfString('EAST HOLLYWOOD YP2F HQ', { width: col1Width - colPadding });
    doc.text('EAST HOLLYWOOD YP2F HQ', col1X, leftY, {
        width: col1Width - colPadding,
        align: 'left'
    });
    leftY += textHeight + 5;

    doc.fontSize(11.5).font('Helvetica');
    textHeight = doc.heightOfString('4308 Burns Ave LA CA 90029', { width: col1Width - colPadding });
    doc.text('4308 Burns Ave LA CA 90029', col1X, leftY, {
        width: col1Width - colPadding,
        align: 'left'
    });
    leftY += textHeight + 5;

    textHeight = doc.heightOfString('SURVEYING TUES and THURS 5:00 PM - 8:00 PM', { width: col1Width - colPadding });
    doc.text('SURVEYING TUES and THURS 5:00 PM - 8:00 PM', col1X, leftY, {
        width: col1Width - colPadding,
        align: 'left'
    });
    leftY += textHeight + 15;

    // Location 2: My Friends Place
    doc.fontSize(11.5).font('Helvetica-Bold');
    textHeight = doc.heightOfString('HOLLYWOOD: MY FRIENDS PLACE', { width: col1Width - colPadding });
    doc.text('HOLLYWOOD: MY FRIENDS PLACE', col1X, leftY, {
        width: col1Width - colPadding,
        align: 'left'
    });
    leftY += textHeight + 5;

    doc.fontSize(11.5).font('Helvetica');
    textHeight = doc.heightOfString('5850 Hollywood Blvd, LA CA 90028', { width: col1Width - colPadding });
    doc.text('5850 Hollywood Blvd, LA CA 90028', col1X, leftY, {
        width: col1Width - colPadding,
        align: 'left'
    });
    leftY += textHeight + 5;

    textHeight = doc.heightOfString('SURVEYING TUES, THURS, FRI 9:30 AM - 3:30 PM', { width: col1Width - colPadding });
    doc.text('SURVEYING TUES, THURS, FRI 9:30 AM - 3:30 PM', col1X, leftY, {
        width: col1Width - colPadding,
        align: 'left'
    });
    leftY += textHeight + 15;

    // Location 3: Ruth's Place
    doc.fontSize(11.5).font('Helvetica-Bold');
    textHeight = doc.heightOfString('SOUTH LA: RUTH\'S PLACE', { width: col1Width - colPadding });
    doc.text('SOUTH LA: RUTH\'S PLACE', col1X, leftY, {
        width: col1Width - colPadding,
        align: 'left'
    });
    leftY += textHeight + 5;

    doc.fontSize(11.5).font('Helvetica');
    textHeight = doc.heightOfString('3101 S. Grand Los Angeles 90007', { width: col1Width - colPadding });
    doc.text('3101 S. Grand Los Angeles 90007', col1X, leftY, {
        width: col1Width - colPadding,
        align: 'left'
    });
    leftY += textHeight + 5;

    textHeight = doc.heightOfString('SURVEYING TUES - FRI 10:00 AM - 4:00 PM', { width: col1Width - colPadding });
    doc.text('SURVEYING TUES - FRI 10:00 AM - 4:00 PM', col1X, leftY, {
        width: col1Width - colPadding,
        align: 'left'
    });

    // Right column - 2 locations
    let rightY = tableY + 16;

    // Location 4: LA LGBT CENTER
    doc.fontSize(11.5)
        .font('Helvetica-Bold')
        .text('HOLLYWOOD: LA LGBT CENTER', col2X, rightY, {
            width: col2Width - colPadding,
            align: 'left'
        });
    rightY += 17;

    doc.fontSize(11.5)
        .font('Helvetica')
        .text('1118 N. McCadden Pl. LA, CA 90038', col2X, rightY, {
            width: col2Width - colPadding,
            align: 'left'
        });
    rightY += 15;

    doc.fontSize(11.5)
        .text('SURVEYING: Mon - Fri 10:00AM - 6:00PM (Closed Mon Jan 19th), SAT, SUN 9:00AM - 1:00PM', col2X, rightY, {
            width: col2Width - colPadding,
            align: 'left'
        });
    rightY += 55;

    // Location 5: Watts Labor
    doc.fontSize(11.5).font('Helvetica-Bold');
    textHeight = doc.heightOfString('WATTS/COMPTON: WATTS LABOR ACTION COMMUNITY', { width: col2Width - colPadding });
    doc.text('WATTS/COMPTON: WATTS LABOR ACTION COMMUNITY', col2X, rightY, {
        width: col2Width - colPadding,
        align: 'left'
    });
    rightY += textHeight + 5;

    doc.fontSize(11.5).font('Helvetica');
    textHeight = doc.heightOfString('10950 S Central Ave, Los Angeles, CA 90059', { width: col2Width - colPadding });
    doc.text('10950 S Central Ave, Los Angeles, CA 90059', col2X, rightY, {
        width: col2Width - colPadding,
        align: 'left'
    });
    rightY += textHeight + 5;

    textHeight = doc.heightOfString('SURVEYING TUES- FRI 9:00 AM - 3:30 PM', { width: col2Width - colPadding });
    doc.text('SURVEYING TUES- FRI 9:00 AM - 3:30 PM', col2X, rightY, {
        width: col2Width - colPadding,
        align: 'left'
    });

    currentY = tableY + tableHeight + 15;

    // Uber section
    const uberBoxY = currentY;
    const uberBoxHeight = 92;
    
    doc.rect(margin, uberBoxY, contentWidth, uberBoxHeight)
        .fillAndStroke('#f9f9f9', '#000000');
    
    // Add left border accent
    doc.lineWidth(4)
        .moveTo(margin, uberBoxY)
        .lineTo(margin, uberBoxY + uberBoxHeight)
        .stroke('#000000');

    doc.fillColor('#1a1a1a')
        .fontSize(11.5)
        .font('Helvetica-Bold')
        .text('$10 off your Uber rides to and from a hub site with this voucher', margin + 12, uberBoxY + 12, {
            width: contentWidth - 24,
            align: 'left'
        });

    let uberY = uberBoxY + 32;
    
    const voucherLineText = '• UBER VOUCHER: RKRBSSFQJFS https://r.uber.com/rkrbssfqjfs';
    doc.fontSize(11.5).font('Helvetica');
    const voucherHeight = doc.heightOfString(voucherLineText, { width: contentWidth - 24 });
    
    doc.text('• UBER VOUCHER: ', margin + 12, uberY, {
        width: contentWidth - 24,
        align: 'left',
        continued: true
    })
    .font('Courier-Bold')
    .text('RKRBSSFQJFS ', { continued: true })
    .font('Helvetica-Bold')
    .fillColor('#0066cc')
    .text('https://r.uber.com/rkrbssfqjfs');

    uberY += voucherHeight + 8;

    const uberDetailsText = '• Receive $10 off of 2 Uber trips to and from any designated Hub sites during surveying times using the voucher code. Visit youthcount.org/uber for more details.';
    doc.fontSize(11.5).font('Helvetica').fillColor('#1a1a1a');
    const detailsHeight = doc.heightOfString(uberDetailsText, { width: contentWidth - 24 });
    
    doc.text(uberDetailsText, margin + 12, uberY, {
        width: contentWidth - 24,
        align: 'left'
    });

    currentY = uberBoxY + uberBoxHeight + 12;

    // Footer
    doc.moveTo(margin, currentY)
        .lineTo(pageWidth - margin, currentY)
        .lineWidth(2)
        .stroke('#dddddd');

    currentY += 10;

    doc.fontSize(11.5)
        .font('Helvetica')
        .fillColor('#1a1a1a')
        .text('Data will be used to report to Housing and Urban Development (HUD)', margin, currentY, {
            width: contentWidth,
            align: 'left'
        });

    currentY += 18;

    doc.fontSize(11.5)
        .text('More info at youthcount.org', margin, currentY, {
            width: contentWidth,
            align: 'left'
        });
}

function addSpanishPage(doc: any): void {
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 30;
    const contentWidth = pageWidth - margin * 2;

    let currentY = margin;

    // Header with title and QR code
    const qrSize = 120;
    const qrX = pageWidth - margin - qrSize;
    const titleWidth = qrX - margin - 10;

    // Title
    doc.fontSize(21)
        .font('Helvetica-Bold')
        .fillColor('#1a1a1a')
        .text('LOS ANGELES YOUTH COUNT', margin, currentY, {
            width: titleWidth,
            align: 'left'
        });

    currentY += 40;

    doc.fontSize(15)
        .font('Helvetica-Bold')
        .text('CUPÓN DEL CONTEO DE JÓVENES SIN HOGAR', margin, currentY, {
            width: titleWidth,
            align: 'left'
        });

    // QR Code box
    doc.lineWidth(2)
        .rect(qrX, margin, qrSize, qrSize)
        .stroke();

    doc.fontSize(9.25)
        .font('Helvetica-Oblique')
        .text('CÓDIGO QR', qrX, margin + qrSize / 2 - 6, {
            width: qrSize,
            align: 'center'
        });

    currentY = margin + qrSize + 20;

    // Intro paragraph
    const introText = 'Se necesitan jóvenes menores de 25 años que estén durmiendo afuera o en vehículos recreativos, autos u otros lugares no destinados para la habitación humana para una encuesta del 5 al 31 de enero. ';
    const introBoldText = '¡LLEVE ESTE CUPÓN A UNO DE LOS LUGARES INDICADOS ABAJO!';
    
    const fullIntroText = introText + introBoldText;
    const introHeight = doc.heightOfString(fullIntroText, {
        width: contentWidth,
        align: 'justify'
    });
    
    doc.fontSize(11.5)
        .font('Helvetica')
        .text(introText, margin, currentY, {
            width: contentWidth,
            align: 'justify',
            continued: true
        })
        .font('Helvetica-Bold')
        .text(introBoldText);

    currentY += introHeight + 20;

    // Incentive
    const incentiveText = '¡TARJETA VISA DE $20 después de completar una encuesta!';
    const incentiveHeight = doc.heightOfString(incentiveText, {
        width: contentWidth
    });
    
    doc.fontSize(11.5)
        .font('Helvetica-Bold')
        .text(incentiveText, margin, currentY, {
            width: contentWidth,
            align: 'left'
        });

    currentY += incentiveHeight + 20;

    // Hub sites header box
    const hubBoxY = currentY;
    const hubBoxHeight = 75;
    
    doc.rect(margin, hubBoxY, contentWidth, hubBoxHeight)
        .fillAndStroke('#f9f9f9', '#1a1a1a');

    doc.fillColor('#1a1a1a')
        .fontSize(14.5)
        .font('Helvetica-Bold')
        .text('CENTROS (HUBS) DE HOLLYWOOD Y SOUTH LA (SPA 4 y 6)', margin + 15, hubBoxY + 12, {
            width: contentWidth - 30,
            align: 'center'
        });

    doc.fontSize(10.75)
        .font('Helvetica')
        .text('Vea los Centros (Hubs) en el Condado de Los Ángeles en youthcount.org/map', margin + 15, hubBoxY + 35, {
            width: contentWidth - 30,
            align: 'center'
        });

    doc.fontSize(9.25)
        .font('Helvetica')
        .text('LOS HORARIOS QUE SE INDICAN SON LAS HORAS DESIGNADAS PARA LAS ENCUESTAS. LAS AGENCIAS ESTÁN ABIERTAS FUERA DE ESTOS HORARIOS.', margin + 15, hubBoxY + 55, {
            width: contentWidth - 30,
            align: 'center'
        });

    currentY = hubBoxY + hubBoxHeight;

    // Locations table
    const tableY = currentY;
    const tableHeight = 230;
    
    // Draw outer border (without top)
    doc.lineWidth(2)
        .rect(margin, tableY, contentWidth, tableHeight)
        .stroke();

    // Column configuration
    const colPadding = 10;
    const colGap = 10;
    const col1X = margin + colPadding;
    const col1Width = (contentWidth - colGap - colPadding * 2) / 2;
    const col2X = margin + col1Width + colGap + colPadding;
    const col2Width = col1Width;

    // Left column - 3 locations
    let leftY = tableY + 16;

    // Location 1: East Hollywood
    doc.fontSize(11.5).font('Helvetica-Bold').fillColor('#1a1a1a');
    let textHeight = doc.heightOfString('EAST HOLLYWOOD YP2F HQ', { width: col1Width - colPadding });
    doc.text('EAST HOLLYWOOD YP2F HQ', col1X, leftY, {
        width: col1Width - colPadding,
        align: 'left'
    });
    leftY += textHeight + 5;

    doc.fontSize(11.5).font('Helvetica');
    textHeight = doc.heightOfString('4308 Burns Ave LA CA 90029', { width: col1Width - colPadding });
    doc.text('4308 Burns Ave LA CA 90029', col1X, leftY, {
        width: col1Width - colPadding,
        align: 'left'
    });
    leftY += textHeight + 5;

    textHeight = doc.heightOfString('ENCUESTAS: Mar y Jue 5:00 PM - 8:00 PM', { width: col1Width - colPadding });
    doc.text('ENCUESTAS: Mar y Jue 5:00 PM - 8:00 PM', col1X, leftY, {
        width: col1Width - colPadding,
        align: 'left'
    });
    leftY += textHeight + 15;

    // Location 2: My Friends Place
    doc.fontSize(11.5).font('Helvetica-Bold');
    textHeight = doc.heightOfString('HOLLYWOOD: MY FRIENDS PLACE', { width: col1Width - colPadding });
    doc.text('HOLLYWOOD: MY FRIENDS PLACE', col1X, leftY, {
        width: col1Width - colPadding,
        align: 'left'
    });
    leftY += textHeight + 5;

    doc.fontSize(11.5).font('Helvetica');
    textHeight = doc.heightOfString('5850 Hollywood Blvd, LA CA 90028', { width: col1Width - colPadding });
    doc.text('5850 Hollywood Blvd, LA CA 90028', col1X, leftY, {
        width: col1Width - colPadding,
        align: 'left'
    });
    leftY += textHeight + 5;

    textHeight = doc.heightOfString('ENCUESTAS: Mar, Jue, Vie 9:30 AM - 3:30 PM', { width: col1Width - colPadding });
    doc.text('ENCUESTAS: Mar, Jue, Vie 9:30 AM - 3:30 PM', col1X, leftY, {
        width: col1Width - colPadding,
        align: 'left'
    });
    leftY += textHeight + 15;

    // Location 3: Ruth's Place
    doc.fontSize(11.5).font('Helvetica-Bold');
    textHeight = doc.heightOfString('SOUTH LA: RUTH\'S PLACE', { width: col1Width - colPadding });
    doc.text('SOUTH LA: RUTH\'S PLACE', col1X, leftY, {
        width: col1Width - colPadding,
        align: 'left'
    });
    leftY += textHeight + 5;

    doc.fontSize(11.5).font('Helvetica');
    textHeight = doc.heightOfString('3101 S. Grand Los Angeles 90007', { width: col1Width - colPadding });
    doc.text('3101 S. Grand Los Angeles 90007', col1X, leftY, {
        width: col1Width - colPadding,
        align: 'left'
    });
    leftY += textHeight + 5;

    textHeight = doc.heightOfString('ENCUESTAS: Mar-Vie 10:00 AM - 4:00 PM', { width: col1Width - colPadding });
    doc.text('ENCUESTAS: Mar-Vie 10:00 AM - 4:00 PM', col1X, leftY, {
        width: col1Width - colPadding,
        align: 'left'
    });

    // Right column - 2 locations
    let rightY = tableY + 16;

    // Location 4: LA LGBT Center
    doc.fontSize(11.5).font('Helvetica-Bold');
    textHeight = doc.heightOfString('HOLLYWOOD: LA LGBT CENTER', { width: col2Width - colPadding });
    doc.text('HOLLYWOOD: LA LGBT CENTER', col2X, rightY, {
        width: col2Width - colPadding,
        align: 'left'
    });
    rightY += textHeight + 5;

    doc.fontSize(11.5).font('Helvetica');
    textHeight = doc.heightOfString('1118 N. McCadden Pl. LA, CA 90038', { width: col2Width - colPadding });
    doc.text('1118 N. McCadden Pl. LA, CA 90038', col2X, rightY, {
        width: col2Width - colPadding,
        align: 'left'
    });
    rightY += textHeight + 5;

    const lgbtHoursText = 'ENCUESTAS: Lun-Vie 10:00 AM - 6:00 PM (Cerrado el lunes 19 de enero); Sáb, Dom 9:00 AM - 1:00 PM';
    textHeight = doc.heightOfString(lgbtHoursText, { width: col2Width - colPadding });
    doc.text(lgbtHoursText, col2X, rightY, {
        width: col2Width - colPadding,
        align: 'left'
    });
    rightY += textHeight + 15;

    // Location 5: Watts Labor
    doc.fontSize(11.5).font('Helvetica-Bold');
    textHeight = doc.heightOfString('WATTS/COMPTON: WATTS LABOR ACTION COMMUNITY', { width: col2Width - colPadding });
    doc.text('WATTS/COMPTON: WATTS LABOR ACTION COMMUNITY', col2X, rightY, {
        width: col2Width - colPadding,
        align: 'left'
    });
    rightY += textHeight + 5;

    doc.fontSize(11.5).font('Helvetica');
    textHeight = doc.heightOfString('10950 S Central Ave, Los Angeles, CA 90059', { width: col2Width - colPadding });
    doc.text('10950 S Central Ave, Los Angeles, CA 90059', col2X, rightY, {
        width: col2Width - colPadding,
        align: 'left'
    });
    rightY += textHeight + 5;

    textHeight = doc.heightOfString('ENCUESTAS: Mar-Vie 9:00 AM - 3:30 PM', { width: col2Width - colPadding });
    doc.text('ENCUESTAS: Mar-Vie 9:00 AM - 3:30 PM', col2X, rightY, {
        width: col2Width - colPadding,
        align: 'left'
    });

    currentY = tableY + tableHeight + 15;

    // Uber section
    const uberBoxY = currentY;
    const uberBoxHeight = 92;
    
    doc.rect(margin, uberBoxY, contentWidth, uberBoxHeight)
        .fillAndStroke('#f9f9f9', '#000000');
    
    // Add left border accent
    doc.lineWidth(4)
        .moveTo(margin, uberBoxY)
        .lineTo(margin, uberBoxY + uberBoxHeight)
        .stroke('#000000');

    doc.fillColor('#1a1a1a')
        .fontSize(11.5)
        .font('Helvetica-Bold')
        .text('Ahorre $10 en sus viajes de Uber (ida y vuelta) con este código', margin + 12, uberBoxY + 12, {
            width: contentWidth - 24,
            align: 'left'
        });

    let uberY = uberBoxY + 32;
    
    const voucherLineText = '• CUPÓN DE UBER: RKRBSSFQJFS https://r.uber.com/rkrbssfqjfs';
    doc.fontSize(11.5).font('Helvetica');
    const voucherHeight = doc.heightOfString(voucherLineText, { width: contentWidth - 24 });
    
    doc.text('• CUPÓN DE UBER: ', margin + 12, uberY, {
        width: contentWidth - 24,
        align: 'left',
        continued: true
    })
    .font('Courier-Bold')
    .text('RKRBSSFQJFS ', { continued: true })
    .font('Helvetica-Bold')
    .fillColor('#0066cc')
    .text('https://r.uber.com/rkrbssfqjfs');

    uberY += voucherHeight + 8;

    const uberDetailsText = '• Reciba $10 de descuento en cada viaje de Uber (ida y vuelta) a cualquier centro (Hub) designado durante los horarios de encuesta usando el código. Más detalles en youthcount.org/uber.';
    doc.fontSize(11.5).font('Helvetica').fillColor('#1a1a1a');
    const detailsHeight = doc.heightOfString(uberDetailsText, { width: contentWidth - 24 });
    
    doc.text(uberDetailsText, margin + 12, uberY, {
        width: contentWidth - 24,
        align: 'left'
    });

    currentY = uberBoxY + uberBoxHeight + 12;

    // Footer
    doc.moveTo(margin, currentY)
        .lineTo(pageWidth - margin, currentY)
        .lineWidth(2)
        .stroke('#dddddd');

    currentY += 10;

    doc.fontSize(11.5)
        .font('Helvetica')
        .fillColor('#1a1a1a')
        .text('Los datos se utilizarán para informar al Departamento de Vivienda y Desarrollo Urbano (HUD).', margin, currentY, {
            width: contentWidth,
            align: 'left'
        });

    currentY += 18;

    doc.fontSize(11.5)
        .text('Más info en youthcount.org', margin, currentY, {
            width: contentWidth,
            align: 'left'
        });
}

async function generateCoupons(): Promise<void> {
    try {
        const args = process.argv.slice(2);
        const count = args.length > 0 ? parseInt(args[0], 10) : 1;

        if (isNaN(count) || count < 1) {
            throw new Error('Invalid number provided. Please provide a positive integer for the number of coupons.');
        }

        console.log(`📄 Generating ${count} LA Youth Count coupon(s) (2 pages each: English + Spanish)...`);

        const outputDir = createOutputDirectory();
        const filepath = generateTimestampFilename(outputDir, count);

        const doc = new PDFDocument({
            size: 'LETTER',
            margin: 30,
            autoFirstPage: false
        });

        const stream = fs.createWriteStream(filepath);
        doc.pipe(stream);

        for (let i = 0; i < count; i++) {
            // Add English page
            doc.addPage();
            addEnglishPage(doc);
            
            // Add Spanish page
            doc.addPage();
            addSpanishPage(doc);
        }

        doc.end();

        await new Promise((resolve, reject) => {
            stream.on('finish', resolve);
            stream.on('error', reject);
        });

        console.log(`\n✓ PDF generated: ${filepath}`);
        console.log(`  Total pages: ${count * 2} (${count} English + ${count} Spanish)`);
    } catch (error) {
        console.error('\n✗ Error:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
}

// Run the script
generateCoupons();