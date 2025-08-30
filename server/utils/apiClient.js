import axios from "axios";
console.log("process.env.DELHIVERY_API_TOKEN", process.env.DELHIVERY_API_TOKEN);

const apiClient = axios.create({
  baseURL: "https://staging-express.delhivery.com",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Token ${process.env.DELHIVERY_API_TOKEN}`,
  },
});

export default apiClient;
