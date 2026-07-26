const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const Tesseract = require("tesseract.js");

class ReceiptExtractionService {
  /**
   * Extract raw text from an uploaded file (Image or PDF)
   */
  async extractText(filePath, mimeType) {
    if (!fs.existsSync(filePath)) {
      throw new Error("File not found for extraction");
    }

    if (mimeType === "application/pdf") {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } else if (mimeType.startsWith("image/")) {
      const { data: { text } } = await Tesseract.recognize(filePath, "eng");
      return text;
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }
  }

  /**
   * Parse heuristic information from the extracted raw text
   */
  parseReceiptData(rawText) {
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // 1. Merchant: Assume first non-empty line with letters is the merchant name
    let merchant = "Unknown Merchant";
    for (let line of lines) {
      if (/[A-Za-z]/.test(line) && line.length > 2) {
        // clean up noise
        merchant = line.replace(/[^a-zA-Z0-9\s&'-]/g, "").trim();
        break;
      }
    }

    // 2. Date: Look for common date formats MM/DD/YYYY, YYYY-MM-DD, DD-MM-YYYY
    let date = new Date().toISOString();
    const dateRegex = /\b(\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4})\b/;
    const dateMatch = rawText.match(dateRegex);
    if (dateMatch) {
      const parsed = new Date(dateMatch[1].replace(/\./g, "-"));
      if (!isNaN(parsed.getTime())) {
        date = parsed.toISOString();
      }
    }

    // 3. Amounts (Total and Tax)
    // Find all numbers that look like currency (e.g. 12.34, 1,234.56, 500)
    const amountRegex = /[\$£€₹]?\s*\b(\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})?)\b/g;
    let amounts = [];
    let match;
    while ((match = amountRegex.exec(rawText)) !== null) {
      const val = parseFloat(match[1].replace(/,/g, ""));
      if (!isNaN(val)) amounts.push(val);
    }
    
    let amount = 0;
    let tax = 0;
    
    if (amounts.length > 0) {
      // Typically, the total is the largest number on the receipt
      amount = Math.max(...amounts);
      
      // Look for tax specifically
      const taxLineRegex = /tax.*?(?:[\$£€₹]?\s*)(\d{1,3}(?:[,\s]\d{3})*(?:\.\d{2})?)/i;
      const taxMatch = rawText.match(taxLineRegex);
      if (taxMatch) {
        tax = parseFloat(taxMatch[1].replace(/,/g, ""));
      } else {
        // If not found explicitly, guess based on common percentages (5-15% of total)
        // just a fallback if we see a number that looks like tax
        const potentialTaxes = amounts.filter(a => a > 0 && a < amount && a > amount * 0.02 && a < amount * 0.20);
        if (potentialTaxes.length > 0) {
          tax = potentialTaxes[0]; // just a heuristic
        }
      }
    }

    // 4. Category Prediction based on Merchant/Keywords
    let categoryName = "Shopping"; // default
    const textLower = rawText.toLowerCase();
    if (/restaurant|cafe|coffee|diner|pizza|burger|food|eat|grill|pub|bar/i.test(textLower)) categoryName = "Food & Dining";
    else if (/fuel|gas|petrol|shell|chevron|exxon|mobil/i.test(textLower)) categoryName = "Transportation";
    else if (/uber|lyft|taxi|transit|train|metro/i.test(textLower)) categoryName = "Transportation";
    else if (/pharmacy|medical|hospital|clinic|doctor|health|walgreens|cvs/i.test(textLower)) categoryName = "Healthcare";
    else if (/hotel|motel|inn|resort|airbnb/i.test(textLower)) categoryName = "Travel";
    else if (/walmart|target|amazon|costco|supermarket|grocery/i.test(textLower)) categoryName = "Groceries";

    // Currency Detection
    let currency = "USD";
    if (rawText.includes("₹") || /rupee|inr/i.test(textLower)) currency = "INR";
    else if (rawText.includes("€") || /eur/i.test(textLower)) currency = "EUR";
    else if (rawText.includes("£") || /gbp/i.test(textLower)) currency = "GBP";

    return {
      merchant,
      date,
      amount,
      tax,
      currency,
      categoryName,
      items: [], // Itemized parsing is extremely complex with regex, left empty for review
      notes: "Extracted via OCR",
      rawText: rawText // useful for debugging
    };
  }

  async processReceipt(filePath, mimeType) {
    const text = await this.extractText(filePath, mimeType);
    return this.parseReceiptData(text);
  }
}

module.exports = new ReceiptExtractionService();
