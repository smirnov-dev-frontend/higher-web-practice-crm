export type User = {
  id: string
  email: string
  name: string
  createdAt: string
  password?: string
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
  name?: string
  password?: string
}
