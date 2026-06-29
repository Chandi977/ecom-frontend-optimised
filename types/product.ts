export interface IBrand {
  _id: string
  name: string
  slug?: string
  image?: string
  description?: string
}

// Definition of a spec field a category exposes (mirrors the backend
// ISpecSchemaField). Drives storefront spec labels/units/ordering.
export interface ISpecSchemaField {
  key: string
  label: string
  type: 'number' | 'select' | 'text'
  options?: string[]
  required?: boolean
  unit?: string
  default_value?: unknown
}

export interface ICategory {
  _id: string
  name: string
  slug: string
  gst?: number
  hsn_code?: string
  sac_code?: string
  tax_category?: string
  overview_fields?: IOverviewFieldConfig[]
  filters?: IFilterMetadata[]
  image?: string
  description?: string
  // Category-wide inherited attribute defaults and spec-field definitions.
  common_attributes?: Record<string, unknown>
  spec_schema?: ISpecSchemaField[]
}

export interface ISubCategory {
  _id: string
  name: string
  slug: string
  category: string | ICategory
  gst?: number
  common_attributes?: Record<string, unknown>
}

export interface IProductSpecification {
  length?: number
  width?: number
  height?: number
  length_mm?: number
  width_mm?: number
  height_mm?: number
  length_inch?: number
  width_inch?: number
  height_inch?: number
  breadth_mm?: number
  breadth_inch?: number
  thickness?: number
  thickness_micron?: number
  material?: string
  color?: string
  gusset?: number
  flap_mm?: number
  weight?: number
  pack_weight?: number
  adhesive?: string
  print?: string
  core_size?: number
  label_in_roll?: string
  gsm?: number
  size_inch?: string
  size_mm?: string
  pouch_weight?: number
  [key: string]: unknown
}

export interface IPriceListItem {
  number: number
  SP?: number
  MRP?: number
  price?: number
  original_price?: number
  pack_weight?: number
  stock_quantity?: number
  discount?: number
}

export interface IPricing {
  basePrice?: number
  priceList?: IPriceListItem[]
  gst?: number
  hsn_code?: string
  discount?: number
  stockQuantity?: number
  packWeight?: number
}

export interface IInventory {
  availableStock: number
  reservedStock?: number
  minimumStock?: number
  warehouses?: IWarehouse[]
}

export interface IWarehouse {
  name: string
  stock: number
  location?: string
}

export interface IMedia {
  thumbnail?: string | IMediaImage
  images?: IMediaImage[]
  gallery?: IMediaImage[]
  videos?: IMediaVideo[]
  documents?: IMediaDocument[]
}

export interface IMediaImage {
  image: string
  alt?: string
  order?: number
}

export interface IMediaVideo {
  url: string
  title?: string
  type?: 'youtube' | 'vimeo' | 'mp4'
}

export interface IMediaDocument {
  url: string
  title: string
  type?: string
}

export interface ISEO {
  metaTitle?: string
  metaDescription?: string
  meta_title?: string
  meta_description?: string
  keywords?: string
  schema?: Record<string, unknown>
  schema_markup?: Record<string, unknown>
  canonical?: string
  ogImage?: string
  overview_fields?: IOverviewFieldConfig[]
}

export interface IOverviewFieldConfig {
  key: string
  label: string
  value?: string
  visible?: boolean
  ordering?: number
}

export interface IFilterMetadata {
  name: string
  type: 'checkbox' | 'range' | 'select' | 'radio'
  label?: string
  options?: string[]
  min?: number
  max?: number
  unit?: string
}

export interface IProduct {
  _id: string
  name: string
  slug: string
  model?: string
  description?: string
  aboutItem?: string
  usage?: string
  brand: IBrand
  category: ICategory
  subCategory?: ISubCategory
  sub_category?: ISubCategory | string
  specification?: IProductSpecification
  pricing?: IPricing
  inventory?: IInventory
  media?: IMedia
  seo?: ISEO
  images?: IMediaImage[]
  price?: number
  priceList?: IPriceListItem[]
  product_id?: string
  gst?: number
  hsn_code?: string
  sac_code?: string
  tax_category?: string
  meta_title?: string
  meta_description?: string
  top_product?: boolean
  deal_product?: boolean
  featured?: boolean
  delivery_time?: string
  overview_fields?: IOverviewFieldConfig[]
  category_overview_fields?: IOverviewFieldConfig[]
  relatedProducts?: Array<string | IProduct>
  buyItWith?: Array<string | IProduct>
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

export type IProductCard = Pick<
  IProduct,
  | '_id'
  | 'name'
  | 'slug'
  | 'brand'
  | 'category'
  | 'subCategory'
  | 'pricing'
  | 'inventory'
  | 'media'
  | 'specification'
  | 'top_product'
  | 'deal_product'
  | 'model'
>

export interface IProductListResponse {
  data: IProduct[]
  meta: IPaginationMeta
}

export interface IPaginationMeta {
  total: number
  skip: number
  limit: number
  page: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface IProductFilterPayload {
  category?: string | string[]
  subcategory?: string
  brand?: string
  q?: string
  skip?: number
  limit?: number
  sort?: string
  unit?: string
  includeMeta?: boolean
  [key: string]: unknown
}
