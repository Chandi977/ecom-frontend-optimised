export * from './product'
export { type IApiResponse, type IApiError, type IRequestOptions, type SortOption } from './api'
export * from './cart'
export * from './user'

export type ValueOf<T> = T[keyof T]
export type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T
