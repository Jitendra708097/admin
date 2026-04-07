/**
 * @module deviceExceptionApi
 * @description RTK Query API for device exception endpoints (approve, reject).
 */
import { baseApi } from './baseApi.js';

export const deviceExceptionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDeviceExceptions: builder.query({
      query: (params) => ({
        url: '/employees/device-exceptions',
        params,
      }),
      providesTags: ['DeviceExceptions'],
    }),
    createDeviceException: builder.mutation({
      query: (body) => ({
        url: '/employees/device-exceptions',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['DeviceExceptions'],
    }),
    approveDeviceException: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/employees/device-exceptions/${id}/approve`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['DeviceExceptions'],
    }),
    rejectDeviceException: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/employees/device-exceptions/${id}/reject`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['DeviceExceptions'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetDeviceExceptionsQuery,
  useCreateDeviceExceptionMutation,
  useApproveDeviceExceptionMutation,
  useRejectDeviceExceptionMutation,
} = deviceExceptionApi;
