import axios from 'axios';
import { getApiBaseUrl } from '../utils/apiConfig.js';

const API = axios.create({ baseURL: `${getApiBaseUrl()}/api/v1` });

export default API;