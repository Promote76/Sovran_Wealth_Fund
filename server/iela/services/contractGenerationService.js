const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class ContractGenerationService {
  async generateOfferLetter(deal, buyerInfo) {
    const doc = new PDFDocument({ margin: 50 });
    const filename = `offer-letter-${deal.id}.pdf`;
    const filepath = path.join(__dirname, '../../temp', filename);

    fs.mkdirSync(path.dirname(filepath), { recursive: true });
    
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    this.addHeader(doc);
    this.addOfferLetterContent(doc, deal, buyerInfo);
    this.addSignatureBlock(doc);
    this.addFooter(doc);

    doc.end();

    await new Promise((resolve) => stream.on('finish', resolve));

    return filepath;
  }

  async generatePurchaseAgreement(deal, buyerInfo, sellerInfo) {
    const doc = new PDFDocument({ margin: 50 });
    const filename = `purchase-agreement-${deal.id}.pdf`;
    const filepath = path.join(__dirname, '../../temp', filename);

    fs.mkdirSync(path.dirname(filepath), { recursive: true });

    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    this.addHeader(doc);
    this.addPurchaseAgreementContent(doc, deal, buyerInfo, sellerInfo);
    this.addSignatureBlocks(doc, buyerInfo, sellerInfo);
    this.addFooter(doc);

    doc.end();

    await new Promise((resolve) => stream.on('finish', resolve));

    return filepath;
  }

  addHeader(doc) {
    doc
      .fontSize(20)
      .fillColor('#667eea')
      .text('AXIOM REAL ESTATE', { align: 'center' })
      .moveDown(0.5)
      .fontSize(12)
      .fillColor('#666')
      .text('Investment Property Division', { align: 'center' })
      .moveDown(2);
  }

  addOfferLetterContent(doc, deal, buyerInfo) {
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    doc
      .fontSize(16)
      .fillColor('#000')
      .text('LETTER OF INTENT TO PURCHASE', { align: 'center', underline: true })
      .moveDown(2);

    doc
      .fontSize(11)
      .fillColor('#000')
      .text(`Date: ${today}`)
      .moveDown();

    doc
      .text(`Property Address:`, { continued: true })
      .font('Helvetica-Bold')
      .text(` ${deal.parsed?.address || 'N/A'}`)
      .font('Helvetica')
      .text(`${deal.parsed?.city}, ${deal.parsed?.state} ${deal.parsed?.zip}`)
      .moveDown(1.5);

    doc
      .text(`Dear Property Owner,`)
      .moveDown();

    doc
      .text(
        `This letter confirms the intent of ${buyerInfo.name || 'the undersigned buyer'} to purchase the above-referenced property under the following terms and conditions:`,
        { align: 'justify' }
      )
      .moveDown();

    const offerPrice = deal.analysis?.maoByRepair?.[1]?.mao || deal.parsed?.asking || 0;
    
    doc
      .font('Helvetica-Bold')
      .text('PURCHASE TERMS:')
      .font('Helvetica')
      .moveDown(0.5);

    doc
      .text(`1. Purchase Price: ${this.formatCurrency(offerPrice)}`)
      .text(`2. Earnest Money Deposit: ${this.formatCurrency(offerPrice * 0.01)} (1%)`)
      .text(`3. Due Diligence Period: 14 days`)
      .text(`4. Closing Date: 30 days from acceptance`)
      .text(`5. Financing: Cash purchase / Conventional financing`)
      .moveDown();

    doc
      .font('Helvetica-Bold')
      .text('CONTINGENCIES:')
      .font('Helvetica')
      .moveDown(0.5);

    doc
      .text(`• Professional property inspection`)
      .text(`• Clear title and survey`)
      .text(`• No adverse changes to property condition`)
      .moveDown();

    doc
      .text(
        `This letter of intent is non-binding and subject to execution of a formal purchase agreement. The buyer reserves the right to conduct all necessary inspections and due diligence.`,
        { align: 'justify' }
      )
      .moveDown();

    doc
      .text(`We look forward to working with you on this transaction.`)
      .moveDown(2);
  }

  addPurchaseAgreementContent(doc, deal, buyerInfo, sellerInfo) {
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    doc
      .fontSize(16)
      .fillColor('#000')
      .text('REAL ESTATE PURCHASE AGREEMENT', { align: 'center', underline: true })
      .moveDown(2);

    doc
      .fontSize(11)
      .text(`This Purchase Agreement ("Agreement") is made on ${today}`)
      .moveDown();

    doc
      .font('Helvetica-Bold')
      .text('BETWEEN:')
      .font('Helvetica')
      .text(`Buyer: ${buyerInfo.name || 'N/A'}`)
      .text(`Address: ${buyerInfo.address || 'N/A'}`)
      .moveDown()
      .font('Helvetica-Bold')
      .text('AND:')
      .font('Helvetica')
      .text(`Seller: ${sellerInfo.name || deal.parsed?.contactName || 'N/A'}`)
      .text(`Contact: ${sellerInfo.phone || deal.parsed?.contactPhone || 'N/A'}`)
      .moveDown(1.5);

    const purchasePrice = deal.analysis?.maoByRepair?.[1]?.mao || deal.parsed?.asking || 0;

    doc
      .font('Helvetica-Bold')
      .text('1. PROPERTY DESCRIPTION')
      .font('Helvetica')
      .moveDown(0.5)
      .text(`Address: ${deal.parsed?.address || 'N/A'}`)
      .text(`City, State, ZIP: ${deal.parsed?.city}, ${deal.parsed?.state} ${deal.parsed?.zip}`)
      .text(`Legal Description: [To be inserted from title report]`)
      .moveDown();

    doc
      .font('Helvetica-Bold')
      .text('2. PURCHASE PRICE AND PAYMENT')
      .font('Helvetica')
      .moveDown(0.5)
      .text(`Total Purchase Price: ${this.formatCurrency(purchasePrice)}`)
      .text(`Earnest Money: ${this.formatCurrency(purchasePrice * 0.01)}`)
      .text(`Balance Due at Closing: ${this.formatCurrency(purchasePrice * 0.99)}`)
      .moveDown();

    doc
      .font('Helvetica-Bold')
      .text('3. CLOSING')
      .font('Helvetica')
      .moveDown(0.5)
      .text(`Closing Date: 30 days from date of acceptance`)
      .text(`Closing Location: [To be determined]`)
      .moveDown();

    doc
      .font('Helvetica-Bold')
      .text('4. INSPECTION PERIOD')
      .font('Helvetica')
      .moveDown(0.5)
      .text(
        `Buyer shall have 14 days from the date of this agreement to conduct all inspections. Buyer may terminate this agreement for any reason during this period with full refund of earnest money.`,
        { align: 'justify' }
      )
      .moveDown();

    doc
      .font('Helvetica-Bold')
      .text('5. TITLE AND SURVEY')
      .font('Helvetica')
      .moveDown(0.5)
      .text(
        `Seller shall provide clear and marketable title to the property, free from all liens and encumbrances except those disclosed in writing.`,
        { align: 'justify' }
      )
      .moveDown();

    doc
      .font('Helvetica-Bold')
      .text('6. AS-IS CONDITION')
      .font('Helvetica')
      .moveDown(0.5)
      .text(
        `Property is sold "AS-IS" condition. Buyer acknowledges property inspection rights and accepts property in its current state.`,
        { align: 'justify' }
      )
      .moveDown(2);

    doc
      .fontSize(9)
      .fillColor('#666')
      .text(
        'This is a simplified template. Consult with a real estate attorney for a legally binding purchase agreement.',
        { align: 'center', italics: true }
      );
  }

  addSignatureBlock(doc) {
    doc
      .moveDown(2)
      .fontSize(11)
      .fillColor('#000')
      .text('Respectfully submitted,')
      .moveDown(3)
      .text('_'.repeat(50))
      .text('Buyer Signature', { indent: 200 })
      .moveDown(2)
      .text('_'.repeat(50))
      .text('Printed Name', { indent: 200 })
      .moveDown(2)
      .text('_'.repeat(50))
      .text('Date', { indent: 200 });
  }

  addSignatureBlocks(doc, buyerInfo, sellerInfo) {
    doc.addPage();
    
    doc
      .fontSize(14)
      .fillColor('#000')
      .text('SIGNATURES', { align: 'center', underline: true })
      .moveDown(2);

    doc
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('BUYER:')
      .font('Helvetica')
      .moveDown(3)
      .text('_'.repeat(50))
      .text(`${buyerInfo.name || 'Buyer Name'}`, { indent: 150 })
      .moveDown()
      .text('Signature')
      .moveDown(2)
      .text('_'.repeat(50))
      .text('Date', { indent: 200 })
      .moveDown(4);

    doc
      .font('Helvetica-Bold')
      .text('SELLER:')
      .font('Helvetica')
      .moveDown(3)
      .text('_'.repeat(50))
      .text(`${sellerInfo.name || 'Seller Name'}`, { indent: 150 })
      .moveDown()
      .text('Signature')
      .moveDown(2)
      .text('_'.repeat(50))
      .text('Date', { indent: 200 });
  }

  addFooter(doc) {
    const pageCount = doc.bufferedPageRange().count;
    
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      
      doc
        .fontSize(8)
        .fillColor('#999')
        .text(
          `Page ${i + 1} of ${pageCount} | AXIOM Real Estate | Generated: ${new Date().toLocaleDateString()}`,
          50,
          doc.page.height - 50,
          { align: 'center' }
        );
    }
  }

  formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value || 0);
  }
}

module.exports = new ContractGenerationService();
