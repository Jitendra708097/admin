/**
 * @module notificationApi
 * @description RTK Query API for notification endpoints (list, mark read).
 */
import { baseApi } from './baseApi.js';

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: (params) => ({
        url: '/notifications',
        params,
      }),
      providesTags: ['Notifications'],
    }),
    markNotificationRead: builder.mutation({
      query: (ids) => ({
        url: '/notifications/read',
        method: 'POST',
        body: { ids: Array.isArray(ids) ? ids : [ids] },
      }),
      invalidatesTags: ['Notifications'],
    }),
    markAllNotificationsRead: builder.mutation({
      query: () => ({
        url: '/notifications/read-all',
        method: 'POST',
      }),
      invalidatesTags: ['Notifications'],
    }),
    getUnreadCount: builder.query({
      query: () => ({
        url: '/notifications/unread-count',
      }),
      providesTags: ['Notifications'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useGetUnreadCountQuery,
} = notificationApi;
