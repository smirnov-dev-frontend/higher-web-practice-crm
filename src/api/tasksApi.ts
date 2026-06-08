import { baseApi } from './baseApi'
import type { CreateTaskPayload, Task, UpdateTaskPayload } from '../types/task'

type CreateTaskRequest = CreateTaskPayload & {
   createdBy: string
}

export const tasksApi = baseApi.injectEndpoints({
   endpoints: (builder) => ({
      getTasks: builder.query<Task[], void>({
         query: () => '/tasks',
         providesTags: (result) =>
            result
               ? [
                  ...result.map(({ id }) => ({ type: 'Task' as const, id })),
                  { type: 'Task', id: 'LIST' },
               ]
               : [{ type: 'Task', id: 'LIST' }],
      }),

      createTask: builder.mutation<Task, CreateTaskRequest>({
         query: (payload) => ({
            url: '/tasks',
            method: 'POST',
            body: {
               ...payload,
               id: crypto.randomUUID(),
               status: 'new',
               createdAt: new Date().toISOString(),
            },
         }),
         invalidatesTags: [{ type: 'Task', id: 'LIST' }],
      }),

      updateTask: builder.mutation<Task, { id: string; data: UpdateTaskPayload }>({
         query: ({ id, data }) => ({
            url: `/tasks/${id}`,
            method: 'PATCH',
            body: data,
         }),
         invalidatesTags: (_result, _error, { id }) => [
            { type: 'Task', id },
            { type: 'Task', id: 'LIST' },
         ],
      }),

      deleteTask: builder.mutation<void, string>({
         query: (id) => ({
            url: `/tasks/${id}`,
            method: 'DELETE',
         }),
         invalidatesTags: [{ type: 'Task', id: 'LIST' }],
      }),
   }),
})

export const {
   useGetTasksQuery,
   useCreateTaskMutation,
   useUpdateTaskMutation,
   useDeleteTaskMutation,
} = tasksApi