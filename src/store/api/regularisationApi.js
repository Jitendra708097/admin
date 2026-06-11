/**
 * @module regularisationApi
 * @description RTK Query API for regularisation endpoints (list, approve, reject).
 */
import { baseApi } from './baseApi.js';

export const regularisationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRegularisations: builder.query({
      query: ({ reviewOnly = false, ...params } = {}) => ({
        url: reviewOnly ? '/regularisations/pending' : '/regularisations',
        params,
      }),
      providesTags: ['Regularisations'],
    }),
    managerApproveRegularisation: builder.mutation({
      query: ({ id }) => ({
        url: `/regularisations/${id}/manager-approve`,
        method: 'PUT',
      }),
      invalidatesTags: ['Regularisations', 'Attendance'],
    }),
    approveRegularisation: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/regularisations/${id}/approve`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Regularisations', 'Attendance'],
    }),
    rejectRegularisation: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/regularisations/${id}/reject`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Regularisations', 'Attendance'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetRegularisationsQuery,
  useManagerApproveRegularisationMutation,
  useApproveRegularisationMutation,
  useRejectRegularisationMutation,
} = regularisationApi;
