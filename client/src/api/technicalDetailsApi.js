import axios from "../utils/axios";

export const getTechnicalDetailsById = async (id) => {
  try {
    const res = await axios.get(`/api/technical-details/${id}`);
    return res.data;
  } catch (err) {
    throw err.response?.data || { message: "Something went wrong" };
  }
};
