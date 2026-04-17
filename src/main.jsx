/**
 * @module main
 * @description Application entry point. Initializes Redux store, Ant Design theme,
 *              and routing context.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { App as AntdApp, ConfigProvider } from 'antd';
import { BrowserRouter } from 'react-router';
import './globals.css';
import { store } from './store/index.js';
import { antdTheme } from './theme/antdTheme.js';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <ConfigProvider theme={antdTheme}>
        <AntdApp>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AntdApp>
      </ConfigProvider>
    </Provider>
  </React.StrictMode>
);
