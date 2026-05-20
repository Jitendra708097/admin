/**
 * @module App
 * @description Root application component. Delegates routing to AppRouter.
 */
import { useEffect, useState } from 'react';
import { Spin } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import axiosInstance from './api/axiosInstance.js';
import AppRouter from './routes/AppRouter.jsx';
import { logout, setTokens } from './store/authSlice.js';

export default function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, accessToken } = useSelector((state) => state.auth);
  const [isRestoringSession, setIsRestoringSession] = useState(isAuthenticated && !accessToken);

  useEffect(() => {
    if (!isAuthenticated || accessToken) {
      setIsRestoringSession(false);
      return;
    }

    let cancelled = false;

    axiosInstance.post('/auth/refresh', {})
      .then((response) => {
        if (!cancelled) {
          dispatch(setTokens(response.data.data));
        }
      })
      .catch(() => {
        if (!cancelled) {
          dispatch(logout());
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsRestoringSession(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, dispatch, isAuthenticated]);

  if (isRestoringSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return <AppRouter />;
}
