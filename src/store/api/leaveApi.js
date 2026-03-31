/**
 * @module leaveApi
 * @description RTK Query API for leave endpoints (list, approve, reject, calendar).
 */
import { baseApi } from './baseApi.js';

export const leaveApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLeaves: builder.query({
      query: (params) => ({
        url: '/leave/pending',
        params,
      }),
      providesTags: ['Leaves'],
    }),
    approveLeave: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/leave/${id}/approve`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Leaves'],
    }),
    rejectLeave: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/leave/${id}/reject`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Leaves'],
    }),
    getLeaveCalendar: builder.query({
      query: (params) => ({
        url: '/leave/pending',
        params,
      }),
      providesTags: ['Leaves'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetLeavesQuery,
  useApproveLeaveMutation,
  useRejectLeaveMutation,
  useGetLeaveCalendarQuery,
} = leaveApi;
