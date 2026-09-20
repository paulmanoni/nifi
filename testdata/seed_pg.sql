-- PostgreSQL source fixture: psql -d nifi_src -f testdata/seed_pg.sql (and create an empty nifi_tgt).
CREATE TYPE mood AS ENUM ('sad','ok','happy');
CREATE TABLE users (
  id bigserial PRIMARY KEY, email varchar(120) NOT NULL, name text, active boolean DEFAULT true,
  score numeric(10,2), created_at timestamptz DEFAULT now(), born date, avatar bytea, prefs jsonb,
  tags text[], m mood, ext uuid);
CREATE UNIQUE INDEX users_email_uq ON users(email);
CREATE INDEX users_created ON users(created_at);
CREATE TABLE orders (id serial PRIMARY KEY, user_id bigint REFERENCES users(id) ON DELETE CASCADE, total numeric(12,2), note text, placed timestamp);
CREATE INDEX orders_user ON orders(user_id);
CREATE TABLE tags (code text, lang text, label text, PRIMARY KEY(code, lang));
CREATE TABLE logs (msg text, at timestamptz);
INSERT INTO users (email,name,active,score,created_at,born,avatar,prefs,tags,m,ext)
SELECT 'u'||g||'@x.io', CASE WHEN g%10=0 THEN NULL ELSE E'Name\t'||g||E'\nline' END, g%2=0, g*1.5, now()-g*interval '1 min',
 date '1990-01-01'+g%5000, decode(md5(g::text),'hex'), jsonb_build_object('k',g,'s','v"q'), ARRAY['a'||g,'b'], (ARRAY['sad','ok','happy'])[1+g%3]::mood, gen_random_uuid()
FROM generate_series(1,200000) g;
INSERT INTO orders (user_id,total,note,placed) SELECT 1+g%200000, g*0.25, 'n'||g, now()-g*interval '1 s' FROM generate_series(1,50000) g;
INSERT INTO tags SELECT 'c'||g, l, 'L'||g FROM generate_series(1,3000) g, unnest(ARRAY['en','sw']) l;
INSERT INTO logs SELECT 'm'||g, now() FROM generate_series(1,1000) g;
ANALYZE;
-- Fan-in fixture: two tables with disjoint ids merged into one target.
CREATE TABLE fanin_a (id int PRIMARY KEY, name text NOT NULL, a_only text NOT NULL);
CREATE INDEX fanin_a_name ON fanin_a(name);
CREATE TABLE fanin_b (id int PRIMARY KEY, name text, b_only int NOT NULL);
CREATE INDEX fanin_b_bonly ON fanin_b(b_only);
INSERT INTO fanin_a SELECT g, 'a'||g, 'x' FROM generate_series(1,100) g;
INSERT INTO fanin_b SELECT g, 'b'||g, g FROM generate_series(101,200) g;
