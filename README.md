# Autodidact.io

Autodidact.io is a micro-learning and assessment hub. The Express API supports student accounts, published quizzes, server-graded submissions, result history, and professor quiz authoring.

## Basic app flow

1. A visitor registers and becomes a student.
2. The student applies to teach a subject.
3. An admin approves or rejects the application. Approval changes the student's role to professor.
4. The professor creates a quiz for the approved subject. It appears in the student catalog.
5. Students request access to a quiz; its professor approves or rejects the request.
6. Approved students take the quiz and see their server-calculated scores in My scores.

The interface shows only the pages needed for these three roles. Refresh after an application is approved to load the updated role.

## Run the backend with Docker

1. If `.env` does not already exist, copy `.env.example` to `.env` and replace both placeholder secrets with strong local values. Keep your existing `.env` intact and verify it contains `MYSQL_ROOT_PASSWORD` and `JWT_SECRET`.
2. Start the frontend, backend, and database together from the repository root with `docker compose up --build`.

Open the frontend at `http://localhost:5173`; the API is available at `http://localhost:3000`. The frontend's Vite proxy connects to the backend service inside Docker. MySQL Workbench connects to `127.0.0.1:3307` as `root` using `MYSQL_ROOT_PASSWORD`. A new database volume is initialized from `Backend/Database/schema.sql`. Existing database volumes are not overwritten; apply `Backend/Database/migrate_existing_database.sql` to add the latest schema changes. The migration can be run again safely.

## Admin account

The admin account has a fixed username, `admin`, and is provisioned with a bcrypt-hashed password rather than through public registration. Apply `Backend/Database/migrate_existing_database.sql` first if using an existing database, then from `Backend/` run `node .\scripts\provisionAdmin.js` with `ADMIN_INITIAL_PASSWORD` set to the chosen password in your local environment. The script creates the account or updates the existing `admin` account, and never stores the password in the repository. Re-running it resets that account's password.

Keep the admin password private and do not commit it to `.env`, source files, or shell scripts.

## Professor accounts

Public registration always creates a student account. Students apply for professor access for a subject, and an admin must approve each subject before it can be used. Provision the first admin using the script in the [Admin account](#admin-account) section. Keep at least one active admin account. Never accept role assignments from public registration requests. Existing users are backfilled to their matching profile table during migration; existing professors are migrated with the `General` subject; new professor subjects require admin approval.

The `users` table is the shared login/credential source and canonical role. `student_profiles`, `professor_profiles`, and `admin_profiles` hold role-specific account data and each has a one-to-one relationship with `users`. Use `users.role` when querying accounts and join the matching profile table for role-specific data:

```sql
SELECT u.id, u.username, p.approved_at
FROM professor_profiles p
JOIN users u ON u.id = p.user_id
WHERE u.is_active = TRUE;
```

## API

All request and response bodies use JSON. Browser clients should send credentials so the HttpOnly `accessToken` cookie is included. Configure `FRONTEND_ORIGIN` to the exact frontend origin. Login tokens expire after 15 minutes; log in again when the token expires. Authorization uses the current database role and active status on each request, so role changes and deactivation take effect immediately.

### Authentication

| Method | Path | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/register` | Public | Create a student account (`username`, `password`) |
| `POST` | `/api/login` | Public | Sign in and set the HttpOnly access cookie |
| `POST` | `/api/logout` | Public | Clear the access cookie |
| `GET` | `/api/me` | Signed in | Return the current account |
| `POST` | `/api/professor-applications` | Student or professor | Request approval for a subject (`subject`) |
| `GET` | `/api/professor-applications/me` | Student or professor | List your subject applications |

Passwords must be at least 8 characters and no more than 72 UTF-8 bytes.

### Admin

Every `/api/admin` route requires an active `admin` account.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/admin/professor-applications?status=pending` | List applications, optionally filter by status |
| `PATCH` | `/api/admin/professor-applications/:applicationId/approve` | Approve a subject; first approval promotes the student to professor |
| `PATCH` | `/api/admin/professor-applications/:applicationId/reject` | Reject a subject application |

Admins review professor applications. An applicant only gets professor access after approval; professors can request approval for additional subjects. Admin roles are not assignable through public registration.

### Quizzes

| Method | Path | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/quizzes` | Public | List available quizzes |
| `GET` | `/api/quizzes/mine` | Professor | List the professor's quizzes |
| `POST` | `/api/quizzes` | Professor | Create a quiz that appears in the student catalog |
| `GET` | `/api/quizzes/access/mine` | Signed-in student | List the student's quiz access decisions |
| `POST` | `/api/quizzes/:quizId/access-requests` | Signed-in student | Request professor approval to take a quiz |
| `GET` | `/api/quizzes/access-requests` | Professor | List pending requests for the professor's quizzes |
| `PATCH` | `/api/quizzes/access-requests/:requestId/approve` | Professor | Approve a student for a quiz |
| `PATCH` | `/api/quizzes/access-requests/:requestId/reject` | Professor | Reject a student's quiz access request |

Students can browse active quizzes by subject. They must request access to each quiz, and only its owner professor can approve that request. The server checks approval when an attempt starts. Professors may create quizzes only for subjects an admin has approved for them. Create requests use the following shape. The quiz time limit is set to 15 minutes. Each question needs 2–10 choices and exactly one correct choice.

```json
{
  "title": "PHP Fundamentals",
  "description": "Review core PHP concepts.",
  "subject": "Programming",
  "time_limit_seconds": 900,
  "questions": [
    {
      "text": "What does PDO stand for?",
      "options": [
        { "text": "PHP Data Objects", "is_correct": true },
        { "text": "Personal Database Output", "is_correct": false }
      ]
    }
  ]
}
```

New quizzes appear in the catalog as soon as they are created; students can take them only after the professor approves their request. A rejected request can be submitted again.

### Results

| Method | Path | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/quizzes/:id/attempts` | Signed-in student | Start a timed attempt and receive its server-generated expiry time and question snapshot |
| `GET` | `/api/quizzes/attempts/:id` | Attempt owner | Resume an attempt and retrieve its saved answers |
| `PUT` | `/api/quizzes/attempts/:id/answers` | Attempt owner | Save selected answers before the server-side expiry |
| `POST` | `/api/results` | Signed-in student | Submit an attempt (`attempt_id`) and receive the server-calculated result |
| `GET` | `/api/results` | Signed in | List the current user's result history |

Start the attempt, save answers as the student works, then submit it:

```json
{
  "attempt_id": 12
}
```

Save or update one or more answers:

```json
{
  "answers": [
    { "question_id": 1, "option_id": 1 }
  ]
}
```

The server stores a private snapshot of the quiz at attempt start, enforces expiry using its database clock, and computes the score from saved answers. Answer updates after expiry are rejected; submission after expiry grades previously saved answers and counts unanswered questions as wrong. Repeated submission returns the existing result. Client-supplied scores are never accepted.

## Local backend commands

From `Backend/`, use `npm run dev` for the development server, `npm start` for the production entry point, and `npm test` for backend tests.
