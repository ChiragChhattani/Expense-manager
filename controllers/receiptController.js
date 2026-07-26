const { asyncHandler } = require("../utils/errorHandler");
const receiptExtractionService = require("../services/receiptExtractionService");

/**
 * POST /api/v1/receipts/scan
 * Expects a multipart/form-data request with a `receipt` field containing an image or PDF.
 */
const scanReceipt = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No receipt file uploaded.");
  }

  const filePath = req.file.path;
  const mimeType = req.file.mimetype;
  const receiptUrl = `/uploads/${req.file.filename}`;

  try {
    const extractedData = await receiptExtractionService.processReceipt(filePath, mimeType);
    
    // We keep the file saved in /uploads/ so the frontend can preview it
    // and use the receiptUrl when creating the transaction.
    res.status(200).json({
      success: true,
      data: {
        ...extractedData,
        receiptUrl
      }
    });
  } catch (error) {
    // If extraction fails, we might want to still return the url so they can enter manually
    res.status(500).json({
      success: false,
      message: "OCR extraction failed.",
      error: error.message,
      receiptUrl
    });
  }
});

module.exports = {
  scanReceipt
};
