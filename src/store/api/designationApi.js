import { baseApi } from './baseApi.js';

export const designationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDesignations: builder.query({
      query: () => ({
        url: '/designations',
      }),
      providesTags: ['Designations'],
    }),
    createDesignation: builder.mutation({
      query: (body) => ({
        url: '/designations',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Designations'],
    }),
    updateDesignation: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/designations/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Designations', 'Employees'],
    }),
    deleteDesignation: builder.mutation({
      query: (id) => ({
        url: `/designations/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Designations', 'Employees'],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetDesignationsQuery,
  useCreateDesignationMutation,
  useUpdateDesignationMutation,
  useDeleteDesignationMutation,
} = designationApi;
