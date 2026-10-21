# Full Stack Open: GraphQL

A MongoDB-backed library with an Apollo GraphQL API and a React frontend.

## Implemented features

- Author and book queries, counts, combined author/genre filtering and validated mutations.
- MongoDB models, unique names and titles, user registration, JWT login and authenticated changes.
- Author birth-year editing, genre filters, favorite-genre recommendations and visible request errors.
- `bookAdded` WebSocket subscriptions; other clients refresh author counts and filtered book lists when books are added.
- Shared query fragments and constant-query author book counts using one aggregate query rather than a query per author.

## Run locally

Use Node.js 24. Run `npm ci` in both `library-backend` and `library-frontend`. Copy the backend `.env.example` to `.env`, configure a development database and replace the example JWT secret. In the backend, `npm run seed` loads the supplied author/book sample only when the database is empty. Run `npm run dev` in each application. HTTP GraphQL is at `http://localhost:4000`; subscriptions use `ws://localhost:4000/graphql`.

Create a user with the `createUser(username, favoriteGenre)` mutation. As specified by this course exercise, all users share password `secret`; this is an educational authentication model, not a production credential system. `COURSE_PASSWORD` can override it for a private local demonstration. Do not expose the exercise as a production account service.

## Verification

The supplied assertions in `tests-chapter4` and `tests-chapter5` are unchanged. Run `npm ci && npm test` in `tests-chapter4`. For browser tests, run `npm ci`, `npx playwright install chromium --with-deps`, then `npx playwright test` in `tests-chapter5`. These create temporary local MongoDB instances. The reset mutation is only present with `NODE_ENV=test`, and test-mode startup requires a loopback database URI.

The frontend provides `npm run lint` and `npm run build`. Additional integration checks cover cross-client subscriptions and filtered caches beyond the supplied chapter-5 checks.

## Sources and assistance

Starter code, sample data and supplied tests: [fullstack-hy2020/fs-graphql](https://github.com/fullstack-hy2020/fs-graphql). Requirements: [Full Stack Open GraphQL](https://courses.mooc.fi/org/uh-cs/courses/full-stack-open-graphql).

AI assistance was used to implement, revise and test this code. This repository does not claim personal reading, study hours, assessment completion or course credit. Understanding and reviewing submitted work remains the student's responsibility.
