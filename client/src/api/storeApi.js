import axios from "../utils/axios";

export const fetchStores = async ({
  page = 1,
  limit = 10,
  sort = "createdAt",
  order = "desc",
  search = "",
  status = "",
} = {}) => {
  try {
    const response = await axios.get("/api/stores", {
      params: {
        page,
        limit,
        sort,
        order,
        search,
        status,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching stores:", error);
    throw error?.response?.data || { message: "Failed to fetch stores" };
  }
};
