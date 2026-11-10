export type QuizQuestion = {
  id: string;
  prompt: string;
  options: { value: string; label: string }[];
};

// Keep these IDs and option values aligned with the server-side answer key.
export const taskQuizQuestions: QuizQuestion[] = [
  {
    id: "html-purpose",
    prompt: "What is HTML primarily used for?",
    options: [
      { value: "structure", label: "Structuring web content" },
      { value: "database", label: "Storing application data" },
      { value: "server", label: "Running a web server" },
    ],
  },
  {
    id: "css-purpose",
    prompt: "What is CSS primarily used for?",
    options: [
      { value: "styling", label: "Styling and laying out pages" },
      { value: "queries", label: "Querying a database" },
      { value: "routing", label: "Defining API routes" },
    ],
  },
  {
    id: "javascript-purpose",
    prompt: "Which language commonly adds interactivity to a web page?",
    options: [
      { value: "javascript", label: "JavaScript" },
      { value: "sql", label: "SQL" },
      { value: "css", label: "CSS" },
    ],
  },
  {
    id: "http-success",
    prompt: "Which HTTP status code means a request succeeded?",
    options: [
      { value: "200", label: "200" },
      { value: "404", label: "404" },
      { value: "500", label: "500" },
    ],
  },
  {
    id: "accessibility",
    prompt: "Which practice improves a form's accessibility?",
    options: [
      { value: "labels", label: "Associate labels with inputs" },
      { value: "placeholders", label: "Use placeholders instead of labels" },
      { value: "color", label: "Use color as the only instruction" },
    ],
  },
];
