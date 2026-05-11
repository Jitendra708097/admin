/**
 * @module orgApi
 * @description RTK Query API for organization endpoints (profile, settings, stats).
 */
import { baseApi } from './baseApi.js';

export const orgApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOrgStats: builder.query({
      query: (params) => ({
        url: '/org/stats',
        params,
      }),
      providesTags: ['Org'],
    }),
    getOrgInfo: builder.query({
      query: () => ({
        url: '/org/info',
      }),
      providesTags: ['Org'],
    }),
    updateOrgProfile: builder.mutation({
      query: (body) => ({
        url: '/org/profile',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Org'],
    }),
    uploadOrgLogo: builder.mutation({
      query: (file) => {
        const formData = new FormData();
        formData.append('file', file);

        return {
          url: '/org/logo',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['Org'],
    }),
    removeOrgLogo: builder.mutation({
      query: () => ({
        url: '/org/logo',
        method: 'DELETE',
      }),
      invalidatesTags: ['Org'],
    }),
    getOrgSettings: builder.query({
      query: () => ({
        url: '/org/settings',
      }),
      providesTags: ['Org'],
    }),
    getSettingsHealth: builder.query({
      query: () => ({
        url: '/org/settings-health',
      }),
      providesTags: ['Org'],
    }),
    updateOrgSettings: builder.mutation({
      query: (body) => ({
        url: '/org/settings',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Org'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetOrgStatsQuery,
  useGetOrgInfoQuery,
  useUpdateOrgProfileMutation,
  useUploadOrgLogoMutation,
  useRemoveOrgLogoMutation,
  useGetOrgSettingsQuery,
  useGetSettingsHealthQuery,
  useUpdateOrgSettingsMutation,
} = orgApi;

export const useUpdateSettingsMutation = useUpdateOrgSettingsMutation;
