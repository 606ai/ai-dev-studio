import { useEffect, useRef, useState } from 'react';
import GitService, { GitConfig, GitDiff } from '../services/GitService';

interface GitState {
  isLoading: boolean;
  error: Error | null;
  status: any | null;
  history: any[] | null;
  currentBranch: string | null;
  diffs: GitDiff[] | null;
}

export function useGitService(workingDirectory: string, config?: GitConfig) {
  const gitServiceRef = useRef<GitService | null>(null);
  const [state, setState] = useState<GitState>({
    isLoading: false,
    error: null,
    status: null,
    history: null,
    currentBranch: null,
    diffs: null
  });

  useEffect(() => {
    gitServiceRef.current = new GitService(workingDirectory, config);

    const handleError = (error: Error) => {
      setState(prev => ({ ...prev, error, isLoading: false }));
    };

    const handleStateChange = (event: string, data: any) => {
      setState(prev => {
        switch (event) {
          case 'status-checked':
            return { ...prev, status: data, isLoading: false };
          case 'history-fetched':
            return { ...prev, history: data.all, isLoading: false };
          case 'branch-switched':
            return { ...prev, currentBranch: data, isLoading: false };
          case 'diff-generated':
            return { ...prev, diffs: data, isLoading: false };
          default:
            return prev;
        }
      });
    };

    gitServiceRef.current.onError(handleError);
    gitServiceRef.current.onStateChange(handleStateChange);

    return () => {
      gitServiceRef.current = null;
    };
  }, [workingDirectory]);

  const initRepo = async () => {
    if (!gitServiceRef.current) return;
    setState(prev => ({ ...prev, isLoading: true }));
    await gitServiceRef.current.initRepo();
  };

  const cloneRepo = async (url: string, directory?: string) => {
    if (!gitServiceRef.current) return;
    setState(prev => ({ ...prev, isLoading: true }));
    await gitServiceRef.current.cloneRepo(url, directory);
  };

  const createBranch = async (branchName: string) => {
    if (!gitServiceRef.current) return;
    setState(prev => ({ ...prev, isLoading: true }));
    await gitServiceRef.current.createBranch(branchName);
  };

  const switchBranch = async (branchName: string) => {
    if (!gitServiceRef.current) return;
    setState(prev => ({ ...prev, isLoading: true }));
    await gitServiceRef.current.switchBranch(branchName);
  };

  const stageFiles = async (files: string[]) => {
    if (!gitServiceRef.current) return;
    setState(prev => ({ ...prev, isLoading: true }));
    await gitServiceRef.current.stageFiles(files);
  };

  const unstageFiles = async (files: string[]) => {
    if (!gitServiceRef.current) return;
    setState(prev => ({ ...prev, isLoading: true }));
    await gitServiceRef.current.unstageFiles(files);
  };

  const commit = async (message: string) => {
    if (!gitServiceRef.current) return;
    setState(prev => ({ ...prev, isLoading: true }));
    await gitServiceRef.current.commit(message);
  };

  const push = async (remote?: string, branch?: string) => {
    if (!gitServiceRef.current) return;
    setState(prev => ({ ...prev, isLoading: true }));
    await gitServiceRef.current.push(remote, branch);
  };

  const pull = async (remote?: string, branch?: string) => {
    if (!gitServiceRef.current) return;
    setState(prev => ({ ...prev, isLoading: true }));
    await gitServiceRef.current.pull(remote, branch);
  };

  const getDiff = async (filepath?: string) => {
    if (!gitServiceRef.current) return;
    setState(prev => ({ ...prev, isLoading: true }));
    await gitServiceRef.current.getDiff(filepath);
  };

  const createPullRequest = async (title: string, body: string, base: string, head: string) => {
    if (!gitServiceRef.current) return;
    setState(prev => ({ ...prev, isLoading: true }));
    await gitServiceRef.current.createPullRequest(title, body, base, head);
  };

  const refreshStatus = async () => {
    if (!gitServiceRef.current) return;
    setState(prev => ({ ...prev, isLoading: true }));
    await gitServiceRef.current.getStatus();
  };

  const refreshHistory = async (branch?: string) => {
    if (!gitServiceRef.current) return;
    setState(prev => ({ ...prev, isLoading: true }));
    await gitServiceRef.current.getCommitHistory(branch);
  };

  return {
    ...state,
    initRepo,
    cloneRepo,
    createBranch,
    switchBranch,
    stageFiles,
    unstageFiles,
    commit,
    push,
    pull,
    getDiff,
    createPullRequest,
    refreshStatus,
    refreshHistory
  };
}

export default useGitService;
