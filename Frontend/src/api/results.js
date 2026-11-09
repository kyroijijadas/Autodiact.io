import { client } from './client';

export const getResults = () => client.get('/results');

export const submitAttempt = (attemptId) =>
  client.post('/results', { attempt_id: attemptId });
