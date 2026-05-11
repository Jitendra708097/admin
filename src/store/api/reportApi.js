/**
 * @module reportApi
 * @description RTK Query API for report endpoints (generate, job polling).
 */
import { baseApi } from './baseApi.js';

export const reportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    generateReport: builder.mutation({
      query: (body) => ({
        url: '/reports/generate',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Reports'],
    }),
    getReportJobStatus: builder.query({
      query: (jobId) => ({
        url: `/reports/jobs/${jobId}`,
      }),
      providesTags: ['Reports'],
    }),
    downloadReport: builder.query({
      query: (jobId) => ({
        url: `/reports/jobs/${jobId}/download`,
      }),
      providesTags: ['Reports'],
    }),
    getReportJobs: builder.query({
      query: () => ({
        url: '/reports/jobs',
      }),
      providesTags: ['Reports'],
    }),
    cancelReportJob: builder.mutation({
      query: (jobId) => ({
        url: `/reports/jobs/${jobId}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: ['Reports'],
    }),
    deleteReportJob: builder.mutation({
      query: (jobId) => ({
        url: `/reports/jobs/${jobId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Reports'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGenerateReportMutation,
  useGetReportJobStatusQuery,
  useDownloadReportQuery,
  useLazyDownloadReportQuery,
  useGetReportJobsQuery,
  useCancelReportJobMutation,
  useDeleteReportJobMutation,
} = reportApi;
