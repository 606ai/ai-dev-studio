import React, { Suspense } from 'react';
import { CircularProgress } from '@mui/material';

const Loading = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
    <CircularProgress />
  </div>
);

export const lazyLoad = (Component: React.LazyExoticComponent<any>) => (props: any) => (
  <Suspense fallback={<Loading />}>
    <Component {...props} />
  </Suspense>
);
