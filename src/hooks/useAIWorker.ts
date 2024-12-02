import { useEffect, useCallback, useRef } from 'react';
import { useAppDispatch } from '@store/index';
import { setProcessing, setError } from '@store/slices/aiSlice';

export const useAIWorker = () => {
  const workerRef = useRef<Worker | null>(null);
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Initialize worker
    workerRef.current = new Worker(new URL('../workers/ai.worker.ts', import.meta.url));

    // Set up message handler
    workerRef.current.onmessage = (e) => {
      const { type, success, error, result } = e.data;

      switch (type) {
        case 'MODEL_LOADED':
          dispatch(setProcessing(false));
          if (!success) {
            dispatch(setError(error));
          }
          break;

        case 'PROCESS_COMPLETE':
          dispatch(setProcessing(false));
          if (!success) {
            dispatch(setError(error));
          }
          break;

        case 'ERROR':
          dispatch(setProcessing(false));
          dispatch(setError(error));
          break;
      }
    };

    // Cleanup
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [dispatch]);

  const loadModel = useCallback((modelUrl: string) => {
    if (workerRef.current) {
      dispatch(setProcessing(true));
      workerRef.current.postMessage({
        type: 'LOAD_MODEL',
        payload: { modelUrl },
      });
    }
  }, [dispatch]);

  const processInput = useCallback((input: any) => {
    if (workerRef.current) {
      dispatch(setProcessing(true));
      workerRef.current.postMessage({
        type: 'PROCESS_INPUT',
        payload: { input },
      });
    }
  }, [dispatch]);

  return {
    loadModel,
    processInput,
  };
};
