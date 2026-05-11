/**
 * @module dashboardApi
 * @description RTK Query API for admin dashboard snapshots.
 */
import { baseApi } from './baseApi.js';

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminDashboardSummary: builder.query({
      query: () => ({
        url: '/dashboard/admin-summary',
      }),
      providesTags: ['Dashboard', 'Attendance', 'Leaves', 'Regularisations', 'DeviceExceptions', 'Billing'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAdminDashboardSummaryQuery,
} = dashboardApi;
