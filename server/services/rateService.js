// Customer-specific pricing.
// Formula: Rate per Litre = (FAT × Customer Price) / 10
//          Amount         = Quantity × Rate per Litre
//                         = Quantity × FAT × Customer Price / 10
// Example: 107.2 L × 6.2 FAT × ₹85 / 10 = ₹5,649.44
function calculateAmount(quantity, fat, pricePerFat) {
  const q = Number(quantity);
  const f = Number(fat);
  const p = Number(pricePerFat) || 0;

  if (!q || !f || !p) return { rate: 0, totalAmount: 0 };

  const rate = Number(((f * p) / 10).toFixed(2));
  const totalAmount = Number((q * rate).toFixed(2));
  return { rate, totalAmount };
}

module.exports = { calculateAmount };
