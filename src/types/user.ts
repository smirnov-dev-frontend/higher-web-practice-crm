export type User = {
  id: string
  email: string
  emailVerified?: boolean
  name: string
  username?: string
  createdAt: string
  password?: string
  avatar?: string
}

export type UserProfile = User & {
  password?: string
}

export type RegisterPayload = {
  email: string
  password: string
  name: string
}

export type LoginPayload = {
  email: string
  password: string
}

export type UpdateProfilePayload = {
  email?: string
  emailVerified?: boolean
  name?: string
  username?: string
  password?: string
  avatar?: string
}
