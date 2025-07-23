const fs = require("fs");
const pdf2table = require("pdf2table");

const extractPdfText = async (pdfPath) => {
  try {
    const buffer = fs.readFileSync(pdfPath);

    return new Promise((resolve, reject) => {
      pdf2table.parse(buffer, (err, rows) => {
        if (err) {
          return reject({ success: false, error: err.message });
        }

        // Example: Filter out blank rows and structure tables
        const cleanRows = rows.filter((row) =>
          row.some((cell) => cell.trim() !== "")
        );

        // Example logic to separate into different tables
        const table1 = {}; 
        const table2 = {}; 
        const table3 = []; 

        for (let row of cleanRows) {
          const rowStr = row.join(" ");

          // Table 1: PO Info
          if (
            !table1.po &&
            rowStr.includes("PO:") &&
            rowStr.includes("Factory:")
          ) {
            const poMatch = rowStr.match(/PO:\s*(\d+)/);
            const factoryMatch = rowStr.match(/Factory:\s*(.+?)(?:Vendor:|$)/);
            const vendorMatch = rowStr.match(/Vendor:\s*(.+)/);

            table1.po = poMatch?.[1] || "";
            table1.factory = factoryMatch?.[1]?.trim() || "";
            table1.vendor = vendorMatch?.[1]?.trim() || "";
          }

          // Table 2: Shipping Info
          if (!table2.buyer && rowStr.includes("Buyer:")) {
            const i = cleanRows.indexOf(row);
            table2.buyer = cleanRows[i + 1]?.join(" ") || "";
            table2.vendor = cleanRows[i + 2]?.join(" ") || "";
            table2.shipping_destination = cleanRows[i + 3]?.join(" ") || "";
          }

          // Table 3: Product Rows
          if (row.length >= 9 && /^\d{13}$/.test(row[3])) {
            // UPC is at index 3
            table3.push({
              color: row[0],
              color_description: row[1],
              size: row[2],
              upc: row[3],
              original_quantity: parseInt(row[4]),
              current_quantity: parseInt(row[5]),
              shipped_quantity: parseInt(row[6]),
              unit_cost: parseFloat(row[7].replace(/[$,]/g, "")),
              total_cost: parseFloat(row[8].replace(/[$,]/g, "")),
            });
          }
        }

        resolve({
          success: true,
          tables: {
            purchase_order: table1,
            shipping_info: table2,
            product_rows: table3,
          },
        });
      });
    });
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = extractPdfText;
