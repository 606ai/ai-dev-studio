import { useEffect, useCallback } from 'react';
import { collaborationService } from '@services/collaboration';
import { useAppDispatch } from '@store/index';
import { logError } from '@utils/logger';

export const useCollaboration = (roomId: string) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const connect = async () => {
      try {
        if (!collaborationService.isConnected) {
          await collaborationService.connect(process.env.REACT_APP_COLLAB_SERVER_URL || 'ws://localhost:3001');
        }
        collaborationService.joinRoom(roomId);
      } catch (error) {
        logError('Failed to connect to collaboration service', error);
      }
    };

    connect();

    return () => {
      collaborationService.leaveRoom();
    };
  }, [roomId]);

  const broadcastCursorPosition = useCallback((position: { line: number; column: number }) => {
    try {
      collaborationService.broadcastEvent('cursor', position);
    } catch (error) {
      logError('Failed to broadcast cursor position', error);
    }
  }, []);

  const broadcastSelection = useCallback((selection: { start: number; end: number }) => {
    try {
      collaborationService.broadcastEvent('selection', selection);
    } catch (error) {
      logError('Failed to broadcast selection', error);
    }
  }, []);

  const broadcastEdit = useCallback((edit: { path: string; content: string }) => {
    try {
      collaborationService.broadcastEvent('edit', edit);
    } catch (error) {
      logError('Failed to broadcast edit', error);
    }
  }, []);

  return {
    broadcastCursorPosition,
    broadcastSelection,
    broadcastEdit,
    isConnected: collaborationService.isConnected,
  };
};
