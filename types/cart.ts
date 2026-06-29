import type { IProduct } from './product'

export interface ICartItem {
  _id?: string
  product: Pick<
    IProduct,
    '_id' | 'name' | 'slug' | 'brand' | 'category' | 'pricing' | 'media' | 'specification' | 'inventory'
  >
  quantity: number
  price: number
  selectedNumber: number
  selectedPackWeight: number
  packSize: number
  brand: string
  category: string
  stock: number
}

export interface ICart {
  _id?: string
  user?: string
  items: ICartItem[]
  guestId?: string
  createdAt?: string
  updatedAt?: string
}

export interface IWishlistItem {
  _id?: string
  product: Pick<IProduct, '_id' | 'name' | 'slug' | 'brand' | 'pricing' | 'media' | 'specification' | 'inventory'>
  addedAt?: string
}

export interface ICompareItem {
  product: Pick<IProduct, '_id' | 'name' | 'slug' | 'brand' | 'pricing' | 'media' | 'specification' | 'inventory'>
  addedAt: number
}
