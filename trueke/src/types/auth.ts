// User types for authentication and user data

export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
  isAdmin: boolean
  bio?: string
  status?: string
  createdAt?: string
}

export interface LoginResponse {
  success?: boolean
  error?: string
  user?: User
}

export interface RegisterResponse {
  success?: boolean
  error?: string
  message?: string
}
