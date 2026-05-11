/**
 * @module branchApi
 * @description RTK Query API for branch endpoints (CRUD + geofence).
 */
import { baseApi } from './baseApi.js';

export const branchApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBranches: builder.query({
      query: (params) => ({
        url: '/branches',
        params,
      }),
      providesTags: ['Branches'],
    }),
    getBranchDetail: builder.query({
      query: (id) => ({
        url: `/branches/${id}`,
      }),
      providesTags: ['Branches'],
    }),
    getBranchEmployees: builder.query({
      query: (id) => ({
        url: `/branches/${id}/employees`,
      }),
      providesTags: ['Branches'],
    }),
    getBranchTodayStats: builder.query({
      query: (id) => ({
        url: `/branches/${id}/stats/today`,
      }),
      providesTags: ['Branches'],
    }),
    createBranch: builder.mutation({
      query: (body) => ({
        url: '/branches',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Branches'],
    }),
    updateBranch: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/branches/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Branches'],
    }),
    deleteBranch: builder.mutation({
      query: (id) => ({
        url: `/branches/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Branches'],
    }),
    setGeofence: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/branches/${id}/geofence`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Branches'],
    }),
    testGeofence: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/branches/${id}/geofence/test`,
        method: 'POST',
        body,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetBranchesQuery,
  useGetBranchDetailQuery,
  useGetBranchEmployeesQuery,
  useGetBranchTodayStatsQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation,
  useDeleteBranchMutation,
  useSetGeofenceMutation,
  useTestGeofenceMutation,
} = branchApi;
