import { apiClient } from "./client";

export type Task = {
  id: string;
  title: string;
  taskType: string;
  xpValue: number;
  completed: boolean;
};

type TaskListResponse = {
  data: Task[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
};

type CompleteTaskResponse = {
  data: {
    wasAlreadyProcessed: boolean;
  };
};

export const tasksApi = {
  async list(): Promise<Task[]> {
    const response = await apiClient.get<TaskListResponse>("/tasks", {
      params: { limit: 100 },
    });

    return response.data.data;
  },

  async complete(taskId: string, referenceId: string): Promise<void> {
    await apiClient.post<CompleteTaskResponse>(`/tasks/${taskId}/complete`, {
      referenceId,
    });
  },
};
