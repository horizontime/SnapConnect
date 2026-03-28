BEGIN;

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS about TEXT,
    ADD COLUMN IF NOT EXISTS favorite_woods TEXT[] DEFAULT '{}'::text[],
    ADD COLUMN IF NOT EXISTS favorite_tools TEXT[] DEFAULT '{}'::text[],
    ADD COLUMN IF NOT EXISTS favorite_projects TEXT[] DEFAULT '{}'::text[];

COMMIT; 