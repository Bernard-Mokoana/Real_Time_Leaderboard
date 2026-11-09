export type TaskRow = {
  id: string;
  title: string;
  task_type: string;
  xp_value: number;
};

export type Task = {
  id: string;
  title: string;
  taskType: string;
  xpValue: number;
};

export type TaskWithStatusRow = TaskRow & {
  completed: boolean;
};

export type TaskWithStatus = {
  completed: boolean;
};
