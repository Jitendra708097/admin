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
    getLeavePolicies: builder.query({
      query: () => ({
        url: '/leave/policies',
      }),
      providesTags: ['Leaves'],
    }),
    upsertLeavePolicy: builder.mutation({
      query: ({ id, ...body }) => ({
        url: id ? `/leave/policies/${id}` : '/leave/policies',
        method: id ? 'PUT' : 'POST',
        body,
      }),
      invalidatesTags: ['Leaves'],
    }),
    upsertLeaveType: builder.mutation({
      query: (body) => ({
        url: '/leave/types',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Leaves'],
    }),
    adjustLeaveBalance: builder.mutation({
      query: (body) => ({
        url: '/leave/balances/adjust',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Leaves', 'Employees'],
    }),
    getLeaveLedger: builder.query({
      query: (params) => ({
        url: '/leave/ledger',
        params,
      }),
      providesTags: ['Leaves'],
    }),
    getLeavePayrollReport: builder.query({
      query: (params) => ({
        url: '/leave/payroll/report',
        params,
      }),
      providesTags: ['Leaves'],
    }),
    setLeavePayrollLock: builder.mutation({
      query: (body) => ({
        url: '/leave/payroll/lock',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Leaves'],
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
    approveLeaveCancellation: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/leave/${id}/cancel/approve`,
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
  useGetLeavePoliciesQuery,
  useUpsertLeavePolicyMutation,
  useUpsertLeaveTypeMutation,
  useAdjustLeaveBalanceMutation,
  useGetLeaveLedgerQuery,
  useGetLeavePayrollReportQuery,
  useSetLeavePayrollLockMutation,
  useApproveLeaveMutation,
  useRejectLeaveMutation,
  useApproveLeaveCancellationMutation,
  useGetLeaveCalendarQuery,
} = leaveApi;
