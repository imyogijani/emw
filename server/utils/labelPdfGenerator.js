import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

const LABELS_DIR = path.join(process.cwd(), "labels");

// Ensure labels folder exists
if (!fs.existsSync(LABELS_DIR)) {
  fs.mkdirSync(LABELS_DIR, { recursive: true });
}

export const generateLabel = (orderId, sellerId, labelData) => {
  return new Promise((resolve, reject) => {
    try {
      // Unique file name
      const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
      const fileName = `label_${orderId}_${sellerId}_${timestamp}.pdf`;
      const filePath = path.join(LABELS_DIR, fileName);

      // Create PDF
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Example label data
      doc.fontSize(18).text("Shipping Label", { align: "center" });
      doc.moveDown();
      doc.fontSize(12).text(`Order ID: ${orderId}`);
      doc.text(`Seller ID: ${sellerId}`);
      doc.text(`Customer: ${labelData.customerName}`);
      doc.text(`Address: ${labelData.address}`);
      doc.text(`Pin Code: ${labelData.pincode}`);

      doc.end();

      stream.on("finish", () => {
        resolve({ fileName, filePath });
      });
      stream.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
};
