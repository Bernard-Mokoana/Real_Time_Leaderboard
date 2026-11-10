import { useState, type FormEvent } from "react";
import type { Task } from "../api/tasks";
import { taskQuizQuestions } from "../quiz";

type TaskQuizProps = {
  task: Task;
  completing: boolean;
  error: string | null;
  onCancel: () => void;
  onComplete: (answers: Record<string, string>) => Promise<{ awardedXp: number }>;
};

export function TaskQuiz({
  task,
  completing,
  error,
  onCancel,
  onComplete,
}: TaskQuizProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [award, setAward] = useState<number | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const result = await onComplete(answers);
      setAward(result.awardedXp);
    } catch {
      // The parent supplies the user-facing error message.
    }
  };

  if (award !== null) {
    return (
      <section className="task-quiz" aria-labelledby="task-quiz-heading">
        <h2 id="task-quiz-heading">Task complete</h2>
        <p>You earned {award} XP.</p>
        <button type="button" onClick={onCancel}>
          Return to tasks
        </button>
      </section>
    );
  }

  return (
    <section className="task-quiz" aria-labelledby="task-quiz-heading">
      <button
        className="back-button"
        type="button"
        onClick={onCancel}
        disabled={completing}
      >
        ← All tasks
      </button>
      <h2 id="task-quiz-heading">{task.title}</h2>
      <p>Answer all five questions. You can earn up to {task.xpValue} XP.</p>

      <form onSubmit={handleSubmit}>
        <ol className="question-list">
          {taskQuizQuestions.map((question) => (
            <li key={question.id}>
              <fieldset disabled={completing}>
                <legend>{question.prompt}</legend>
                {question.options.map((option) => (
                  <label key={option.value} className="answer-option">
                    <input
                      type="radio"
                      name={question.id}
                      value={option.value}
                      checked={answers[question.id] === option.value}
                      onChange={() =>
                        setAnswers((currentAnswers) => ({
                          ...currentAnswers,
                          [question.id]: option.value,
                        }))
                      }
                      required
                    />
                    {option.label}
                  </label>
                ))}
              </fieldset>
            </li>
          ))}
        </ol>
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={completing}>
          {completing ? "Submitting..." : "Submit answers"}
        </button>
      </form>
    </section>
  );
}
