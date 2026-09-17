import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export interface GeneratePdfOptions {
  templateName: string;
  category?: string;
  propertyName?: string;
  roomName?: string;
  tenantName?: string;
  notes?: string;
}

/**
 * Generates an authentic, standards-compliant PDF file as a Blob.
 * Suitable for Adobe Acrobat, Google Drive PDF viewer, and printing.
 */
export async function generateMasterPdfBlob(options: GeneratePdfOptions): Promise<Blob> {
  const {
    templateName,
    category = 'Document Notice / Agreement',
    propertyName = '1070 Yank Street',
    roomName,
    tenantName,
    notes,
  } = options;

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(templateName);
  pdfDoc.setAuthor('Moyer Real Estate Management');
  pdfDoc.setSubject(`${templateName} - ${tenantName || 'Resident'}`);

  const page = pdfDoc.addPage([612, 792]); // Standard US Letter (8.5 x 11 inches)
  const { height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const primaryColor = rgb(0.1, 0.15, 0.25);
  const darkGray = rgb(0.2, 0.2, 0.2);
  const lightGray = rgb(0.5, 0.5, 0.5);
  const accentRed = rgb(0.85, 0.15, 0.15);
  const borderGray = rgb(0.8, 0.82, 0.85);

  let y = height - 50;

  // Header Bar
  const isCourtForm = templateName.toLowerCase().includes('jdf') || category.toLowerCase().includes('court') || category.toLowerCase().includes('eviction');

  if (isCourtForm) {
    page.drawText('STATE OF COLORADO - COUNTY OF JEFFERSON', {
      x: 50,
      y,
      size: 9,
      font: fontBold,
      color: lightGray,
    });
    y -= 14;

    const formTitle = templateName.toLowerCase().includes('jdf101')
      ? 'JDF 101 - DEMAND FOR COMPLIANCE OR RIGHT TO POSSESSION'
      : templateName.toLowerCase().includes('jdf102')
      ? 'JDF 102 - NOTICE TO TERMINATE TENANCY'
      : templateName.toLowerCase().includes('jdf99')
      ? 'JDF 99 - INCIDENT & COMPLIANCE VERIFICATION'
      : templateName.replace(/\.pdf$/i, '').toUpperCase();

    page.drawText(formTitle, {
      x: 50,
      y,
      size: 14,
      font: fontBold,
      color: accentRed,
    });
    y -= 18;

    page.drawText('Pursuant to C.R.S. § 13-40-104 et seq. (Colorado Revised Statutes)', {
      x: 50,
      y,
      size: 9,
      font: fontItalic,
      color: lightGray,
    });
  } else {
    page.drawText('MOYER REAL ESTATE MANAGEMENT & RENTALS', {
      x: 50,
      y,
      size: 9,
      font: fontBold,
      color: lightGray,
    });
    y -= 14;

    page.drawText(templateName.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ').toUpperCase(), {
      x: 50,
      y,
      size: 14,
      font: fontBold,
      color: primaryColor,
    });
    y -= 18;

    page.drawText(`Category: ${category}`, {
      x: 50,
      y,
      size: 9,
      font: fontItalic,
      color: lightGray,
    });
  }

  y -= 10;
  // Divider line
  page.drawLine({
    start: { x: 50, y },
    end: { x: 562, y },
    thickness: 1.5,
    color: primaryColor,
  });
  y -= 25;

  // Metadata Box
  page.drawRectangle({
    x: 50,
    y: y - 85,
    width: 512,
    height: 95,
    borderColor: borderGray,
    borderWidth: 1,
    color: rgb(0.97, 0.98, 0.99),
  });

  page.drawText('PROPERTY / TENANT SPECIFICATION', {
    x: 65,
    y: y - 5,
    size: 9,
    font: fontBold,
    color: primaryColor,
  });

  const currentDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  page.drawText(`Date Prepared: ${currentDateStr}`, {
    x: 350,
    y: y - 5,
    size: 9,
    font: fontRegular,
    color: darkGray,
  });

  page.drawText(`Property: ${propertyName}`, {
    x: 65,
    y: y - 25,
    size: 10,
    font: fontBold,
    color: darkGray,
  });

  page.drawText(`Unit / Room: ${roomName || 'All / General Property'}`, {
    x: 65,
    y: y - 43,
    size: 10,
    font: fontRegular,
    color: darkGray,
  });

  page.drawText(`Resident / Tenant: ${tenantName || 'Unassigned / Prospective Resident'}`, {
    x: 65,
    y: y - 61,
    size: 10,
    font: fontBold,
    color: tenantName ? primaryColor : lightGray,
  });

  page.drawText(`Status: Ready for Adobe Acrobat Fill & Sign`, {
    x: 350,
    y: y - 61,
    size: 8.5,
    font: fontItalic,
    color: rgb(0.1, 0.55, 0.25),
  });

  y -= 115;

  // Body content based on document type
  if (isCourtForm) {
    page.drawText('TO THE TENANT(S) IN POSSESSION:', {
      x: 50,
      y,
      size: 10,
      font: fontBold,
      color: primaryColor,
    });
    y -= 18;

    const noticeParagraph1 = `YOU ARE HEREBY NOTIFIED that pursuant to Colorado law, you are required within the statutory notice period to either comply with the covenants of your lease agreement or deliver up possession of the designated premises situated in the County of Jefferson, State of Colorado, commonly known as:`;
    page.drawText(noticeParagraph1, {
      x: 50,
      y,
      size: 9,
      font: fontRegular,
      color: darkGray,
      maxWidth: 512,
      lineHeight: 14,
    });
    y -= 38;

    page.drawText(`${propertyName}, ${roomName ? 'Unit: ' + roomName + ', ' : ''}Lakewood, CO 80215`, {
      x: 65,
      y,
      size: 10,
      font: fontBold,
      color: primaryColor,
    });
    y -= 25;

    page.drawText('REASON FOR NOTICE / LEASE COVENANT BREACH:', {
      x: 50,
      y,
      size: 9.5,
      font: fontBold,
      color: primaryColor,
    });
    y -= 15;

    // Fillable area box
    page.drawRectangle({
      x: 50,
      y: y - 70,
      width: 512,
      height: 75,
      borderColor: borderGray,
      borderWidth: 1,
      color: rgb(1, 1, 1),
    });

    const bodyNote = notes || '1. Payment of delinquent rent/utilities balance, or\n2. Curing of unauthorized occupancy / noise covenant violation as detailed herein.\n[Use Adobe Acrobat to fill in exact demand particulars or amounts owed]';
    page.drawText(bodyNote, {
      x: 60,
      y: y - 18,
      size: 8.5,
      font: fontItalic,
      color: darkGray,
      maxWidth: 492,
      lineHeight: 13,
    });

    y -= 95;

    page.drawText('DEMAND FOR COMPLIANCE:', {
      x: 50,
      y,
      size: 9.5,
      font: fontBold,
      color: primaryColor,
    });
    y -= 16;

    const noticeParagraph2 = `Demand is hereby made that you either vacate the premises and deliver possession thereof to the Landlord or comply with the terms of your lease agreement on or before the expiration of the statutory period from the date of service of this notice.`;
    page.drawText(noticeParagraph2, {
      x: 50,
      y,
      size: 9,
      font: fontRegular,
      color: darkGray,
      maxWidth: 512,
      lineHeight: 14,
    });
    y -= 45;
  } else {
    // Standard Agreement Body
    page.drawText('DOCUMENT TERMS & RECITALS:', {
      x: 50,
      y,
      size: 10,
      font: fontBold,
      color: primaryColor,
    });
    y -= 18;

    const leaseIntro = `This document constitutes the official record for ${templateName.replace(/\.pdf$/i, '')} pertaining to the residential premises at ${propertyName} ${roomName ? '(' + roomName + ')' : ''}, executed by and between Moyer Real Estate Management and the designated resident(s).`;
    page.drawText(leaseIntro, {
      x: 50,
      y,
      size: 9.5,
      font: fontRegular,
      color: darkGray,
      maxWidth: 512,
      lineHeight: 14,
    });
    y -= 40;

    // Terms Box
    page.drawRectangle({
      x: 50,
      y: y - 100,
      width: 512,
      height: 105,
      borderColor: borderGray,
      borderWidth: 1,
      color: rgb(1, 1, 1),
    });

    page.drawText('TERMS & CONDITIONS ACKNOWLEDGEMENT:', {
      x: 60,
      y: y - 15,
      size: 9,
      font: fontBold,
      color: primaryColor,
    });

    const termsText = notes || '1. Resident agrees to all rules, safety covenants, and quiet hours.\n2. All utilities and shared area maintenance shall follow established house schedules.\n3. Alterations to property require advance written consent from Landlord.\n[Open in Adobe Acrobat to complete remaining agreement clauses and signatures]';
    page.drawText(termsText, {
      x: 60,
      y: y - 35,
      size: 8.5,
      font: fontItalic,
      color: darkGray,
      maxWidth: 492,
      lineHeight: 13,
    });

    y -= 125;
  }

  // Signature Block
  page.drawLine({
    start: { x: 50, y },
    end: { x: 562, y },
    thickness: 0.75,
    color: borderGray,
  });
  y -= 25;

  page.drawText('EXECUTION & VERIFICATION OF SERVICE / SIGNATURES', {
    x: 50,
    y,
    size: 9,
    font: fontBold,
    color: primaryColor,
  });
  y -= 35;

  // Landlord Signature Line
  page.drawLine({
    start: { x: 50, y },
    end: { x: 260, y },
    thickness: 1,
    color: darkGray,
  });
  page.drawText('Landlord / Agent: Moyer Property Management', {
    x: 50,
    y: y - 12,
    size: 8,
    font: fontRegular,
    color: lightGray,
  });
  page.drawText('Date: ________________________', {
    x: 50,
    y: y - 26,
    size: 8,
    font: fontRegular,
    color: lightGray,
  });

  // Resident / Tenant Signature Line
  page.drawLine({
    start: { x: 340, y },
    end: { x: 550, y },
    thickness: 1,
    color: darkGray,
  });
  page.drawText(`Resident / Tenant: ${tenantName || 'Resident Signature'}`, {
    x: 340,
    y: y - 12,
    size: 8,
    font: fontRegular,
    color: lightGray,
  });
  page.drawText('Date: ________________________', {
    x: 340,
    y: y - 26,
    size: 8,
    font: fontRegular,
    color: lightGray,
  });

  // Footer
  page.drawText(`Moyer Property Management CRM • Document: ${templateName} • Lakewood, CO 80215`, {
    x: 50,
    y: 25,
    size: 7.5,
    font: fontRegular,
    color: lightGray,
  });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}
