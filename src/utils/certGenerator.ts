import { PDFDocument, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

export const generateInternshipCertificate = async (
    userName: string,
    specialty: string,
    certId: string
): Promise<string> => {
    // Load local template asset vector map 
    const templatePath = path.resolve(__dirname, '../../templates/blank_cert.pdf');
    const templateBytes = fs.readFileSync(templatePath);

    const pdfDoc = await PDFDocument.load(templateBytes);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];

    // Draw user details onto the template
    firstPage.drawText(userName, { x: 200, y: 300, size: 32, color: rgb(0.06, 0.09, 0.16) });
    firstPage.drawText(`Specialty Track Completion: ${specialty.toUpperCase()}`, { x: 200, y: 250, size: 16 });
    firstPage.drawText(`Secured Validation Footprint ID: ${certId}`, { x: 100, y: 50, size: 10, color: rgb(0.5, 0.5, 0.5) });

    const pdfBytes = await pdfDoc.save();

    // Write out directly to localized media storage disk configuration or cloud buckets
    const outputFileName = `cert_${certId}.pdf`;
    const storagePath = path.resolve(__dirname, '../../public/issued/', outputFileName);
    fs.writeFileSync(storagePath, pdfBytes);

    return `/public/issued/${outputFileName}`; // Returns public reference path endpoint string
};
