import { baseApi } from './baseApi'
import type { RegisterPayload, UpdateProfilePayload, User } from '../types/user'

export const usersApi = baseApi.injectEndpoints({
   endpoints: (builder) => ({
      getUsers: builder.query<User[], void>({
         query: () => '/users',
         providesTags: ['User'],
      }),

      getUserById: builder.query<User, string>({
         query: (id) => `/users/${id}`,
         providesTags: (_result, _error, id) => [{ type: 'User', id }],
      }),

      registerUser: builder.mutation<User, RegisterPayload>({
         query: (payload) => ({
            url: '/users',
            method: 'POST',
            body: {
               ...payload,
               id: crypto.randomUUID(),
               createdAt: new Date().toISOString(),
               emailVerified: false,
            },
         }),
         invalidatesTags: ['User'],
      }),

      updateUser: builder.mutation<User, { id: string; data: UpdateProfilePayload }>({
         query: ({ id, data }) => ({
            url: `/users/${id}`,
            method: 'PATCH',
            body: data,
         }),
         invalidatesTags: (_result, _error, { id }) => [{ type: 'User', id }, 'User'],
      }),
   }),
})

export const {
   useGetUsersQuery,
   useGetUserByIdQuery,
   useRegisterUserMutation,
   useUpdateUserMutation,
} = usersApi