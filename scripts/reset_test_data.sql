-- Reset all test registrations, payments, attendance, and dispatch records.
-- NOTE: Delete order matters due to foreign key constraints.
-- Do NOT include events, admin_users, or event_coordinators — those are seeded config tables, not test data.

BEGIN;
DELETE FROM attendance;
DELETE FROM passport_dispatch;
DELETE FROM team_payments;
DELETE FROM event_registrations;
DELETE FROM team_members;
DELETE FROM teams;
COMMIT;
