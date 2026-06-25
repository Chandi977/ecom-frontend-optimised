import { productService } from "./products";
import type { IProductFilterPayload } from "../types/product";

export const searchService = {
  products: (query: string, payload: IProductFilterPayload = {}) =>
    productService.search(query, payload),
};

export default searchService;
