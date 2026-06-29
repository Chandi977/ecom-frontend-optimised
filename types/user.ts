export interface IUser {
  _id: string
  first_name: string
  last_name: string
  email_address: string
  mobile_number: string
  addresses: IAddress[]
}

export interface IAddress {
  _id?: string
  name: string
  phone: string
  address: string
  town: string
  state: string
  pincode: string
  isDefault?: boolean
}

export interface IAuthState {
  token: string | null
  user: IUser | null
  isAuthenticated: boolean
  isLoading: boolean
}
