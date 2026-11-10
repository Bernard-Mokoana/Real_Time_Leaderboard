import type { Task } from "../api/tasks";

type TasksProps = {
  tasks: Task[] | null;
  loading: boolean;
  error: string | null;
  completingTaskId: string | null;
  onSelect: (task: Task) => void;
};

export function Tasks({
  tasks,
  loading,
  error,
  completingTaskId,
  onSelect,
}: TasksProps) {
  return (
    <section className="tasks" aria-labelledby="tasks-heading">
      <h2 id="tasks-heading">Tasks</h2>

      {loading && <p role="status">Loading tasks...</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && tasks?.length === 0 && <p className="empty-state">No tasks yet.</p>}

      {tasks && tasks.length > 0 && (
        <ul className="task-list">
          {tasks.map((task) => {
            const completing = completingTaskId === task.id;

            return (
              <li key={task.id} className="task-item">
                <div>
                  <h3>{task.title}</h3>
                  <p>
                    {task.taskType} · {task.xpValue} XP
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onSelect(task)}
                  disabled={task.completed || completing}
                >
                  {task.completed
                    ? "Completed"
                    : completing
                      ? "Completing..."
                      : "Start task"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
