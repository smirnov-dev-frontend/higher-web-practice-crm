import { baseApi } from './baseApi'
import type { CreateDealPayload, Deal, UpdateDealPayload } from '../types/deal'

type CreateDealRequest = CreateDealPayload & {
   createdBy: string
}

export const dealsApi = baseApi.injectEndpoints({
   endpoints: (builder) => ({
      getDeals: builder.query<Deal[], void>({
         query: () => '/deals',
         providesTags: (result) =>
            result
               ? [
                  ...result.map(({ id }) => ({ type: 'Deal' as const, id })),
                  { type: 'Deal', id: 'LIST' },
               ]
               : [{ type: 'Deal', id: 'LIST' }],
      }),

      createDeal: builder.mutation<Deal, CreateDealRequest>({
         query: (payload) => ({
            url: '/deals',
            method: 'POST',
            body: {
               ...payload,
               id: crypto.randomUUID(),
               status: 'new',
               createdAt: new Date().toISOString(),
            },
         }),
         invalidatesTags: [{ type: 'Deal', id: 'LIST' }],
      }),

      updateDeal: builder.mutation<Deal, { id: string; data: UpdateDealPayload }>({
         query: ({ id, data }) => ({
            url: `/deals/${id}`,
            method: 'PATCH',
            body: data,
         }),
         invalidatesTags: (_result, _error, { id }) => [
            { type: 'Deal', id },
            { type: 'Deal', id: 'LIST' },
         ],
      }),

      deleteDeal: builder.mutation<void, string>({
         query: (id) => ({
            url: `/deals/${id}`,
            method: 'DELETE',
         }),
         invalidatesTags: [{ type: 'Deal', id: 'LIST' }],
      }),
   }),
})

export const {
   useGetDealsQuery,
   useCreateDealMutation,
   useUpdateDealMutation,
   useDeleteDealMutation,
} = dealsApi