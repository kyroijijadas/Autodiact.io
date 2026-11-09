import { client } from './client';

export const startAttempt = (quizId) =>
  client.post(`/quizzes/${quizId}/attempts`, {});

export const saveAttemptAnswers = (attemptId, answers) =>
  client.put(`/quizzes/attempts/${attemptId}/answers`, { answers });
