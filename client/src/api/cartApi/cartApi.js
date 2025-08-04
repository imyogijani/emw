import axios from "../../utils/axios";

export const addToCartAPI = async (userId, product) => {
  const response = await axios.post("/api/cart/add", {
    userId,
    product,
  });

  return response.data;
};

export const getCartByUserAPI = async (userId) => {
  const response = await axios.get(`/api/cart/${userId}`);
  return response.data;
};

export const updateCartItemAPI = async (
  userId,
  productId,
  variantId,
  quantity
) => {
  const response = await axios.post("/api/cart/update", {
    userId,
    productId,
    variantId: variantId || null,
    quantity,
  });

  // console.log(" Cart updated:", response.data);
  return response.data;
};

export const clearCartAPI = async (userId) => {
  const response = await axios.delete(`/api/cart/clear/${userId}`);
  return response.data;
};

export const removeCartItemAPI = async (userId, productId, variantId) => {
  const response = await axios.post("/api/cart/remove", {
    userId,
    productId,
    variantId,
  });
  return response.data;
};
