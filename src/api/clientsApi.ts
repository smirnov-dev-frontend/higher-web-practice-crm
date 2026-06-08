import { baseApi } from './baseApi'
import type { Client, CreateClientPayload, UpdateClientPayload } from '../types/client'

type CreateClientRequest = CreateClientPayload & {
   createdBy: string
}

export const clientsApi = baseApi.injectEndpoints({
   endpoints: (builder) => ({
      getClients: builder.query<Client[], void>({
         query: () => '/clients',
         providesTags: (result) =>
            result
               ? [
                  ...result.map(({ id }) => ({ type: 'Client' as const, id })),
                  { type: 'Client', id: 'LIST' },
               ]
               : [{ type: 'Client', id: 'LIST' }],
      }),

      createClient: builder.mutation<Client, CreateClientRequest>({
         query: (payload) => ({
            url: '/clients',
            method: 'POST',
            body: {
               ...payload,
               id: crypto.randomUUID(),
               createdAt: new Date().toISOString(),
               deleted: false,
            },
         }),
         invalidatesTags: [{ type: 'Client', id: 'LIST' }],
      }),

      updateClient: builder.mutation<Client, { id: string; data: UpdateClientPayload }>({
         query: ({ id, data }) => ({
            url: `/clients/${id}`,
            method: 'PATCH',
            body: data,
         }),
         invalidatesTags: (_result, _error, { id }) => [
            { type: 'Client', id },
            { type: 'Client', id: 'LIST' },
         ],
      }),

      deleteClient: builder.mutation<Client, string>({
         query: (id) => ({
            url: `/clients/${id}`,
            method: 'PATCH',
            body: {
               deleted: true,
            },
         }),
         invalidatesTags: (_result, _error, id) => [
            { type: 'Client', id },
            { type: 'Client', id: 'LIST' },
         ],
      }),
   }),
})

export const {
   useGetClientsQuery,
   useCreateClientMutation,
   useUpdateClientMutation,
   useDeleteClientMutation,
} = clientsApi