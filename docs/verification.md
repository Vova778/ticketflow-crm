# MVP verification

## Automated checks

- Backend: `npm run build`, `npx tsc --noEmit`, `npm run lint`.
- Backend unit tests: 28 passed.
- Backend HTTP tests: 19 passed (real Nest guards/validation/services, database double).
- Frontend: `npm run build`, `npm run lint`, `npm test` — 17 tests passed.
- Docker: clean dependency installation, production builds, migrations, repeated non-destructive seed and healthy services.
- Live API smoke: JWT, role visibility, ticket CRUD, assignment, comments, filtering, pagination, dashboard and Swagger. Passed against PostgreSQL, including requests through the frontend Nginx `/api` proxy.

## Browser verification

Completed against the Docker application:

- USER login, form validation, ticket creation and title editing.
- Customer comment persisted and appeared in the conversation.
- MANAGER claimed an unassigned ticket and changed its status; state survived reload.
- ADMIN people search, profile save, protection of own role/active state.
- ADMIN changed the role and active state of a temporary test account.
- Registration created a USER account with an empty, correctly scoped dashboard.
- Combined ticket search/status filtering updated the URL and returned the matching ticket.
- Logout returned to login and cleared the prior workspace.
- Mobile ticket view at a 390px viewport: no horizontal page overflow.

The temporary browser test ticket and account were removed after verification. Seed data was preserved.

## Reproduction

```sh
docker compose up -d --build --wait
docker compose exec backend npm run db:seed
docker compose exec backend npm run test:smoke
docker compose exec -e API_URL=http://frontend/api backend npm run test:smoke
```

Open http://localhost:8080 and use the demo credentials in the main README.

The GitHub Actions workflow is committed for future pushes; no remote CI run or public deployment is claimed. Browser checks above were interactive checks, not a committed browser automation suite.
