let counter = 1;
export const generateInvoiceNumber = (orderId, suffix) => {
  return `INV-${new Date().getFullYear()}-${orderId
    .toString()
    .slice(-4)}-${suffix}`;
};
