import { useState, useEffect, useCallback } from 'react';
import { Environment, Package, EnvironmentService } from '../services/EnvironmentService';

interface UseEnvironmentOptions {
  onError?: (error: Error) => void;
}

export function useEnvironment(options: UseEnvironmentOptions = {}) {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [activeEnvironment, setActiveEnvironment] = useState<Environment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const environmentService = new EnvironmentService();

  const handleError = useCallback((error: Error) => {
    setError(error);
    if (options.onError) {
      options.onError(error);
    }
  }, [options.onError]);

  const loadEnvironments = useCallback(async () => {
    setLoading(true);
    try {
      const envs = await environmentService.listEnvironments();
      setEnvironments(envs);
      const active = envs.find(env => env.isActive);
      if (active) {
        setActiveEnvironment(active);
      }
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('Failed to load environments'));
    } finally {
      setLoading(false);
    }
  }, [environmentService, handleError]);

  const createEnvironment = useCallback(async (
    name: string,
    type: 'conda' | 'virtualenv' | 'poetry' | 'pipenv',
    pythonVersion: string,
    packages?: string[]
  ) => {
    setLoading(true);
    try {
      const env = await environmentService.createEnvironment({
        name,
        type,
        python_version: pythonVersion,
        packages
      });
      setEnvironments(prevEnvs => [...prevEnvs, env]);
      return env;
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('Failed to create environment'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [environmentService, handleError]);

  const activateEnvironment = useCallback(async (envId: string) => {
    setLoading(true);
    try {
      await environmentService.activateEnvironment(envId);
      const env = environments.find(e => e.id === envId);
      if (env) {
        setActiveEnvironment(env);
        setEnvironments(prevEnvs =>
          prevEnvs.map(e => ({
            ...e,
            isActive: e.id === envId
          }))
        );
      }
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('Failed to activate environment'));
    } finally {
      setLoading(false);
    }
  }, [environmentService, environments, handleError]);

  const installPackages = useCallback(async (
    envId: string,
    packages: string[]
  ) => {
    setLoading(true);
    try {
      const env = environments.find(e => e.id === envId);
      if (!env) {
        throw new Error('Environment not found');
      }
      await environmentService.installPackages(env.type, env.path, packages);
      await loadEnvironments(); // Refresh environment list to get updated packages
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('Failed to install packages'));
    } finally {
      setLoading(false);
    }
  }, [environmentService, environments, loadEnvironments, handleError]);

  const uninstallPackages = useCallback(async (
    envId: string,
    packages: string[]
  ) => {
    setLoading(true);
    try {
      const env = environments.find(e => e.id === envId);
      if (!env) {
        throw new Error('Environment not found');
      }
      await environmentService.uninstallPackages(env.type, env.path, packages);
      await loadEnvironments(); // Refresh environment list to get updated packages
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('Failed to uninstall packages'));
    } finally {
      setLoading(false);
    }
  }, [environmentService, environments, loadEnvironments, handleError]);

  const updatePackages = useCallback(async (
    envId: string,
    packages: string[]
  ) => {
    setLoading(true);
    try {
      const env = environments.find(e => e.id === envId);
      if (!env) {
        throw new Error('Environment not found');
      }
      await environmentService.updatePackages(env.type, env.path, packages);
      await loadEnvironments(); // Refresh environment list to get updated packages
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('Failed to update packages'));
    } finally {
      setLoading(false);
    }
  }, [environmentService, environments, loadEnvironments, handleError]);

  const exportEnvironment = useCallback(async (
    envId: string,
    format: 'requirements.txt' | 'environment.yml'
  ) => {
    setLoading(true);
    try {
      const path = await environmentService.exportEnvironment(envId, format);
      return path;
    } catch (err) {
      handleError(err instanceof Error ? err : new Error('Failed to export environment'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [environmentService, handleError]);

  useEffect(() => {
    loadEnvironments();
  }, [loadEnvironments]);

  return {
    environments,
    activeEnvironment,
    loading,
    error,
    createEnvironment,
    activateEnvironment,
    installPackages,
    uninstallPackages,
    updatePackages,
    exportEnvironment,
    refreshEnvironments: loadEnvironments
  };
}

export default useEnvironment;
