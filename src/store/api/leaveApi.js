/**
 * @module leaveApi
 * @description RTK Query API for leave endpoints (list, approve, reject, calendar).
 */
import { baseApi } from './baseApi.js';

export const leaveApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLeaves: builder.query({
      query: (params) => ({
        url: '/leave/requests',
        params,
      }),
      providesTags: ['Leaves'],
    }),
    getLeaveDetail: builder.query({
      query: (id) => ({
        url: `/leave/requests/${id}`,
      }),
      providesTags: ['Leaves'],
    }),
    getLeaveContext: builder.query({
      query: (id) => ({
        url: `/leave/requests/${id}/context`,
      }),
      providesTags: ['Leaves'],
    }),
    getLeaveBalances: builder.query({
      query: (params) => ({
        url: '/leave/balances',
        params,
      }),
      providesTags: ['Leaves'],
    }),
    getLeaveTypes: builder.query({
      query: () => ({
        url: '/leave/types',
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
        url: '/leave/calendar',
        params,
      }),
      providesTags: ['Leaves'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetLeavesQuery,
  useGetLeaveDetailQuery,
  useGetLeaveContextQuery,
  useGetLeaveBalancesQuery,
  useGetLeaveTypesQuery,
  useApproveLeaveMutation,
  useRejectLeaveMutation,
  useGetLeaveCalendarQuery,
} = leaveApi;
