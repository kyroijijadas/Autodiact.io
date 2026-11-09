import { client } from './client';

export const getMyProfessorApplications = () =>
  client.get('/professor-applications/me');

export const applyForProfessorSubject = (subject) =>
  client.post('/professor-applications', { subject });

export const getProfessorApplications = () =>
  client.get('/admin/professor-applications');

export const reviewProfessorApplication = (applicationId, action) =>
  client.patch(`/admin/professor-applications/${applicationId}/${action}`);
