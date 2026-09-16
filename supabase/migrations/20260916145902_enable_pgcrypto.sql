-- Requis pour gen_random_uuid(), utilisé comme valeur par défaut des
-- colonnes id (uuid) des tables métier à venir.
create extension if not exists pgcrypto with schema extensions;
