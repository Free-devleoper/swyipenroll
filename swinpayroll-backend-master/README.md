# SwinPayroll Backend

The API that the SwinPayroll Electron app communicates with.

## Running

In the root of the repo, run `yarn` to install dependencies and `yarn start` to actually start the backend (without type checking). `yarn start-dev` runs a live reload server that also type checks the code.

If you just want to compile the backend TypeScript for whatever reason, run `yarn compile`.

## Seeding

Run `yarn seed` to seed the default staff user, which has credentials `staff@desisdaycare.fun` (or optionally this can be passed in as the first argument) and `password`. The email and password of this user should be changed immediately.

## Linting

Run `yarn lint`.

## Environment Variables

Environment variables can be set as normal or optionally by placing an `.env` file in the root of the directory with a KEY=VALUE format on each line.

`DB_HOST`: the host to connect to MySQL on. Defaults to `localhost`. If a non-default port is used, this should be specified with `:$port`.

`DB_NAME`: the name of the MySQL database. Defaults to `desis_portal`.

`DB_PASS`: the MySQL user password. Defaults to empty string.

`DB_USERNAME` the MySQL username. Defaults to `root`.

`PORT`: the port that the HTTP server will run on. Defaults to `8080`.

`TOKEN_SECRET`: the secret used to sign JWT auth tokens. Must be set.
