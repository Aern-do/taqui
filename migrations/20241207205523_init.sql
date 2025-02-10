CREATE TABLE users (
  id uuid NOT NULL PRIMARY KEY DEFAULT (gen_random_uuid()),
  username varchar NOT NULL,
  password_hash text NOT NULL,
  created_at timestamp NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')
);

CREATE TABLE groups (
  id uuid NOT NULL PRIMARY KEY DEFAULT (gen_random_uuid()),
  owner_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name varchar NOT NULL,
  created_at timestamp NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')
);  

CREATE TABLE members (
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES groups (id) ON DELETE CASCADE,
  joined_at timestamp NOT NULL DEFAULT (now() AT TIME ZONE 'UTC'),

  PRIMARY KEY(user_id, group_id)
);

CREATE TABLE messages (
  id uuid NOT NULL PRIMARY KEY DEFAULT (gen_random_uuid()),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES groups (id) ON DELETE CASCADE,
  content varchar NOT NULL,
  created_at timestamp NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')
);

CREATE TABLE invites (
  id uuid NOT NULL PRIMARY KEY DEFAULT (gen_random_uuid()),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES groups (id) ON DELETE CASCADE,
  created_at timestamp NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')
);
