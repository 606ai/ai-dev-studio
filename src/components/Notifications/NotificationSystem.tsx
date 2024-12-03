import React from 'react';
import { Snackbar, Alert, AlertTitle } from '@mui/material';
import { useAppSelector, useAppDispatch } from '../../hooks/useAppStore';
import { removeNotification } from '../../store/slices/uiSlice';

const NotificationSystem: React.FC = () => {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector((state) => state.ui.notifications);

  const handleClose = (id: string) => {
    dispatch(removeNotification(id));
  };

  return (
    <>
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open={true}
          autoHideDuration={6000}
          onClose={() => handleClose(notification.id)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => handleClose(notification.id)}
            severity={notification.type}
            sx={{ width: '100%' }}
            elevation={6}
            variant="filled"
          >
            <AlertTitle>{notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}</AlertTitle>
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
};

export default NotificationSystem;
