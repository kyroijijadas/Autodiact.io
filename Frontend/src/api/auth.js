import { client } from './client';

export const getCurrentUser = () => client.get('/me');

export const login = (username, password) =>
  client.post('/login', { username, password });

export const register = (username, password) =>
  client.post('/register', { username, password });

export const logout = () => client.post('/logout', {});
