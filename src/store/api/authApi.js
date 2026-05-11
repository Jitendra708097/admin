/**
 * @module authApi
 * @description RTK Query API for authentication endpoints (login, logout, refresh).
 */
import { baseApi } from './baseApi.js';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
    }),
    exchangeImpersonationCode: builder.mutation({
      query: (body) => ({
        url: '/auth/impersonation/exchange',
        method: 'POST',
        body,
      }),
    }),
    exitImpersonation: builder.mutation({
      query: () => ({
        url: '/auth/impersonation/exit',
        method: 'POST',
      }),
    }),
    forgotPassword: builder.mutation({
      query: (body) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body,
      }),
    }),
    resetPassword: builder.mutation({
      query: (body) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body,
      }),
    }),
    logout: builder.mutation({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['Org', 'Employees', 'Attendance', 'Leaves', 'Regularisations'],
    }),
    changePassword: builder.mutation({
      query: (body) => ({
        url: '/auth/change-password',
        method: 'POST',
        body,
      }),
    }),
    refresh: builder.mutation({
      query: (body) => ({
        url: '/auth/refresh',
        method: 'POST',
        body,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useLoginMutation,
  useExchangeImpersonationCodeMutation,
  useExitImpersonationMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useLogoutMutation,
  useChangePasswordMutation,
  useRefreshMutation,
} = authApi;
