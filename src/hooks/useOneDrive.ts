import { useState, useCallback } from 'react';
import { Client } from '@microsoft/microsoft-graph-client';
import { AuthenticationResult } from '@azure/msal-browser';

interface OneDriveItem {
  id: string;
  name: string;
  size: number;
  lastModifiedDateTime: string;
  file?: {
    mimeType: string;
  };
  folder?: {
    childCount: number;
  };
}

interface OneDriveQuota {
  used: number;
  total: number;
  remaining: number;
  deleted: number;
  state: string;
}

export const useOneDrive = () => {
  const [client, setClient] = useState<Client | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initialize = useCallback(async (authResult: AuthenticationResult) => {
    try {
      const newClient = Client.init({
        authProvider: (done) => {
          done(null, authResult.accessToken);
        },
      });
      setClient(newClient);
      return true;
    } catch (err) {
      setError('Failed to initialize OneDrive client');
      return false;
    }
  }, []);

  const getStorageQuota = useCallback(async (): Promise<OneDriveQuota | null> => {
    if (!client) return null;
    try {
      const drive = await client.api('/me/drive').get();
      return drive.quota;
    } catch (err) {
      setError('Failed to fetch storage quota');
      return null;
    }
  }, [client]);

  const listItems = useCallback(async (path: string = '/') => {
    if (!client) return [];
    try {
      const response = await client
        .api(`/me/drive/root:${path}:/children`)
        .select('id,name,size,lastModifiedDateTime,file,folder')
        .orderBy('name')
        .get();
      return response.value as OneDriveItem[];
    } catch (err) {
      setError('Failed to list items');
      return [];
    }
  }, [client]);

  const moveItem = useCallback(async (itemId: string, destinationPath: string) => {
    if (!client) return false;
    try {
      await client.api(`/me/drive/items/${itemId}`).patch({
        parentReference: {
          path: `/drive/root:${destinationPath}`,
        },
      });
      return true;
    } catch (err) {
      setError('Failed to move item');
      return false;
    }
  }, [client]);

  const deleteItem = useCallback(async (itemId: string) => {
    if (!client) return false;
    try {
      await client.api(`/me/drive/items/${itemId}`).delete();
      return true;
    } catch (err) {
      setError('Failed to delete item');
      return false;
    }
  }, [client]);

  const searchItems = useCallback(async (query: string) => {
    if (!client) return [];
    try {
      const response = await client
        .api('/me/drive/root/search(q=\'' + query + '\')')
        .select('id,name,size,lastModifiedDateTime,file,folder')
        .get();
      return response.value as OneDriveItem[];
    } catch (err) {
      setError('Failed to search items');
      return [];
    }
  }, [client]);

  const createFolder = useCallback(async (path: string, name: string) => {
    if (!client) return null;
    try {
      const response = await client
        .api(`/me/drive/root:${path}:/children`)
        .post({
          name,
          folder: {},
          '@microsoft.graph.conflictBehavior': 'rename',
        });
      return response;
    } catch (err) {
      setError('Failed to create folder');
      return null;
    }
  }, [client]);

  const uploadFile = useCallback(async (path: string, file: File) => {
    if (!client) return null;
    try {
      // For files smaller than 4MB, use simple upload
      if (file.size <= 4 * 1024 * 1024) {
        const response = await client
          .api(`/me/drive/root:${path}/${file.name}:/content`)
          .put(file);
        return response;
      }
      
      // For larger files, create an upload session
      const session = await client
        .api(`/me/drive/root:${path}/${file.name}:/createUploadSession`)
        .post({});
      
      // TODO: Implement large file upload with progress
      return null;
    } catch (err) {
      setError('Failed to upload file');
      return null;
    }
  }, [client]);

  return {
    initialize,
    getStorageQuota,
    listItems,
    moveItem,
    deleteItem,
    searchItems,
    createFolder,
    uploadFile,
    error,
  };
};
