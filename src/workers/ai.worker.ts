import * as tf from '@tensorflow/tfjs';

// Define message types
interface WorkerMessage {
  type: string;
  payload: any;
}

// Initialize TensorFlow.js
tf.setBackend('cpu');

// Handle incoming messages
self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'LOAD_MODEL':
      try {
        const model = await tf.loadLayersModel(payload.modelUrl);
        self.postMessage({ type: 'MODEL_LOADED', success: true });
      } catch (error) {
        self.postMessage({ 
          type: 'MODEL_LOADED', 
          success: false, 
          error: error.message 
        });
      }
      break;

    case 'PROCESS_INPUT':
      try {
        // Convert input to tensor
        const inputTensor = tf.tensor(payload.input);
        
        // Process the input (example operation)
        const result = tf.tidy(() => {
          // Perform AI operations here
          return inputTensor.arraySync();
        });

        self.postMessage({ 
          type: 'PROCESS_COMPLETE', 
          success: true, 
          result 
        });

        // Clean up
        inputTensor.dispose();
      } catch (error) {
        self.postMessage({ 
          type: 'PROCESS_COMPLETE', 
          success: false, 
          error: error.message 
        });
      }
      break;

    default:
      self.postMessage({ 
        type: 'ERROR', 
        error: `Unknown message type: ${type}` 
      });
  }
};
