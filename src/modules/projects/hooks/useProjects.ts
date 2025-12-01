/**
 * useProjects Hook
 * Custom hook for fetching and managing projects.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsService } from '../services/projects.service';
import type { CreateProjectInput } from '../types/projects.types';

/**
 * Fetch all projects
 */
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsService.list(),
  });
}

/**
 * Fetch a project by ID
 */
export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsService.getById(projectId!),
    enabled: !!projectId,
  });
}

/**
 * Fetch projects for selection
 */
export function useProjectsForSelection() {
  return useQuery({
    queryKey: ['projects_selection'],
    queryFn: () => projectsService.listForSelection(),
  });
}

/**
 * Create a new project
 */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProjectInput) => projectsService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects_selection'] });
    },
  });
}
