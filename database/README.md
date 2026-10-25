# ISP Database

PostgreSQL is the target relational database for the ISP backend. The schema is stored as versioned SQL under `database/schema/` so the database contract is reviewable in Git.

No external database service is connected by this repository yet. The schema is prepared for a future PostgreSQL runtime.
