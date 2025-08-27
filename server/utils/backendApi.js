import axios from "axios";

export const backendClient = axios.create({
  baseURL: "http://localhost:8080/", // aapke server ka URL
});
