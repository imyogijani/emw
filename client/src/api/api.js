import API from './index';

export const fetchCategories = () => API.get('/categories');
export const fetchProducts = () => API.get('/products');