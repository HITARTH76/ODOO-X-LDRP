// Simulated PDF Generator
exports.generateInvoicePdfBuffer = async (invoice) => {
  // Return a mocked buffer that represents a PDF
  const docText = `
    VENDORBRIDGE PROCUREMENT ERP
    INVOICE: ${invoice.invoice_number}
    -------------------------------------------
    Invoice Date: ${new Date(invoice.created_at).toLocaleDateString()}
    PO Reference: ${invoice.po_number}
    Vendor: ${invoice.company_name}
    GST Number: ${invoice.gst_number || 'N/A'}
    Contact: ${invoice.contact_phone || 'N/A'}
    Address: ${invoice.address || 'N/A'}

    Line Item Details:
    -------------------------------------------
    Item/Service: ${invoice.rfq_title}
    Quantity: ${invoice.quantity}
    Base Price: $${parseFloat(invoice.base_amount).toFixed(2)} USD

    Summary:
    -------------------------------------------
    Subtotal: $${parseFloat(invoice.base_amount).toFixed(2)} USD
    GST Tax (18%): $${parseFloat(invoice.tax_amount).toFixed(2)} USD
    Grand Total: $${parseFloat(invoice.total_amount).toFixed(2)} USD

    Status: ${invoice.status.toUpperCase()}
  `;

  return Buffer.from(docText, 'utf-8');
};
