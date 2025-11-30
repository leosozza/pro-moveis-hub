// useProjects Hook
// React hook for fetching projects

import { useQuery } from '@tanstack/react-query';
import { listProjects, getProjectById } from '../services/projects.service';

export const useProjects = () => {
  const query = useQuery({
    queryKey: ['projects'],
    queryFn: listProjects,
  });

  return {
    projects: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

export const useProject = (projectId?: string) => {
  const query = useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => getProjectById(projectId!),
    enabled: !!projectId,
  });

  return {
    project: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
