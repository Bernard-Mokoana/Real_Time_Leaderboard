import { apiClient } from "./client";

export type Task = {
  id: string;
  title: string;
  taskType: string;
  xpValue: number;
  completed: boolean;
};

export type TaskAnswer = {
  questionId: string;
  answer: string;
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
    event: {
      xpDelta: number;
    };
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

  async complete(
    taskId: string,
    referenceId: string,
    answers: TaskAnswer[],
  ): Promise<{ awardedXp: number }> {
    const response = await apiClient.post<CompleteTaskResponse>(
      `/tasks/${taskId}/complete`,
      {
        referenceId,
        answers,
      },
    );

    return { awardedXp: response.data.data.event.xpDelta };
  },
};
