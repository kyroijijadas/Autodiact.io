import { client } from './client';

export const getPublishedQuizzes = () => client.get('/quizzes');

export const getMyQuizzes = () => client.get('/quizzes/mine');

export const createQuiz = (payload) => client.post('/quizzes', payload);

export const getMyQuizAccess = () => client.get('/quizzes/access/mine');

export const requestQuizAccess = (quizId) =>
  client.post(`/quizzes/${quizId}/access-requests`, {});

export const getProfessorQuizAccessRequests = () =>
  client.get('/quizzes/access-requests');

export const reviewQuizAccessRequest = (requestId, action) =>
  client.patch(`/quizzes/access-requests/${requestId}/${action}`);
