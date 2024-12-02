import { useEffect, useRef, useState } from 'react';
import DebuggerService, {
  DebugConfig,
  Breakpoint,
  StackFrame,
  Variable,
  ProfileData
} from '../services/DebuggerService';

interface DebuggerState {
  isDebugging: boolean;
  isProfiling: boolean;
  breakpoints: Map<string, Breakpoint[]>;
  stackFrames: StackFrame[];
  variables: Variable[];
  profileData: ProfileData[];
  error: Error | null;
}

export function useDebugger() {
  const debuggerRef = useRef<DebuggerService | null>(null);
  const [state, setState] = useState<DebuggerState>({
    isDebugging: false,
    isProfiling: false,
    breakpoints: new Map(),
    stackFrames: [],
    variables: [],
    profileData: [],
    error: null
  });

  useEffect(() => {
    debuggerRef.current = new DebuggerService();

    const service = debuggerRef.current;

    // Setup event listeners
    service.on('debugSessionStarted', () => {
      setState(prev => ({ ...prev, isDebugging: true }));
    });

    service.on('debugSessionEnded', () => {
      setState(prev => ({ ...prev, isDebugging: false }));
    });

    service.on('breakpointSet', (breakpoint: Breakpoint) => {
      setState(prev => {
        const newBreakpoints = new Map(prev.breakpoints);
        const fileBreakpoints = newBreakpoints.get(breakpoint.source?.path || '') || [];
        newBreakpoints.set(breakpoint.source?.path || '', [...fileBreakpoints, breakpoint]);
        return { ...prev, breakpoints: newBreakpoints };
      });
    });

    service.on('breakpointRemoved', ({ path, id }) => {
      setState(prev => {
        const newBreakpoints = new Map(prev.breakpoints);
        const fileBreakpoints = newBreakpoints.get(path) || [];
        newBreakpoints.set(
          path,
          fileBreakpoints.filter(bp => bp.id !== id)
        );
        return { ...prev, breakpoints: newBreakpoints };
      });
    });

    service.on('stopped', async () => {
      const stackFrames = await service.getStackTrace();
      const variables = stackFrames[0]
        ? await service.getVariables(stackFrames[0].id)
        : [];
      setState(prev => ({ ...prev, stackFrames, variables }));
    });

    service.on('profilingStarted', () => {
      setState(prev => ({ ...prev, isProfiling: true }));
    });

    service.on('profilingStopped', (profileData: ProfileData[]) => {
      setState(prev => ({
        ...prev,
        isProfiling: false,
        profileData
      }));
    });

    service.on('error', (error: Error) => {
      setState(prev => ({ ...prev, error }));
    });

    return () => {
      if (service) {
        service.removeAllListeners();
        service.stopDebugSession();
      }
    };
  }, []);

  // Debug Session Management
  const startDebugSession = async (config: DebugConfig) => {
    try {
      await debuggerRef.current?.startDebugSession(config);
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error }));
    }
  };

  const stopDebugSession = async () => {
    try {
      await debuggerRef.current?.stopDebugSession();
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error }));
    }
  };

  // Breakpoint Management
  const setBreakpoint = async (
    path: string,
    line: number,
    column?: number,
    condition?: string
  ) => {
    try {
      await debuggerRef.current?.setBreakpoint(path, line, column, condition);
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error }));
    }
  };

  const removeBreakpoint = async (path: string, id: string) => {
    try {
      await debuggerRef.current?.removeBreakpoint(path, id);
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error }));
    }
  };

  // Execution Control
  const continue_ = async () => {
    try {
      await debuggerRef.current?.continue();
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error }));
    }
  };

  const pause = async () => {
    try {
      await debuggerRef.current?.pause();
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error }));
    }
  };

  const stepOver = async () => {
    try {
      await debuggerRef.current?.stepOver();
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error }));
    }
  };

  const stepInto = async () => {
    try {
      await debuggerRef.current?.stepInto();
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error }));
    }
  };

  const stepOut = async () => {
    try {
      await debuggerRef.current?.stepOut();
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error }));
    }
  };

  // State Inspection
  const evaluate = async (expression: string, frameId?: number) => {
    try {
      return await debuggerRef.current?.evaluate(expression, frameId);
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error }));
      return null;
    }
  };

  // Profiling
  const startProfiling = async () => {
    try {
      await debuggerRef.current?.startProfiling();
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error }));
    }
  };

  const stopProfiling = async () => {
    try {
      await debuggerRef.current?.stopProfiling();
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error }));
    }
  };

  // Remote Device Management
  const scanForDevices = async () => {
    try {
      return await debuggerRef.current?.scanForDevices();
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error }));
      return [];
    }
  };

  const flashDevice = async (deviceId: string, firmware: Buffer) => {
    try {
      await debuggerRef.current?.flashDevice(deviceId, firmware);
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error }));
    }
  };

  return {
    ...state,
    startDebugSession,
    stopDebugSession,
    setBreakpoint,
    removeBreakpoint,
    continue: continue_,
    pause,
    stepOver,
    stepInto,
    stepOut,
    evaluate,
    startProfiling,
    stopProfiling,
    scanForDevices,
    flashDevice
  };
}

export default useDebugger;
