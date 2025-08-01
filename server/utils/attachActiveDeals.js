import Deal from "../models/dealModel.js";

export const attachActiveDeals = async (products) => {
  const now = new Date();
  const productIds = products.map((p) => p._id);

  const activeDeals = await Deal.find({
    product: { $in: productIds },
    status: "approved",
    startDate: { $lte: now },
    endDate: { $gte: now },
  }).lean();

  // Create fast lookup map
  const dealMap = {};
  activeDeals.forEach((deal) => {
    dealMap[deal.product.toString()] = deal;
  });

  // Inject deal info into products
  const updatedProducts = products.map((product) => {
    const deal = dealMap[product._id.toString()];
    if (deal) {
      return {
        ...product._doc,
        isDealActive: true,
        dealPrice: deal.dealPrice,
        discountPercentage: deal.discountPercentage,
        originalPrice: product.price,
        dealStartDate: deal.startDate,
        dealEndDate: deal.endDate,
      };
    } else {
      return {
        ...product._doc,
        isDealActive: false,
      };
    }
  });

  return updatedProducts;
};
