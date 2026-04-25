import { baseApi } from './baseApi.js';

export const employeeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEmployees: builder.query({
      query: (params) => ({
        url: '/employees',
        params,
      }),
      providesTags: ['Employees'],
    }),
    getEmployeeDetail: builder.query({
      query: (id) => ({
        url: `/employees/${id}`,
      }),
      providesTags: ['Employees'],
    }),
    getEmployeeAttendanceSummary: builder.query({
      query: (id) => ({
        url: `/employees/${id}/attendance-summary`,
      }),
      providesTags: ['Employees'],
    }),
    getEmployeeFaceStatus: builder.query({
      query: (id) => ({
        url: `/face/status/${id}`,
      }),
      providesTags: ['Employees'],
    }),
    resetEmployeeFaceEnrollment: builder.mutation({
      query: (id) => ({
        url: `/face/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Employees'],
    }),
    createEmployee: builder.mutation({
      query: (body) => ({
        url: '/employees',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Employees'],
    }),
    updateEmployee: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/employees/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Employees'],
    }),
    deleteEmployee: builder.mutation({
      query: (id) => ({
        url: `/employees/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Employees'],
    }),
    deleteEmployees: builder.mutation({
      query: (ids) => ({
        url: '/employees',
        method: 'DELETE',
        body: { ids },
      }),
      invalidatesTags: ['Employees'],
    }),
    bulkUploadEmployees: builder.mutation({
      query: (formData) => ({
        url: '/employees/bulk-upload',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Employees'],
    }),
    resendInvite: builder.mutation({
      queryFn: async (id) => ({
        data: { id },
      }),
      invalidatesTags: ['Employees'],
    }),
    updateLeaveBalance: builder.mutation({
      queryFn: async (values) => ({
        data: values,
      }),
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetEmployeesQuery,
  useGetEmployeeDetailQuery,
  useGetEmployeeAttendanceSummaryQuery,
  useGetEmployeeFaceStatusQuery,
  useResetEmployeeFaceEnrollmentMutation,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
  useDeleteEmployeesMutation,
  useBulkUploadEmployeesMutation,
  useResendInviteMutation,
  useUpdateLeaveBalanceMutation,
} = employeeApi;
