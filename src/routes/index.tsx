import React, { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { lazyLoad } from '@utils/lazyLoad';
import Layout from '@components/Layout';

// Lazy loaded components
const Editor = lazy(() => import('@components/Editor'));
const AIPlayground = lazy(() => import('@components/AIPlayground'));
const Settings = lazy(() => import('@components/Settings'));
const Collaboration = lazy(() => import('@components/Collaboration'));
const ModelManager = lazy(() => import('@components/ModelManager'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: lazyLoad(Editor)(),
      },
      {
        path: 'ai-playground',
        element: lazyLoad(AIPlayground)(),
      },
      {
        path: 'settings',
        element: lazyLoad(Settings)(),
      },
      {
        path: 'collaboration',
        element: lazyLoad(Collaboration)(),
      },
      {
        path: 'models',
        element: lazyLoad(ModelManager)(),
      },
    ],
  },
]);
