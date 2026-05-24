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
  }),
  overrideExisting: true,
});

export const {
  useGetDesignationsQuery,
  useCreateDesignationMutation,
} = designationApi;
