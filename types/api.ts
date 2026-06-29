export interface IApiResponse<T = unknown> {
  success: boolean
  data: T
  message?: string
  meta?: IPaginationMeta
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

export interface IApiError {
  success: false
  message: string
  error?: {
    description: string
    code?: string
  }
}

export interface IRequestOptions {
  silent?: boolean
  suppressErrorStatuses?: number[]
  suppressAuthRedirect?: boolean
}

export type SortOption = 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'newest' | 'popular'
