# Frontend

The React app uses Vite and Tailwind CSS. Its `/api` requests are proxied to the Express backend during development.

## Main flow

1. A new account starts as a student.
2. The student applies to teach a subject.
3. An admin approves or declines the application.
4. An approved student becomes a professor and can create quizzes for the approved subject.
5. Students browse available subjects and request access to individual quizzes.
6. The quiz's professor approves or rejects each request.
7. Approved students take the quiz and see their scores.

After an application is approved, refresh the page to load the updated role.

## Where to start

- `src/App.jsx` loads the current role's data and connects page actions to API calls.
- `src/context/AuthContext.jsx` handles sign-in, registration, and the current account.
- `src/pages/NavRoutes.jsx` selects the page for the current role.
- `src/api` contains small modules for authentication, quizzes, professor applications, attempts, and results.
- `src/components` contains the forms and shared layout used by those pages.

Run `npm run dev` from this folder to start the frontend.
