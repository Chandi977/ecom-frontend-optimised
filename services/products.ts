import { getService, postService } from "./service";
import type { IProductFilterPayload } from "../types/product";

export const productService = {
  getBySlug: (slug: string) => getService(`product/get/${encodeURIComponent(slug)}`),
  getByIdWithImage: (id: string) =>
    getService(`product/image/single/${encodeURIComponent(id)}`),
  list: (params: IProductFilterPayload = {}) =>
    getService("product/all", { params }),
  filter: (payload: IProductFilterPayload = {}) =>
    postService("product/filter", payload),
  search: (search: string, payload: IProductFilterPayload = {}) =>
    postService("product/main/search", { search, ...payload }),
};

export default productService;
