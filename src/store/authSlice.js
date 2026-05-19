/**
 * @module authSlice
 * @description Redux slice for authentication state management.
 *              Handles login, token refresh, and logout actions.
 */
import { createSlice } from '@reduxjs/toolkit';
import { storage } from '../utils/storage.js';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: storage.get('user'),
    accessToken: null,
    refreshToken: null,
    orgInfo: storage.get('orgInfo'),
    isAuthenticated: !!storage.get('user'),
  },
  reducers: {
    setAuth: (state, action) => {
      const { user, accessToken, refreshToken, org } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.orgInfo = org;
      state.isAuthenticated = true;
      storage.set('user', user);
      storage.set('orgInfo', org);
      storage.remove('accessToken');
      storage.remove('refreshToken');
    },
    setTokens: (state, action) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
    setOrgInfo: (state, action) => {
      state.orgInfo = action.payload;
      storage.set('orgInfo', action.payload);
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.orgInfo = null;
      state.isAuthenticated = false;
      storage.clear();
    },
  },
});

export const { setAuth, setTokens, setOrgInfo, logout } = authSlice.actions;
export default authSlice.reducer;
