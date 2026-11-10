import { AppError } from "../errors/app_errors.js";
import type { QuizAnswer } from "../types/task.js";

const correctAnswers: Record<string, string> = {
  "html-purpose": "structure",
  "css-purpose": "styling",
  "javascript-purpose": "javascript",
  "http-success": "200",
  accessibility: "labels",
};

export const scoreTaskQuiz = (answers: QuizAnswer[]): number => {
  const submitted = new Map(
    answers.map(({ questionId, answer }) => [questionId, answer]),
  );
  const questionIds = Object.keys(correctAnswers);

  if (
    submitted.size !== questionIds.length ||
    questionIds.some((questionId) => !submitted.has(questionId))
  ) {
    throw new AppError({
      statusCode: 400,
      code: "INVALID_QUIZ_ANSWERS",
      message: "All quiz questions must be answered exactly once.",
    });
  }

  return questionIds.filter(
    (questionId) => submitted.get(questionId) === correctAnswers[questionId],
  ).length;
};
