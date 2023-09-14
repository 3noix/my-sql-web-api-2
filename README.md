## my-sql-web-api-2

This repository is a demo. On the back-end side there is a MySQL database with one table names "Entries" that includes 4 fields:
- `id`: the id of the "entry" (managed by the database)
- `description`: a string field
- `number`: a numeric field
- `last modif`: the date/time of the last modification (managed by the database)

The clients can insert a new entry, remove one or update one. When another client does one of these modifications, the api notifies all the clients through web sockets. All this repository is implement in Typescript. The api and the clients uses TRPC to communicate.

Here is a summary of the content:
- `api-express-drizzle`: a back-end application written in Typescript and using Drizzle ORM, express for HTTP server and ws for web sockets, and of course TRPC
- `client-vanilla`: a client application written in Typescript, using TRPC and Vite
- `client-react`: a client application written in Typescript, using TRPC, React, React Query and Vite

Remark: in "api-express-drizzle/src/db/main.sql" you will find code to initialize the database.
