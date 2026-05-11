/**
 * @module departmentApi
 * @description RTK Query API for department endpoints (CRUD + hierarchy).
 */
import { baseApi } from './baseApi.js';

export const departmentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDepartments: builder.query({
      query: (params) => ({
        url: '/departments',
        params,
      }),
      providesTags: ['Departments'],
    }),
    getDepartmentDetail: builder.query({
      query: (id) => ({
        url: `/departments/${id}`,
      }),
      providesTags: ['Departments'],
    }),
    getDepartmentEmployees: builder.query({
      query: (id) => ({
        url: `/departments/${id}/employees`,
      }),
      providesTags: ['Departments'],
    }),
    getDepartmentStats: builder.query({
      query: (id) => ({
        url: `/departments/${id}/stats`,
      }),
      providesTags: ['Departments'],
    }),
    createDepartment: builder.mutation({
      query: (body) => ({
        url: '/departments',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Departments'],
    }),
    updateDepartment: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/departments/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Departments'],
    }),
    deleteDepartment: builder.mutation({
      query: (id) => ({
        url: `/departments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Departments'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetDepartmentsQuery,
  useGetDepartmentDetailQuery,
  useGetDepartmentEmployeesQuery,
  useGetDepartmentStatsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
} = departmentApi;
