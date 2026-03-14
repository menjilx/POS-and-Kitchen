SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict JZEryZwL5y7dTDRGDZ8PjL3P8GT962eam5Mgd0xXjGkpV4cONvOTrD2m4QHkTRd

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 'authenticated', 'authenticated', 'menjilx@gmail.com', '$2a$10$nqPxmp4URn3LN00v9hxQPOpCD..NVQzGu8/gl5CkBgkikbmf8fRla', '2026-01-10 16:28:29.800002+00', NULL, '', '2026-01-10 16:28:13.19276+00', '', NULL, '', '', NULL, '2026-01-14 06:05:44.813411+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "1b0f2dc2-08bf-492e-89e1-ce08de558f74", "role": "owner", "email": "menjilx@gmail.com", "status": "active", "full_name": "Menj", "email_verified": true, "phone_verified": false}', NULL, '2026-01-10 16:28:13.172775+00', '2026-01-14 06:05:44.86126+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('1b0f2dc2-08bf-492e-89e1-ce08de558f74', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', '{"sub": "1b0f2dc2-08bf-492e-89e1-ce08de558f74", "role": "owner", "email": "menjilx@gmail.com", "status": "active", "full_name": "Menj", "email_verified": true, "phone_verified": false}', 'email', '2026-01-10 16:28:13.185967+00', '2026-01-10 16:28:13.186012+00', '2026-01-10 16:28:13.186012+00', '4581dbde-8611-4f4d-abbf-70f8e52b6bc9');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: app_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

TRUNCATE TABLE public.app_settings;

INSERT INTO "public"."app_settings" ("id", "key", "value", "value_type", "description", "category", "options", "is_encrypted", "created_at", "updated_at") VALUES
	('03b6cd04-90a1-4bb8-a1e6-8185ed097b7b', 'opening_time', '08:00', 'string', 'Default opening time', 'restaurant', NULL, false, '2026-01-10 15:18:05.00679+00', '2026-01-12 09:09:03.09833+00'),
	('fc53dd30-c8be-4789-9a4b-c97e77c3891c', 'password_require_uppercase', 'true', 'boolean', 'Require uppercase letter', 'security', NULL, false, '2026-01-10 15:18:05.00679+00', '2026-01-12 09:09:03.09833+00'),
	('333855a4-478c-4fc8-a8d6-d126d35539a4', 'password_require_number', 'true', 'boolean', 'Require number', 'security', NULL, false, '2026-01-10 15:18:05.00679+00', '2026-01-12 09:09:03.09833+00'),
	('5e24e9b2-becb-456e-a25f-85901e161de6', 'password_require_special', 'false', 'boolean', 'Require special character', 'security', NULL, false, '2026-01-10 15:18:05.00679+00', '2026-01-12 09:09:03.09833+00'),
	('1a8c0822-f66b-4772-848c-2d24f7bf311b', 'max_login_attempts', '5', 'number', 'Max failed login attempts before lockout', 'security', NULL, false, '2026-01-10 15:18:05.00679+00', '2026-01-12 09:09:03.09833+00'),
	('70a3a041-715a-4ba2-bce5-baf85885a31d', 'lockout_duration', '15', 'number', 'Account lockout duration in minutes', 'security', NULL, false, '2026-01-10 15:18:05.00679+00', '2026-01-12 09:09:03.09833+00'),
	('fd2cfb1b-db6f-49d9-a748-d5bd34aa8966', 'app_name', 'Kitchen System', 'string', 'Application name displayed in UI', 'general', NULL, false, '2026-01-10 15:18:05.00679+00', '2026-01-12 09:30:13.357171+00'),
	('82e00012-1669-42b5-b3bd-9e56e03d17ef', 'currency', 'PHP', 'string', 'Default currency', 'general', '{"options": ["USD", "AED", "ARS", "AUD", "BRL", "CAD", "CHF", "CLP", "CNY", "COP", "CZK", "DKK", "EGP", "EUR", "GBP", "HKD", "HUF", "IDR", "ILS", "INR", "JPY", "KRW", "MXN", "MYR", "NGN", "NOK", "NZD", "PHP", "PKR", "PLN", "RUB", "SAR", "SEK", "SGD", "THB", "TRY", "TWD", "UAH", "VND", "ZAR"]}', false, '2026-01-10 15:18:05.00679+00', '2026-01-12 09:30:13.357171+00'),
	('59b9cb29-13f5-45c9-9c40-6f51c73b053a', 'language', '"en"', 'string', 'Default language', 'general', '{"options": ["en", "es", "fr", "de", "zh", "ja", "ko"]}', false, '2026-01-10 15:18:05.00679+00', '2026-01-12 09:30:13.357171+00'),
	('1ba04af9-b58c-49bf-b27e-8a5ff0913a8c', 'date_format', '"MM/DD/YYYY"', 'string', 'Date display format', 'general', '{"options": ["YYYY-MM-DD", "MM/DD/YYYY", "DD/MM/YYYY", "YYYY/MM/DD"]}', false, '2026-01-10 15:18:05.00679+00', '2026-01-12 09:30:13.357171+00'),
	('8c4114d8-7c8f-4d3b-801c-f2cf2fad4bbf', 'time_format', '12h', 'string', 'Time display format', 'general', '{"options": ["12h", "24h"]}', false, '2026-01-10 15:18:05.00679+00', '2026-01-12 09:30:13.357171+00'),
	('d8722bf9-6702-496a-8583-ebebc3b58f4b', 'tax_rate', '0', 'number', 'Default tax rate percentage', 'business', NULL, false, '2026-01-10 15:18:05.00679+00', '2026-01-12 09:09:03.09833+00'),
	('cbdada7d-9bf3-4264-a55e-30554f8c7dc8', 'low_stock_threshold', '10', 'number', 'Default low stock alert threshold', 'business', NULL, false, '2026-01-10 15:18:05.00679+00', '2026-01-12 09:09:03.09833+00'),
	('c47e7730-32ee-4fb3-99ad-dc69938c945c', 'currency_symbol_position', 'before', 'string', 'Position of currency symbol', 'business', '{"options": ["before", "after"]}', false, '2026-01-10 15:18:05.00679+00', '2026-01-12 09:09:03.09833+00'),
	('cdc84e52-33f9-4b37-8040-03095655cf50', 'mfa_enforced', 'false', 'boolean', 'Enforce Multi-Factor Authentication', 'security', NULL, false, '2026-01-12 08:58:16.994982+00', '2026-01-12 09:09:03.09833+00'),
	('f9816337-b596-432f-ae66-d2d2482e01af', 'password_expiry_days', '90', 'number', 'Password expiration in days (0 to disable)', 'security', NULL, false, '2026-01-12 08:58:16.994982+00', '2026-01-12 09:09:03.09833+00'),
	('c323d72b-db66-41cd-984a-480d6902805e', 'timezone', 'Asia/Singapore', 'string', 'Default timezone for the application', 'general', '{"options": ["UTC", "Africa/Cairo", "Africa/Johannesburg", "Africa/Lagos", "America/Anchorage", "America/Argentina/Buenos_Aires", "America/Bogota", "America/Caracas", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Mexico_City", "America/New_York", "America/Phoenix", "America/Sao_Paulo", "America/Toronto", "America/Vancouver", "Asia/Bangkok", "Asia/Dubai", "Asia/Hong_Kong", "Asia/Jakarta", "Asia/Kolkata", "Asia/Kuala_Lumpur", "Asia/Manila", "Asia/Riyadh", "Asia/Seoul", "Asia/Shanghai", "Asia/Singapore", "Asia/Taipei", "Asia/Tokyo", "Australia/Adelaide", "Australia/Brisbane", "Australia/Melbourne", "Australia/Perth", "Australia/Sydney", "Europe/Amsterdam", "Europe/Athens", "Europe/Berlin", "Europe/Brussels", "Europe/Budapest", "Europe/Copenhagen", "Europe/Dublin", "Europe/Helsinki", "Europe/Istanbul", "Europe/Lisbon", "Europe/London", "Europe/Madrid", "Europe/Moscow", "Europe/Oslo", "Europe/Paris", "Europe/Prague", "Europe/Rome", "Europe/Stockholm", "Europe/Vienna", "Europe/Warsaw", "Europe/Zurich", "Pacific/Auckland", "Pacific/Fiji", "Pacific/Honolulu"]}', false, '2026-01-10 15:18:05.00679+00', '2026-01-12 09:30:13.357171+00'),
	('5ea0cdc1-c6f5-4b49-a29e-e3d7779631d1', 'kds_auto_refresh', '20', 'number', 'Auto-refresh interval in seconds', 'kds', NULL, false, '2026-01-10 15:18:05.00679+00', '2026-01-12 09:33:00.855718+00'),
	('7f1e8a38-3921-48ed-9bc4-5836236ac893', 'kds_order_timeout', '30', 'number', 'Order timeout alert in minutes', 'kds', '{"unit": "minutes"}', false, '2026-01-10 15:18:05.00679+00', '2026-01-12 09:33:00.855718+00'),
	('8ee7f1ee-a18c-43ef-bb0c-737379b17e61', 'kds_show_completed', 'true', 'boolean', 'Show completed orders in KDS', 'kds', NULL, false, '2026-01-10 15:18:05.00679+00', '2026-01-12 09:33:00.855718+00'),
	('aa1e4b4a-4618-48a7-9471-27babe2bb39a', 'kds_completed_duration', '60', 'number', 'Show completed orders for (seconds)', 'kds', NULL, false, '2026-01-10 15:18:05.00679+00', '2026-01-12 09:33:00.855718+00'),
	('399c3b25-0666-4dfc-81f3-2547c354c758', 'order_alerts', 'true', 'boolean', 'Enable new order email alerts', 'notifications', NULL, false, '2026-01-10 15:18:05.00679+00', '2026-01-12 09:33:18.249691+00'),
	('6b7cf18c-1ba5-40a1-8a53-7b2024c21352', 'low_stock_alerts', 'true', 'boolean', 'Enable low stock email alerts', 'notifications', NULL, false, '2026-01-10 15:18:05.00679+00', '2026-01-12 09:33:18.249691+00'),
	('59564e3d-ad2c-4dbe-9a70-65aced8d095f', 'daily_sales_report', 'true', 'boolean', 'Enable daily sales report email', 'notifications', NULL, false, '2026-01-10 15:18:05.00679+00', '2026-01-12 09:33:18.249691+00'),
	('fd4eb2c6-b774-46b2-8f1c-f38371b376d4', 'email_notifications', 'true', 'boolean', 'Enable email notifications', 'notifications', NULL, false, '2026-01-10 15:18:05.00679+00', '2026-01-12 09:33:18.249691+00'),
	('78d7b939-9c89-490e-a261-fed4a7cd9c84', 'report_recipient_email', 'stratbithq@gmail.com', 'string', 'Email for sales reports', 'notifications', NULL, false, '2026-01-10 15:18:05.00679+00', '2026-01-12 09:33:18.249691+00'),
	('e5f0d8c4-55fa-4e22-a35c-83a864e3350a', 'closing_time', '22:00', 'string', 'Default closing time', 'restaurant', NULL, false, '2026-01-10 15:18:05.00679+00', '2026-01-12 09:09:03.09833+00'),
	('1608e484-6c24-4cd2-b630-b3bbed335d96', 'reservation_duration', '90', 'number', 'Default reservation duration in minutes', 'restaurant', NULL, false, '2026-01-10 15:18:05.00679+00', '2026-01-12 09:09:03.09833+00'),
	('2678aa4f-8f3e-480c-ab6f-26a8ebe898b5', 'max_party_size', '10', 'number', 'Maximum party size for reservations', 'restaurant', NULL, false, '2026-01-10 15:18:05.00679+00', '2026-01-12 09:09:03.09833+00'),
	('37cdd26e-85df-463f-b9da-39de4c112a45', 'table_prefix', 'T', 'string', 'Prefix for table names', 'restaurant', NULL, false, '2026-01-10 15:18:05.00679+00', '2026-01-12 09:09:03.09833+00'),
	('5622c071-e29c-4ad9-aa23-3aecce2cc533', 'smtp_host', '', 'string', 'SMTP server host', 'smtp', NULL, false, '2026-01-10 15:18:05.00679+00', '2026-01-12 09:09:03.09833+00'),
	('609b9c35-bff4-44c5-9cd7-daddfe418502', 'smtp_port', '587', 'number', 'SMTP server port', 'smtp', NULL, false, '2026-01-10 15:18:05.00679+00', '2026-01-12 09:09:03.09833+00'),
	('1a47a5a6-d0e4-4a1c-8431-1d5048862395', 'smtp_user', '', 'string', 'SMTP username', 'smtp', NULL, false, '2026-01-10 15:18:05.00679+00', '2026-01-12 09:09:03.09833+00'),
	('54e5572b-613f-4d95-a30b-4506ad6c274f', 'smtp_password', '', 'string', 'SMTP password', 'smtp', '{"is_encrypted": true}', false, '2026-01-10 15:18:05.00679+00', '2026-01-12 09:09:03.09833+00'),
	('ede183db-e09b-4c45-aa22-19f422fc662a', 'smtp_from_email', '', 'string', 'From email address', 'smtp', NULL, false, '2026-01-10 15:18:05.00679+00', '2026-01-12 09:09:03.09833+00'),
	('99618460-c8fe-4c78-a5ac-4baf641666c5', 'smtp_from_name', '', 'string', 'From display name', 'smtp', NULL, false, '2026-01-10 15:18:05.00679+00', '2026-01-12 09:09:03.09833+00'),
	('c8d37968-194d-4291-8d6a-ce829c375502', 'smtp_secure', 'true', 'boolean', 'Use TLS/SSL for SMTP', 'smtp', NULL, false, '2026-01-10 15:18:05.00679+00', '2026-01-12 09:09:03.09833+00'),
	('0e4a1abd-ffc6-4713-bade-3cf45e6d5fbd', 'sms_provider', 'twilio', 'string', 'SMS Provider', 'sms', '{"options": ["twilio", "sns", "nexmo"]}', false, '2026-01-12 08:58:16.994982+00', '2026-01-12 09:09:03.09833+00'),
	('dc3cc578-40db-40af-9917-ab84b80feca3', 'sms_account_sid', '', 'string', 'Account SID / API Key', 'sms', NULL, false, '2026-01-12 08:58:16.994982+00', '2026-01-12 09:09:03.09833+00'),
	('0c08c109-14d2-4f8c-94dc-c5aca7e6b0ed', 'sms_auth_token', '', 'string', 'Auth Token / Secret', 'sms', '{"is_encrypted": true}', false, '2026-01-12 08:58:16.994982+00', '2026-01-12 09:09:03.09833+00'),
	('83a95f02-9597-4b69-8427-ab3345f95c8d', 'sms_from_number', '', 'string', 'From Phone Number', 'sms', NULL, false, '2026-01-12 08:58:16.994982+00', '2026-01-12 09:09:03.09833+00'),
	('ec301061-85c0-4449-93df-c4b43f57384b', 'session_timeout', '60', 'number', 'Session timeout in minutes', 'security', NULL, false, '2026-01-10 15:18:05.00679+00', '2026-01-12 09:09:03.09833+00'),
	('bc40b075-8f88-471d-b1d6-d00dd2dae24d', 'password_min_length', '8', 'number', 'Minimum password length', 'security', NULL, false, '2026-01-10 15:18:05.00679+00', '2026-01-12 09:09:03.09833+00');


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."users" ("id", "email", "full_name", "role", "status", "last_login", "created_at", "updated_at") VALUES
	('1b0f2dc2-08bf-492e-89e1-ce08de558f74', 'menjilx@gmail.com', 'Menj', 'owner', 'active', NULL, '2026-01-11 06:48:43.783631+00', '2026-01-11 06:48:47.311021+00');


--
-- Data for Name: cashier_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."cashier_sessions" ("id", "user_id", "opening_amount", "closing_amount", "expected_cash_amount", "opening_time", "closing_time", "status", "notes", "created_at", "updated_at") VALUES
	('9f47558e-f81c-457c-a0e5-febc13c03a3d', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, 1440.00, NULL, '2026-01-11 13:03:17.531+00', '2026-01-11 16:49:56.203+00', 'closed', 'initial opening
Closing Note: demo closing register', '2026-01-11 13:03:17.680205+00', '2026-01-11 13:03:17.680205+00'),
	('aea5ee43-e4e4-4b8f-aecb-27644f305b76', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, 528.00, NULL, '2026-01-12 04:37:21.567+00', '2026-01-12 09:03:03.573+00', 'closed', 'Closing Note: new feature for closing register', '2026-01-12 04:37:21.676193+00', '2026-01-12 04:37:21.676193+00'),
	('68f596b7-30a2-4af5-896a-9ff70a106ccf', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, 10700.00, NULL, '2026-01-13 04:54:44.941+00', '2026-01-18 01:23:00.377+00', 'closed', '', '2026-01-13 04:54:45.0633+00', '2026-01-13 04:54:45.0633+00'),
	('2488d951-1cda-41cd-8945-b001e8988110', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, NULL, '2026-01-18 01:23:17.291+00', '2026-01-18 08:44:00.000+00', 'closed', '', '2026-01-18 01:23:17.456336+00', '2026-01-18 01:23:17.456336+00'),
	('43a73c62-dd29-475c-806c-b89664d9d8bd', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, NULL, '2026-01-18 08:45:00.294+00', '2026-01-18 08:54:00.000+00', 'closed', '', '2026-01-18 08:45:00.472864+00', '2026-01-18 08:45:00.472864+00'),
	('07ead3a6-04ba-4a56-ad4c-7895a88b5737', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, NULL, '2026-01-18 08:55:44.476+00', NULL, 'open', '', '2026-01-18 08:55:44.568748+00', '2026-01-18 08:55:44.568748+00');


--
-- Data for Name: cost_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."customers" ("id", "name", "email", "phone", "address", "notes", "is_active", "created_at", "updated_at") VALUES
	('660afdf4-6baa-4faa-8fd7-8161ad8ffe3c', 'Demo Customer', 'democustomer@gmail.com', '0917999999999', NULL, 'demo customer', true, '2026-01-11 14:38:38.400005+00', '2026-01-11 14:38:38.400005+00'),
	('2e32f1ed-39e2-405d-85cb-4e73edc75e30', 'Walk-in', NULL, NULL, NULL, 'Default customer for walk-in sales', true, '2026-01-11 17:05:39.15269+00', '2026-01-11 17:05:39.15269+00'),
	('c6801dc5-1dda-460d-9cd9-8042d6535559', 'Walk-in Customer', '', '', '', 'Default customer for walk-in sales', true, '2026-01-11 17:05:39.15269+00', '2026-01-12 05:13:46.754+00'),
	('5fbbebd7-a266-4f83-a92c-d04763c0643f', 'Walk-in', NULL, NULL, NULL, 'Default customer for walk-in sales', true, '2026-01-12 06:26:37.345686+00', '2026-01-12 06:26:37.345686+00'),
	('3f1e2d3f-3ed7-4116-b7f8-78ad9e34530a', 'John Deo', NULL, NULL, NULL, NULL, true, '2026-01-14 07:01:53.786565+00', '2026-01-14 07:01:53.786565+00');


--
-- Data for Name: discounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."discounts" ("id", "name", "type", "value", "is_active", "created_at") VALUES
	('58970106-e608-4fd0-960f-530064a5b13d', 'Senior', 'percentage', 25.00, true, '2026-01-11 10:06:25.21746+00'),
	('7260fe78-26fd-4acc-8dd8-50c78c3886ec', 'PWD', 'percentage', 25.00, true, '2026-01-11 13:48:34.151175+00');


--
-- Data for Name: expense_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."expense_categories" ("id", "name", "description", "created_at") VALUES
	('88c07486-1f6c-4e11-b1c7-800f8555d8f1', 'Utilities', 'utilities and other related expenses', '2026-01-11 09:58:02.378257+00');


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."expenses" ("id", "category_id", "description", "amount", "expense_date", "notes", "created_at", "created_by") VALUES
	('6a099de3-e041-453a-8d22-f84e4d177526', '88c07486-1f6c-4e11-b1c7-800f8555d8f1', 'Electric Bill', 14000.00, '2026-01-11', 'payment for electric bill', '2026-01-11 16:51:50.464945+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74');


--
-- Data for Name: ingredient_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."ingredient_categories" ("id", "name", "description", "created_at", "status") VALUES
	('dc93c497-0948-46c9-af2e-9099f2471f1a', 'Condiments & Sauces', 'inegars, soy sauce, fish sauce, ketchup, mustard, mayo, hot sauce, curry pastes.', '2026-01-11 10:42:16.040209+00', 'active'),
	('597b20e6-2cd5-4d1c-8b6d-5e0b7048db4a', 'Misc Pantry', 'Broths/stock, bouillon, canned tomato products, nut butters, pickles', '2026-01-11 10:44:49.978185+00', 'active'),
	('00021645-f94f-4f15-9b9d-ed9b76a3d3e7', 'Additives & Culinary Agents', 'Thickeners, emulsifiers, leaveners, colorings, stabilizers.', '2026-01-11 10:45:05.046463+00', 'active'),
	('1a9e6582-2089-448a-bead-b5e7c6a2cddc', 'Sweeteners', 'Sugar, brown sugar, honey, syrups (maple, corn), artificial sweeteners', '2026-01-11 10:45:15.397928+00', 'active'),
	('282fe8f9-16d0-4138-a084-d39b09e5af7c', 'Spices & Herbs', 'Salt, pepper, dried herbs, whole and ground spices, seasoning blends', '2026-01-11 10:41:39.250422+00', 'active'),
	('b9ec727c-6a9b-4f97-b727-ddb1655bf776', 'Baking & Dry Goods', 'Flour, cornstarch, baking powder/soda, yeast, cocoa, gelatin', '2026-01-11 10:51:18.833843+00', 'active'),
	('a84da6d7-c4a5-4532-9f0e-2bcd198c410a', 'Grains & Starches', 'Rice, pasta, noodles, bread, potatoes, oats, cornmeal, lentils', '2026-01-11 10:51:32.817947+00', 'active'),
	('0244d6da-615a-4fcd-b087-9e1039d9e2e8', 'Proteins', 'Meat, poultry, seafood, eggs, tofu, beans, nuts, deli meats', '2026-01-11 09:46:48.505483+00', 'active'),
	('56515c45-3de8-4ffe-9363-5b34a1090f14', 'Produce', 'Fruits and vegetables, fresh, frozen, canned, or dried', '2026-01-11 09:46:59.077653+00', 'active'),
	('c9b528de-971b-48d0-8950-3d368c9eb4a1', 'Beverages & Mixers', 'Coffee, tea, juices, syrups, soda, cocktail mixers', '2026-01-11 10:52:51.581189+00', 'active'),
	('f9495118-6f9d-4ab2-8d8c-2eea9712a3d9', 'Dairy', 'Milk, cream, cheese, yogurt, butter', '2026-01-11 10:54:39.119568+00', 'active');


--
-- Data for Name: ingredients; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."ingredients" ("id", "category_id", "name", "unit", "cost_per_unit", "reorder_level", "status", "created_at", "updated_at", "usage_unit", "conversion_factor") VALUES
	('d36e9747-9868-4ed3-977e-613fdc66d1ea', 'f9495118-6f9d-4ab2-8d8c-2eea9712a3d9', 'Milk', 'bx', 190.00, 5.00, 'active', '2026-01-11 10:55:03.612813+00', '2026-01-11 12:01:11.885452+00', 'ml', 1000.0000),
	('b68fd9f2-924f-4b7f-9dab-3462e0cd6169', 'c9b528de-971b-48d0-8950-3d368c9eb4a1', 'Coffee Beans', 'kg', 500.00, 5.00, 'active', '2026-01-11 10:53:40.907047+00', '2026-01-11 12:01:26.633925+00', 'g', 1000.0000),
	('4785e0ce-95c2-4bed-8c26-2bb4a9c6ed51', '1a9e6582-2089-448a-bead-b5e7c6a2cddc', 'Sugar', 'kg', 500.00, 5.00, 'active', '2026-01-11 10:54:08.320028+00', '2026-01-11 12:01:50.91612+00', 'g', 1000.0000),
	('507c2806-1f0e-4c77-ae75-7e63e022adde', '1a9e6582-2089-448a-bead-b5e7c6a2cddc', 'Caramel Syrup', 'L', 360.00, 5.00, 'active', '2026-01-11 11:58:59.615932+00', '2026-01-11 16:55:56.808138+00', 'ml', 1000.0000),
	('e9e2e0f4-1230-4ac4-85ee-eb7edf3e2bad', '56515c45-3de8-4ffe-9363-5b34a1090f14', 'Baby backribs', 'kg', 460.00, 5.00, 'active', '2026-01-11 17:35:14.764916+00', '2026-01-11 17:35:14.764916+00', 'g', 1000.0000),
	('d4f32505-6829-4def-bf90-f73f44d9525a', '597b20e6-2cd5-4d1c-8b6d-5e0b7048db4a', 'Water', 'case', 10.00, 10.00, 'active', '2026-01-14 14:52:08.666553+00', '2026-01-14 15:39:51.549759+00', 'pcs', 24.0000),
	('5241aa62-33b4-4ceb-b546-a71136594470', NULL, 'Drinking Water', 'bottle', 25.00, 10.00, 'active', '2026-01-18 01:39:50.447437+00', '2026-01-18 01:39:50.447437+00', 'bottle', 1.0000);


--
-- Data for Name: tables; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."tables" ("id", "table_number", "capacity", "location", "status", "created_at") VALUES
	('65ef7384-96d8-44c9-8b1a-a6d973db291a', 'T1', 4, 'VIP Section', 'available', '2026-01-11 08:26:09.305893+00'),
	('a26e34c1-09ea-4852-bf97-27e5f022f76a', 'T2', 2, 'Patio', 'available', '2026-01-14 06:36:55.692171+00');


--
-- Data for Name: reservations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."reservations" ("id", "table_id", "customer_name", "customer_phone", "customer_email", "party_size", "reservation_time", "duration_minutes", "status", "special_requests", "notes", "created_at", "updated_at") VALUES
	('ee4e461e-5d4e-4bf8-bbe5-68adfe3b2107', '65ef7384-96d8-44c9-8b1a-a6d973db291a', 'Mr. Pogi', '091111111', 'pogi@gmail.com', 4, '2026-01-16 03:00:00+00', 90, 'pending', 'aircon room', 'VIP client', '2026-01-11 17:42:05.879526+00', '2026-01-11 17:42:05.879526+00'),
	('a2ee9cc5-ddc3-4863-9de9-0935a88df176', '65ef7384-96d8-44c9-8b1a-a6d973db291a', 'Via', '', '', 3, '2026-01-14 23:30:00+00', 90, 'pending', 'high chair', '', '2026-01-14 17:30:41.888847+00', '2026-01-14 17:30:41.888847+00'),
	('bf214332-1221-4ec8-b83f-4b495cc0cb24', 'a26e34c1-09ea-4852-bf97-27e5f022f76a', 'Dodong', '', '', 2, '2026-01-15 02:45:00+00', 90, 'pending', 'window seat', '', '2026-01-14 17:45:55.948916+00', '2026-01-14 17:45:55.948916+00');


--
-- Data for Name: sales; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."sales" ("id", "order_number", "sale_type", "table_id", "reservation_id", "total_amount", "payment_method", "payment_status", "payment_notes", "tip_amount", "payment_data", "notes", "sale_date", "sale_time", "created_at", "created_by", "discount_amount", "discount_name", "tax_amount", "customer_id") VALUES
	('93633f74-57a9-4e00-9670-1e96ce9c9a33', '#ORD-3137', 'takeout', NULL, NULL, 320.00, 'cash', 'paid', NULL, 0.00, '{}', 'Customer: Demo Customer', '2026-01-11', '2026-01-11 15:42:12.339+00', '2026-01-11 15:42:12.42858+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, '660afdf4-6baa-4faa-8fd7-8161ad8ffe3c'),
	('431ed599-bc71-40e1-b33f-8efddb3b1023', '#ORD-3459', 'delivery', NULL, NULL, 480.00, 'card', 'paid', NULL, 0.00, '{}', 'Customer: Walk-in Customer | Ref: txn001 | PayNote: paid using unionbank cc', '2026-01-11', '2026-01-11 15:49:01.942+00', '2026-01-11 15:49:02.018434+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, NULL),
	('75c52383-1bbf-499b-86c8-8c6813e2fb39', '#ORD-9607', 'delivery', NULL, NULL, 480.00, 'cash', 'paid', NULL, 0.00, '{}', 'Customer: Walk-in Customer', '2026-01-11', '2026-01-11 15:49:12.592+00', '2026-01-11 15:49:12.645599+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, NULL),
	('c4607fc2-ca62-467f-92c7-2cdfa82ada01', '#ORD-1820', 'dine_in', '65ef7384-96d8-44c9-8b1a-a6d973db291a', NULL, 160.00, 'cash', 'paid', NULL, 0.00, '{}', 'Customer: Walk-in Customer', '2026-01-11', '2026-01-11 15:02:33.1+00', '2026-01-11 15:02:33.163402+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, NULL),
	('2faaf4fe-b6c4-4fc6-876a-67da92473115', '#ORD-7018', 'dine_in', NULL, NULL, 120.00, 'cash', 'paid', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 80, "receivedAmount": 200}', 'Customer: Walk-in', '2026-01-12', '2026-01-12 04:56:45.028+00', '2026-01-12 04:56:45.134684+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 40.00, 'Custom (25%)', 0.00, 'c6801dc5-1dda-460d-9cd9-8042d6535559'),
	('584e9d88-1a18-48ed-9356-47270806d141', '#ORD-391', 'dine_in', NULL, NULL, 960.00, 'card', 'paid', 'metrobank card', 0.00, '{"ref": "txn002", "notes": "metrobank card", "attachment": null, "receivedAmount": 1000}', 'Customer: Walk-in Customer | Ref: txn002 | PayNote: metrobank card', '2026-01-12', '2026-01-12 05:14:08.809+00', '2026-01-12 05:14:08.898896+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 320.00, 'Senior', 0.00, NULL),
	('c2a91d8f-f43b-47bc-a3c8-6c9bc7958ab5', '#ORD-5067', 'dine_in', '65ef7384-96d8-44c9-8b1a-a6d973db291a', NULL, 120.00, 'cash', 'paid', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 80, "receivedAmount": 200}', 'Customer: Walk-in Customer', '2026-01-12', '2026-01-12 05:16:15.37+00', '2026-01-12 05:16:15.479449+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 40.00, 'Senior', 0.00, NULL),
	('c7433f31-8e5a-40e4-8693-9693598c0935', '#ORD-7938', 'takeout', NULL, NULL, 288.00, 'cash', 'paid', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 12, "receivedAmount": 300}', 'Customer: Walk-in Customer', '2026-01-12', '2026-01-12 05:29:19.082+00', '2026-01-12 05:29:19.246494+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 32.00, 'Custom (10%)', 0.00, NULL),
	('589731ac-9b13-4aae-bbc7-5083e94c5af1', '#ORD-000000015', 'dine_in', NULL, NULL, 160.00, 'cash', 'paid', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 40, "receivedAmount": 200}', 'Customer: Walk-in', '2026-01-13', '2026-01-13 04:54:56.831+00', '2026-01-13 04:54:56.940736+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, '5fbbebd7-a266-4f83-a92c-d04763c0643f'),
	('2691e87d-8267-4d24-8be0-bed59243af5d', '#ORD-000000040', 'dine_in', NULL, NULL, 160.00, 'cash', 'paid', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 40, "receivedAmount": 200}', 'Customer: Walk-in', '2026-01-14', '2026-01-14 02:40:48.644+00', '2026-01-14 02:40:48.720389+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, '5fbbebd7-a266-4f83-a92c-d04763c0643f'),
	('fb6838ea-b40d-4b98-ab9b-24103f7fa815', '#ORD-000000019', 'takeout', NULL, NULL, 288.00, 'cash', 'refunded', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 12, "receivedAmount": 300}', 'Customer: Walk-in', '2026-01-13', '2026-01-13 05:42:19.038+00', '2026-01-13 05:42:19.105712+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 32.00, 'Custom (10%)', 0.00, '5fbbebd7-a266-4f83-a92c-d04763c0643f'),
	('8b6e0767-e72f-4052-a60a-556476c5d5f9', '#ORD-000000027', 'dine_in', NULL, NULL, 480.00, 'cash', 'paid', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 20, "receivedAmount": 500}', 'Customer: Walk-in', '2026-01-13', '2026-01-13 13:30:41.052+00', '2026-01-13 13:30:41.139706+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, '5fbbebd7-a266-4f83-a92c-d04763c0643f'),
	('45a31649-ab56-4365-b15a-d278c71077c7', '#ORD-000000029', 'dine_in', NULL, NULL, 640.00, 'cash', 'paid', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 360, "receivedAmount": 1000}', 'Customer: Walk-in', '2026-01-14', '2026-01-14 01:50:16.265+00', '2026-01-14 01:50:16.392159+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, '5fbbebd7-a266-4f83-a92c-d04763c0643f'),
	('b9e97a64-0948-48c4-a948-08606630915d', '#ORD-000000032', 'delivery', NULL, NULL, 160.00, 'cash', 'paid', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 40, "receivedAmount": 200}', 'Customer: Walk-in', '2026-01-14', '2026-01-14 02:04:16.828+00', '2026-01-14 02:04:16.917356+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, '5fbbebd7-a266-4f83-a92c-d04763c0643f'),
	('96230496-274b-42c3-a429-29e60369516e', '#ORD-000000034', 'dine_in', NULL, NULL, 160.00, 'cash', 'paid', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 40, "receivedAmount": 200}', 'Customer: Walk-in', '2026-01-14', '2026-01-14 02:04:51.972+00', '2026-01-14 02:04:52.058703+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, '5fbbebd7-a266-4f83-a92c-d04763c0643f'),
	('1b89a379-1e5d-4e19-9ced-b75c22544abe', '#ORD-000000025', 'dine_in', NULL, NULL, 800.00, 'cash', 'paid', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 200, "receivedAmount": 1000}', 'Customer: Walk-in', '2026-01-13', '2026-01-13 13:24:50.987+00', '2026-01-13 13:24:51.116512+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, '5fbbebd7-a266-4f83-a92c-d04763c0643f'),
	('6fc7c4f7-2118-4d68-8354-7e63230409a2', '#ORD-000000038', 'dine_in', NULL, NULL, 160.00, 'cash', 'paid', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 340, "receivedAmount": 500}', 'Customer: Walk-in', '2026-01-14', '2026-01-14 02:24:17.607+00', '2026-01-14 02:24:17.675338+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, '5fbbebd7-a266-4f83-a92c-d04763c0643f'),
	('e436ec0c-b91d-476c-ac32-30ffa16692ec', '#ORD-000000042', 'dine_in', NULL, NULL, 160.00, 'cash', 'paid', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 0, "receivedAmount": 160}', 'Customer: Walk-in', '2026-01-14', '2026-01-14 02:41:38.166+00', '2026-01-14 02:41:38.243232+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, '5fbbebd7-a266-4f83-a92c-d04763c0643f'),
	('cfebb86b-702f-4192-a3ba-fd2a054fcaeb', '#ORD-000000044', 'dine_in', NULL, NULL, 160.00, 'cash', 'paid', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 40, "receivedAmount": 200}', 'Customer: Walk-in', '2026-01-14', '2026-01-14 02:48:08.486+00', '2026-01-14 02:48:08.572331+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, '5fbbebd7-a266-4f83-a92c-d04763c0643f'),
	('bf523a8c-9321-40fd-a506-271e7b1cb3a7', '#ORD-000000047', 'dine_in', NULL, NULL, 160.00, 'cash', 'paid', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 40, "receivedAmount": 200}', 'Customer: Walk-in', '2026-01-14', '2026-01-14 02:53:44.78+00', '2026-01-14 02:53:44.960897+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, '5fbbebd7-a266-4f83-a92c-d04763c0643f'),
	('281eadb7-13d2-471c-a446-56bc6e6816f9', '#ORD-000000049', 'dine_in', NULL, NULL, 320.00, 'cash', 'paid', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 80, "receivedAmount": 400}', 'Customer: Walk-in', '2026-01-14', '2026-01-14 02:58:09.597+00', '2026-01-14 02:58:09.701621+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, '5fbbebd7-a266-4f83-a92c-d04763c0643f'),
	('ca1b314a-df3d-4157-a5a1-f53d62b85310', '#ORD-000000050', 'dine_in', NULL, NULL, 160.00, 'cash', 'paid', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 40, "receivedAmount": 200}', 'Customer: Walk-in', '2026-01-14', '2026-01-14 03:00:37.643+00', '2026-01-14 03:00:37.750787+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, '5fbbebd7-a266-4f83-a92c-d04763c0643f'),
	('a6241673-ac59-4538-b8fb-74038040d4d4', '#ORD-000000052', 'dine_in', NULL, NULL, 160.00, 'cash', 'paid', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 40, "receivedAmount": 200}', 'Customer: Walk-in', '2026-01-14', '2026-01-14 03:08:00.582+00', '2026-01-14 03:08:00.662097+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, '5fbbebd7-a266-4f83-a92c-d04763c0643f'),
	('b4fff3ff-8c19-480c-9b95-070172fb0608', '#ORD-000000054', 'dine_in', NULL, NULL, 160.00, 'cash', 'paid', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 40, "receivedAmount": 200}', 'Customer: Walk-in', '2026-01-14', '2026-01-14 03:09:27.035+00', '2026-01-14 03:09:27.127197+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, '5fbbebd7-a266-4f83-a92c-d04763c0643f'),
	('246dae95-68bd-4eb6-913e-b570cac05284', '#ORD-000000056', 'dine_in', NULL, NULL, 160.00, 'cash', 'paid', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 0, "receivedAmount": 160}', 'Customer: Walk-in', '2026-01-14', '2026-01-14 03:44:15.396+00', '2026-01-14 03:44:15.471436+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, '5fbbebd7-a266-4f83-a92c-d04763c0643f'),
	('8a0bc951-c2f8-4d6d-ab87-d1c745930124', '#ORD-000000058', 'dine_in', NULL, NULL, 160.00, 'cash', 'paid', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 0, "receivedAmount": 160}', 'Customer: Walk-in', '2026-01-14', '2026-01-14 04:45:29.366+00', '2026-01-14 04:45:29.575808+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, '5fbbebd7-a266-4f83-a92c-d04763c0643f'),
	('47c11b0d-54ce-44f3-a709-f55d12bcf6ab', '#ORD-000000060', 'dine_in', NULL, NULL, 160.00, 'cash', 'paid', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 0, "receivedAmount": 160}', 'Customer: Walk-in', '2026-01-14', '2026-01-14 04:48:05.409+00', '2026-01-14 04:48:05.471119+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, '5fbbebd7-a266-4f83-a92c-d04763c0643f'),
	('ceeae9bf-7633-4afe-89f0-308fc12e8e70', '#ORD-000000063', 'dine_in', NULL, NULL, 160.00, 'cash', 'paid', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 0, "receivedAmount": 160}', 'Customer: Walk-in', '2026-01-14', '2026-01-14 04:55:51.033+00', '2026-01-14 04:55:51.109486+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, '5fbbebd7-a266-4f83-a92c-d04763c0643f'),
	('32c0f28c-fac3-42d6-905f-6308dc0a67a1', '#ORD-000000065', 'dine_in', NULL, NULL, 160.00, 'cash', 'paid', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 0, "receivedAmount": 160}', 'Customer: Walk-in', '2026-01-14', '2026-01-14 05:01:35+00', '2026-01-14 05:01:35.254486+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, '5fbbebd7-a266-4f83-a92c-d04763c0643f'),
	('1b04abaf-d08e-48bc-a397-5e8a0f3c62ac', '#ORD-000000067', 'dine_in', NULL, NULL, 160.00, 'cash', 'paid', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 0, "receivedAmount": 160}', 'Customer: Walk-in', '2026-01-14', '2026-01-14 05:07:56.332+00', '2026-01-14 05:07:56.395893+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, '5fbbebd7-a266-4f83-a92c-d04763c0643f'),
	('c3c24efa-89bc-4308-b5c1-03cd08b42b12', '#ORD-000000069', 'dine_in', NULL, NULL, 160.00, 'cash', 'paid', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 0, "receivedAmount": 160}', 'Customer: Walk-in', '2026-01-14', '2026-01-14 05:10:40.823+00', '2026-01-14 05:10:40.892564+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, '5fbbebd7-a266-4f83-a92c-d04763c0643f'),
	('892c0f92-8728-4b74-8d92-30a1395daf3b', '#ORD-000000072', 'dine_in', NULL, NULL, 160.00, 'cash', 'paid', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 0, "receivedAmount": 160}', 'Customer: Walk-in', '2026-01-14', '2026-01-14 05:11:45.318+00', '2026-01-14 05:11:45.423802+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, '5fbbebd7-a266-4f83-a92c-d04763c0643f'),
	('0c17230e-e8ad-4a2f-aac6-93acb4034f81', '#ORD-000000074', 'dine_in', NULL, NULL, 160.00, 'cash', 'paid', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 0, "receivedAmount": 160}', 'Customer: Walk-in', '2026-01-14', '2026-01-14 05:18:17.369+00', '2026-01-14 05:18:17.434423+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, '5fbbebd7-a266-4f83-a92c-d04763c0643f'),
	('28386f3f-affb-4abf-a716-fc005e07b95f', '#ORD-000000082', 'dine_in', NULL, NULL, 160.00, 'cash', 'paid', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 0, "receivedAmount": 160}', 'Customer: Walk-in', '2026-01-14', '2026-01-14 05:46:07.093+00', '2026-01-14 05:46:07.240693+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, '5fbbebd7-a266-4f83-a92c-d04763c0643f'),
	('175890b1-fdb7-4194-ac34-b53533a569b1', '#ORD-000000084', 'dine_in', NULL, NULL, 160.00, 'cash', 'paid', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 0, "receivedAmount": 160}', 'Customer: Walk-in', '2026-01-14', '2026-01-14 05:50:06.874+00', '2026-01-14 05:50:06.9521+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, '5fbbebd7-a266-4f83-a92c-d04763c0643f'),
	('0c84e429-7ead-4359-8d4e-527f64770da5', '#ORD-000000086', 'dine_in', NULL, NULL, 160.00, 'cash', 'paid', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 30, "receivedAmount": 190}', 'Customer: Walk-in', '2026-01-14', '2026-01-14 05:51:51.439+00', '2026-01-14 05:51:51.568304+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, '5fbbebd7-a266-4f83-a92c-d04763c0643f'),
	('2b669e92-36b3-480c-bb13-922d5a1b7774', '#ORD-000000083', 'dine_in', NULL, NULL, 640.00, 'cash', 'paid', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 0, "receivedAmount": 640}', 'Customer: Walk-in', '2026-01-14', '2026-01-14 05:46:42.044+00', '2026-01-14 05:46:42.164157+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, '5fbbebd7-a266-4f83-a92c-d04763c0643f'),
	('cb20e693-8ea2-45b4-97d2-315cfe3f7e81', '#ORD-000000089', 'dine_in', NULL, NULL, 160.00, 'cash', 'paid', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 40, "receivedAmount": 200}', 'Customer: Walk-in', '2026-01-14', '2026-01-14 05:58:39.865+00', '2026-01-14 05:58:40.004248+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, '5fbbebd7-a266-4f83-a92c-d04763c0643f'),
	('ef5a607d-bae3-4716-a7fd-9dd8ddc98d0a', '#ORD-000000091', 'dine_in', '65ef7384-96d8-44c9-8b1a-a6d973db291a', NULL, 160.00, 'cash', 'paid', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 0, "receivedAmount": 160}', 'Customer: Walk-in', '2026-01-14', '2026-01-14 06:00:12.346+00', '2026-01-14 06:00:12.451049+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, '5fbbebd7-a266-4f83-a92c-d04763c0643f'),
	('7f04847d-d5b5-4ac8-82fd-7f6b3ce383fb', '#ORD-000000092', 'dine_in', '65ef7384-96d8-44c9-8b1a-a6d973db291a', NULL, 120.00, 'cash', 'paid', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 0, "receivedAmount": 120}', 'Customer: Walk-in', '2026-01-14', '2026-01-14 06:02:02.774+00', '2026-01-14 06:02:03.103057+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 40.00, 'Senior', 0.00, '5fbbebd7-a266-4f83-a92c-d04763c0643f'),
	('fd61194a-22cc-405e-a825-2f7b98872d86', '#ORD-000000094', 'dine_in', NULL, NULL, 160.00, 'cash', 'paid', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 0, "receivedAmount": 160}', 'Customer: Walk-in', '2026-01-14', '2026-01-14 06:02:27.265+00', '2026-01-14 06:02:27.343223+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, '5fbbebd7-a266-4f83-a92c-d04763c0643f'),
	('8a9bc099-8de9-4b2b-b53c-626c17e120a3', '#ORD-000000100', 'dine_in', NULL, NULL, 160.00, 'cash', 'paid', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 0, "receivedAmount": 160}', 'Customer: Walk-in', '2026-01-14', '2026-01-14 06:34:40.592+00', '2026-01-14 06:34:40.664818+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, '5fbbebd7-a266-4f83-a92c-d04763c0643f'),
	('0bef4345-be6a-4eed-bb55-abbb2e9d5f7d', '#ORD-000000101', 'dine_in', NULL, NULL, 160.00, 'cash', 'paid', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 0, "receivedAmount": 160}', 'Customer: Walk-in', '2026-01-14', '2026-01-14 06:34:56.418+00', '2026-01-14 06:34:56.497281+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, '5fbbebd7-a266-4f83-a92c-d04763c0643f'),
	('f6e94687-e972-49f0-b9e3-538e80b25858', '#ORD-000000104', 'dine_in', 'a26e34c1-09ea-4852-bf97-27e5f022f76a', NULL, 160.00, 'cash', 'paid', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 0, "receivedAmount": 160}', 'Customer: Walk-in', '2026-01-14', '2026-01-14 06:37:10.22+00', '2026-01-14 06:37:10.296443+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, '5fbbebd7-a266-4f83-a92c-d04763c0643f'),
	('013019c7-8e60-4339-9e67-0a66acae32d7', '#ORD-000000108', 'dine_in', NULL, NULL, 160.00, 'cash', 'paid', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 0, "receivedAmount": 160}', 'Customer: Walk-in', '2026-01-14', '2026-01-14 06:42:56.262+00', '2026-01-14 06:42:56.735123+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, '5fbbebd7-a266-4f83-a92c-d04763c0643f'),
	('3ffe95c0-5a11-4f53-aae9-b0e9db131e57', '#ORD-000000109', 'dine_in', 'a26e34c1-09ea-4852-bf97-27e5f022f76a', NULL, 320.00, 'card', 'paid', 'paid using PNB card', 0.00, '{"ref": "txn003", "notes": "paid using PNB card", "attachment": null, "receivedAmount": 320}', 'Customer: Walk-in | Ref: txn003 | PayNote: paid using PNB card', '2026-01-14', '2026-01-14 06:48:33.556+00', '2026-01-14 06:48:33.796696+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, '5fbbebd7-a266-4f83-a92c-d04763c0643f'),
	('d3e8a358-cd19-4d8b-bb03-4d7ad8f9b434', '#ORD-000000113', 'dine_in', NULL, NULL, 160.00, 'cash', 'paid', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 0, "receivedAmount": 160}', 'Customer: Demo Customer', '2026-01-14', '2026-01-14 07:01:17.861+00', '2026-01-14 07:01:17.967942+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, '660afdf4-6baa-4faa-8fd7-8161ad8ffe3c'),
	('2a3c0996-c59a-4471-8d1e-8c8053a656d3', '#ORD-000000114', 'dine_in', '65ef7384-96d8-44c9-8b1a-a6d973db291a', NULL, 160.00, 'card', 'paid', '', 0.00, '{"ref": "txn004", "notes": "", "attachment": null, "receivedAmount": 160}', 'Customer: John Deo | Ref: txn004', '2026-01-14', '2026-01-14 07:02:12.668+00', '2026-01-14 07:02:12.789898+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, '3f1e2d3f-3ed7-4116-b7f8-78ad9e34530a'),
	('5a46ec72-b2f9-4d8a-bfae-356ac54aed63', '#ORD-000000126', 'dine_in', NULL, NULL, 640.00, 'cash', 'paid', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 0, "receivedAmount": 640}', 'Customer: Walk-in', '2026-01-14', '2026-01-14 08:35:30.169+00', '2026-01-14 08:35:30.264013+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, '5fbbebd7-a266-4f83-a92c-d04763c0643f'),
	('d30c69b2-bc06-4239-9135-ace422fb7f01', '#ORD-000000123', 'dine_in', NULL, NULL, 1120.00, 'cash', 'paid', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 0, "receivedAmount": 1120}', 'Customer: Walk-in', '2026-01-14', '2026-01-14 07:28:05.061+00', '2026-01-14 07:28:05.145283+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, '5fbbebd7-a266-4f83-a92c-d04763c0643f'),
	('260260db-5c0b-4aad-82a3-4fb14c0496ed', '#ORD-000000127', 'dine_in', NULL, NULL, 160.00, 'cash', 'paid', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 0, "receivedAmount": 160}', 'Customer: Walk-in', '2026-01-14', '2026-01-14 08:36:18.957+00', '2026-01-14 08:36:19.021788+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, '5fbbebd7-a266-4f83-a92c-d04763c0643f'),
	('406a6175-2cd3-4146-a770-5498ffbee5e2', '#ORD-000000119', 'dine_in', NULL, NULL, 160.00, 'cash', 'paid', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 40, "receivedAmount": 200}', 'Customer: Walk-in', '2026-01-14', '2026-01-14 07:19:56.582+00', '2026-01-14 07:19:56.646612+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, '5fbbebd7-a266-4f83-a92c-d04763c0643f'),
	('a8265918-7943-498d-bcde-49699e08579e', '#ORD-000000130', 'dine_in', NULL, NULL, 160.00, 'cash', 'paid', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 0, "receivedAmount": 160}', 'Customer: Walk-in', '2026-01-14', '2026-01-14 08:46:01.659+00', '2026-01-14 08:46:01.761086+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, '5fbbebd7-a266-4f83-a92c-d04763c0643f'),
	('9c6e9f72-509b-41ec-ac24-3e7a500f3a6a', '#ORD-000000149', 'dine_in', NULL, NULL, 20.00, 'cash', 'paid', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 0, "receivedAmount": 20}', 'Customer: Walk-in', '2026-01-14', '2026-01-14 18:08:00.621+00', '2026-01-14 18:08:00.741482+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, '5fbbebd7-a266-4f83-a92c-d04763c0643f'),
	('438e983a-1c86-4e51-9de5-d008565e7484', '#ORD-000000156', 'dine_in', 'a26e34c1-09ea-4852-bf97-27e5f022f76a', NULL, 180.00, 'cash', 'paid', '', 0.00, '{"ref": "", "notes": "", "attachment": null, "changeAmount": 20, "receivedAmount": 200}', 'Customer: John Deo', '2026-01-18', '2026-01-18 01:24:42.822+00', '2026-01-18 01:24:42.966368+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, '3f1e2d3f-3ed7-4116-b7f8-78ad9e34530a'),
	('da50ee3b-dcae-4ebb-bff0-cc88d6f1a64b', '#ORD-000000161', 'dine_in', NULL, NULL, 180.00, NULL, 'pending', '', 0.00, '{"ref": "", "notes": "", "attachment": null}', 'Customer: Walk-in', '2026-01-18', '2026-01-18 01:42:57.584+00', '2026-01-18 01:42:57.7787+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', 0.00, NULL, 0.00, '5fbbebd7-a266-4f83-a92c-d04763c0643f');


--
-- Data for Name: kds_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."kds_orders" ("id", "sale_id", "order_number", "status", "priority", "assigned_station", "started_at", "completed_at", "created_at") VALUES
	('e7b6d872-7926-4b57-9cae-2540486ef24d', '2b669e92-36b3-480c-bb13-922d5a1b7774', '#ORD-000000083', 'served', 'normal', 'df5cd809-1daf-4c94-8d7b-14fba684c3dd', '2026-01-14 06:17:56.345+00', '2026-01-14 06:34:16.185+00', '2026-01-14 05:46:42.164157+00'),
	('0bc11cdf-9744-4e51-b6e1-bc54e9358275', '8a0bc951-c2f8-4d6d-ab87-d1c745930124', '#ORD-000000058', 'served', 'normal', NULL, '2026-01-14 05:25:42.497+00', '2026-01-14 06:05:04.333+00', '2026-01-14 04:45:29.575808+00'),
	('001d2bba-b10b-4530-be49-84ece0748fcb', 'c4607fc2-ca62-467f-92c7-2cdfa82ada01', '#ORD-1820', 'served', 'normal', NULL, '2026-01-11 15:16:14.809+00', '2026-01-11 15:38:40.436+00', '2026-01-11 15:02:33.163402+00'),
	('203e8961-99c2-4df4-931f-edca1833faff', '8b6e0767-e72f-4052-a60a-556476c5d5f9', '#ORD-000000027', 'served', 'normal', NULL, '2026-01-14 01:52:56.347+00', '2026-01-14 06:05:01.441+00', '2026-01-13 13:30:41.139706+00'),
	('4a830b76-8e7e-497e-b974-8b3b6dfbda1e', '45a31649-ab56-4365-b15a-d278c71077c7', '#ORD-000000029', 'served', 'normal', NULL, '2026-01-14 05:25:35.894+00', '2026-01-14 06:05:01.805+00', '2026-01-14 01:50:16.392159+00'),
	('d4b48111-0bbf-440c-aea6-47ea911c1a0a', 'cb20e693-8ea2-45b4-97d2-315cfe3f7e81', '#ORD-000000089', 'served', 'normal', 'df5cd809-1daf-4c94-8d7b-14fba684c3dd', '2026-01-14 06:17:55.647+00', '2026-01-14 06:34:16.372+00', '2026-01-14 05:58:40.004248+00'),
	('4f8c436c-59a7-48d0-88af-fad69a35f028', 'ceeae9bf-7633-4afe-89f0-308fc12e8e70', '#ORD-000000063', 'served', 'normal', 'Main Kitchen', '2026-01-14 05:25:43.06+00', '2026-01-14 06:05:04.892+00', '2026-01-14 04:55:51.109486+00'),
	('09293118-40d7-40ee-a0e2-cb0c9552bcaf', '93633f74-57a9-4e00-9670-1e96ce9c9a33', '#ORD-3137', 'served', 'normal', 'Bar', '2026-01-11 15:43:11.354+00', '2026-01-11 16:45:26.519+00', '2026-01-11 15:42:12.42858+00'),
	('49c0da6b-cd94-4f78-aa46-769f3bdd534c', '431ed599-bc71-40e1-b33f-8efddb3b1023', '#ORD-3459', 'served', 'normal', 'Bar', '2026-01-11 16:29:09.463+00', '2026-01-11 16:45:27.2+00', '2026-01-11 15:49:02.018434+00'),
	('5db65d39-7c3b-4f0b-8806-7ece2d346946', '32c0f28c-fac3-42d6-905f-6308dc0a67a1', '#ORD-000000065', 'served', 'normal', NULL, '2026-01-14 05:51:03.088+00', '2026-01-14 06:05:05.165+00', '2026-01-14 05:01:35.254486+00'),
	('def8c4a3-0fd4-4658-824b-7eca8c8366b7', '75c52383-1bbf-499b-86c8-8c6813e2fb39', '#ORD-9607', 'served', 'normal', 'Bar', '2026-01-11 16:45:24.22+00', '2026-01-11 16:45:28.502+00', '2026-01-11 15:49:12.645599+00'),
	('d8f644b9-0853-489c-a8e8-75abce4eba91', '2faaf4fe-b6c4-4fc6-876a-67da92473115', '#ORD-7018', 'served', 'normal', 'Bar', '2026-01-12 04:58:41.659+00', '2026-01-12 04:59:13.52+00', '2026-01-12 04:56:45.134684+00'),
	('54898ce7-54b0-433a-8cc4-7807cab4f370', '584e9d88-1a18-48ed-9356-47270806d141', '#ORD-391', 'served', 'normal', 'Bar', '2026-01-12 05:28:02.919+00', '2026-01-12 05:28:04.775+00', '2026-01-12 05:14:08.898896+00'),
	('250502dd-00e8-4e7c-9791-9c82d926e76c', '1b04abaf-d08e-48bc-a397-5e8a0f3c62ac', '#ORD-000000067', 'served', 'normal', NULL, '2026-01-14 05:51:03.284+00', '2026-01-14 06:05:05.443+00', '2026-01-14 05:07:56.395893+00'),
	('c9cc3772-b452-4883-b496-c2f8a68af12a', 'c2a91d8f-f43b-47bc-a3c8-6c9bc7958ab5', '#ORD-5067', 'served', 'normal', NULL, '2026-01-12 06:07:17.637+00', '2026-01-12 06:21:26.028+00', '2026-01-12 05:16:15.479449+00'),
	('e25d1215-c163-414e-896e-86e3be265d68', 'c7433f31-8e5a-40e4-8693-9693598c0935', '#ORD-7938', 'served', 'normal', NULL, '2026-01-12 06:11:11.715+00', '2026-01-12 06:21:26.919+00', '2026-01-12 05:29:19.246494+00'),
	('821c4183-8550-4817-8188-b216eff5cb0c', '589731ac-9b13-4aae-bbc7-5083e94c5af1', '#ORD-000000015', 'served', 'normal', 'Bar', '2026-01-13 05:41:24.768+00', '2026-01-13 12:40:30.347+00', '2026-01-13 04:54:56.940736+00'),
	('04fbbfa5-b063-4f13-adf4-0f9a5ff7de1c', 'fb6838ea-b40d-4b98-ab9b-24103f7fa815', '#ORD-000000019', 'served', 'normal', 'Bar', '2026-01-13 05:45:00.615+00', '2026-01-13 12:40:31.271+00', '2026-01-13 05:42:19.105712+00'),
	('89c4fee8-3838-4ed5-921d-aa317a22dee5', 'c3c24efa-89bc-4308-b5c1-03cd08b42b12', '#ORD-000000069', 'served', 'normal', NULL, '2026-01-14 05:28:40.725+00', '2026-01-14 06:05:05.72+00', '2026-01-14 05:10:40.892564+00'),
	('534b64cc-2cf1-49a4-98b0-7c136bb97b46', '892c0f92-8728-4b74-8d92-30a1395daf3b', '#ORD-000000072', 'served', 'normal', NULL, '2026-01-14 05:51:03.436+00', '2026-01-14 06:05:05.995+00', '2026-01-14 05:11:45.423802+00'),
	('e68b162d-5556-4861-93f1-6e8e19d41ad7', '1b89a379-1e5d-4e19-9ced-b75c22544abe', '#ORD-000000025', 'served', 'normal', 'Bar', '2026-01-14 01:52:52.663+00', '2026-01-14 06:04:52.745+00', '2026-01-13 13:24:51.116512+00'),
	('f027db42-de59-48c6-9b0b-912f3ef23e68', '0c84e429-7ead-4359-8d4e-527f64770da5', '#ORD-000000086', 'served', 'normal', '2d3b91dd-cfb1-4df2-80ca-dae63ad60064', '2026-01-14 06:33:58.723+00', '2026-01-14 06:34:01.986+00', '2026-01-14 05:51:51.568304+00'),
	('fc7d6352-e5d5-4e9d-beb5-7192ba6f510d', 'e436ec0c-b91d-476c-ac32-30ffa16692ec', '#ORD-000000042', 'served', 'normal', 'Main Kitchen', '2026-01-14 05:25:33.557+00', '2026-01-14 06:05:01.997+00', '2026-01-14 02:41:38.243232+00'),
	('d3dcacaf-7284-40f3-87d3-3dceba44ed0d', '0c17230e-e8ad-4a2f-aac6-93acb4034f81', '#ORD-000000074', 'served', 'normal', NULL, '2026-01-14 05:51:03.585+00', '2026-01-14 06:05:06.334+00', '2026-01-14 05:18:17.434423+00'),
	('b106dc9e-9cee-48f7-aafb-59356a99e6cb', '28386f3f-affb-4abf-a716-fc005e07b95f', '#ORD-000000082', 'served', 'normal', NULL, '2026-01-14 05:51:03.742+00', '2026-01-14 06:05:06.669+00', '2026-01-14 05:46:07.240693+00'),
	('0a363ab8-127b-4da9-8f10-ef673a389c11', '175890b1-fdb7-4194-ac34-b53533a569b1', '#ORD-000000084', 'served', 'normal', NULL, '2026-01-14 05:51:03.917+00', '2026-01-14 06:05:07.075+00', '2026-01-14 05:50:06.9521+00'),
	('6421475b-3f10-4e14-82e9-d4805cab9fea', 'b9e97a64-0948-48c4-a948-08606630915d', '#ORD-000000032', 'served', 'normal', 'Bar', '2026-01-14 05:25:23.19+00', '2026-01-14 06:04:52.918+00', '2026-01-14 02:04:16.917356+00'),
	('ac782fb1-e906-4173-b4a2-354a9275f601', 'f6e94687-e972-49f0-b9e3-538e80b25858', '#ORD-000000104', 'served', 'normal', '2d3b91dd-cfb1-4df2-80ca-dae63ad60064', '2026-01-14 06:39:10.992+00', '2026-01-14 08:45:51.339+00', '2026-01-14 06:37:10.296443+00'),
	('f63b0ec4-5079-452d-8401-09f757c4f57b', 'bf523a8c-9321-40fd-a506-271e7b1cb3a7', '#ORD-000000047', 'served', 'normal', 'Main Kitchen', '2026-01-14 05:25:34.298+00', '2026-01-14 06:05:02.177+00', '2026-01-14 02:53:44.960897+00'),
	('a0ebba64-fabf-4f4b-b169-4bfa624c479c', '281eadb7-13d2-471c-a446-56bc6e6816f9', '#ORD-000000049', 'served', 'normal', NULL, '2026-01-14 05:25:35.323+00', '2026-01-14 06:05:02.957+00', '2026-01-14 02:58:09.701621+00'),
	('d128ea93-8f30-409a-8dde-6b2941ce23d2', 'ef5a607d-bae3-4716-a7fd-9dd8ddc98d0a', '#ORD-000000091', 'served', 'normal', '2d3b91dd-cfb1-4df2-80ca-dae63ad60064', '2026-01-14 06:33:59.154+00', '2026-01-14 06:34:02.247+00', '2026-01-14 06:00:12.451049+00'),
	('1866d02a-99c7-4fec-b324-2589f12b77e0', 'ca1b314a-df3d-4157-a5a1-f53d62b85310', '#ORD-000000050', 'served', 'normal', NULL, '2026-01-14 05:51:02.347+00', '2026-01-14 06:05:03.491+00', '2026-01-14 03:00:37.750787+00'),
	('83df5b1c-e7a6-4e9b-bb5c-c136d676fa7a', 'b4fff3ff-8c19-480c-9b95-070172fb0608', '#ORD-000000054', 'served', 'normal', NULL, '2026-01-14 05:25:45.008+00', '2026-01-14 06:05:03.837+00', '2026-01-14 03:09:27.127197+00'),
	('2bcc231d-9957-4e0a-8ab2-96177e609262', '246dae95-68bd-4eb6-913e-b570cac05284', '#ORD-000000056', 'served', 'normal', NULL, '2026-01-14 05:25:41.14+00', '2026-01-14 06:05:04.04+00', '2026-01-14 03:44:15.471436+00'),
	('d4e58286-7c23-4a93-978e-174e1652d902', '7f04847d-d5b5-4ac8-82fd-7f6b3ce383fb', '#ORD-000000092', 'served', 'normal', '2d3b91dd-cfb1-4df2-80ca-dae63ad60064', '2026-01-14 06:33:59.341+00', '2026-01-14 06:34:02.449+00', '2026-01-14 06:02:03.103057+00'),
	('98c401cf-b1eb-4a2d-8427-f4868535502d', 'fd61194a-22cc-405e-a825-2f7b98872d86', '#ORD-000000094', 'served', 'normal', '2d3b91dd-cfb1-4df2-80ca-dae63ad60064', '2026-01-14 06:33:59.802+00', '2026-01-14 06:34:02.75+00', '2026-01-14 06:02:27.343223+00'),
	('92393ae8-56ea-4376-a643-c7f3c25dad3f', '8a9bc099-8de9-4b2b-b53c-626c17e120a3', '#ORD-000000100', 'preparing', 'normal', 'df5cd809-1daf-4c94-8d7b-14fba684c3dd', '2026-01-14 06:38:36.083+00', NULL, '2026-01-14 06:34:40.664818+00'),
	('5902aa7b-65b1-44d4-a6ff-3a220f52782d', '013019c7-8e60-4339-9e67-0a66acae32d7', '#ORD-000000108', 'ready', 'normal', 'df5cd809-1daf-4c94-8d7b-14fba684c3dd', '2026-01-14 07:08:06.998+00', '2026-01-14 07:08:07.835+00', '2026-01-14 06:42:56.735123+00'),
	('a0c6008f-6b4b-411d-98f4-aa0bec5b5675', '96230496-274b-42c3-a429-29e60369516e', '#ORD-000000034', 'served', 'normal', 'Bar', '2026-01-14 05:25:20.528+00', '2026-01-14 06:04:53.096+00', '2026-01-14 02:04:52.058703+00'),
	('9d75844e-6afe-4d7a-b440-c697d6aa961b', '6fc7c4f7-2118-4d68-8354-7e63230409a2', '#ORD-000000038', 'served', 'normal', 'Bar', '2026-01-14 05:25:23.62+00', '2026-01-14 06:04:53.291+00', '2026-01-14 02:24:17.675338+00'),
	('322f106d-6966-4c71-96a0-b374066438c8', '2691e87d-8267-4d24-8be0-bed59243af5d', '#ORD-000000040', 'served', 'normal', 'Bar', '2026-01-14 05:25:25.13+00', '2026-01-14 06:04:53.464+00', '2026-01-14 02:40:48.720389+00'),
	('8ef0897d-48da-44fb-83ee-e41685cb2ed3', 'cfebb86b-702f-4192-a3ba-fd2a054fcaeb', '#ORD-000000044', 'served', 'normal', 'Bar', '2026-01-14 05:50:53.919+00', '2026-01-14 06:04:53.654+00', '2026-01-14 02:48:08.572331+00'),
	('01a47fc6-d61f-4c96-b2df-2d846f3204bd', 'a6241673-ac59-4538-b8fb-74038040d4d4', '#ORD-000000052', 'served', 'normal', 'Bar', '2026-01-14 05:50:54.946+00', '2026-01-14 06:04:53.817+00', '2026-01-14 03:08:00.662097+00'),
	('9e8235be-58c1-491e-ad69-9b104ae4af6d', '47c11b0d-54ce-44f3-a709-f55d12bcf6ab', '#ORD-000000060', 'served', 'normal', 'Bar', '2026-01-14 06:04:48.227+00', '2026-01-14 06:04:54.128+00', '2026-01-14 04:48:05.471119+00'),
	('850e48e2-1f37-417e-91ed-4d9720cf7711', 'd3e8a358-cd19-4d8b-bb03-4d7ad8f9b434', '#ORD-000000113', 'cancelled', 'normal', 'df5cd809-1daf-4c94-8d7b-14fba684c3dd', '2026-01-14 07:08:30.537+00', NULL, '2026-01-14 07:01:17.967942+00'),
	('ed4bb52d-7ef5-40d2-b5bb-62e40677de0c', '0bef4345-be6a-4eed-bb55-abbb2e9d5f7d', '#ORD-000000101', 'ready', 'normal', '2d3b91dd-cfb1-4df2-80ca-dae63ad60064', '2026-01-14 06:39:28.273+00', '2026-01-18 01:25:12.166+00', '2026-01-14 06:34:56.497281+00'),
	('44055202-ecd2-49cd-871e-9cf9f52ed866', '2a3c0996-c59a-4471-8d1e-8c8053a656d3', '#ORD-000000114', 'served', 'normal', '2d3b91dd-cfb1-4df2-80ca-dae63ad60064', '2026-01-14 07:08:50.134+00', '2026-01-18 01:25:10.149+00', '2026-01-14 07:02:12.789898+00'),
	('d5913681-84a7-4d20-9b36-f9ac3cab0d9f', 'd30c69b2-bc06-4239-9135-ace422fb7f01', '#ORD-000000123', 'preparing', 'normal', 'df5cd809-1daf-4c94-8d7b-14fba684c3dd', '2026-01-14 07:28:36.564+00', NULL, '2026-01-14 07:28:05.145283+00'),
	('ce47cb38-bdfa-4cb6-8355-521850f7b34e', '5a46ec72-b2f9-4d8a-bfae-356ac54aed63', '#ORD-000000126', 'pending', 'normal', '2d3b91dd-cfb1-4df2-80ca-dae63ad60064', NULL, NULL, '2026-01-14 08:35:30.264013+00'),
	('dfb4800e-a30a-4db0-adef-2fc1ee5dfe75', '3ffe95c0-5a11-4f53-aae9-b0e9db131e57', '#ORD-000000109', 'served', 'normal', '2d3b91dd-cfb1-4df2-80ca-dae63ad60064', '2026-01-14 07:08:12.337+00', '2026-01-18 01:25:08.168+00', '2026-01-14 06:48:33.796696+00'),
	('9477a6f8-bb3e-4a2f-96de-1edad4dcbf39', '406a6175-2cd3-4146-a770-5498ffbee5e2', '#ORD-000000119', 'pending', 'normal', '2d3b91dd-cfb1-4df2-80ca-dae63ad60064', NULL, NULL, '2026-01-14 07:19:56.646612+00'),
	('39fd573c-2e2b-4865-8f58-b809098e8942', '260260db-5c0b-4aad-82a3-4fb14c0496ed', '#ORD-000000127', 'preparing', 'normal', '2d3b91dd-cfb1-4df2-80ca-dae63ad60064', '2026-01-14 09:20:34.885+00', NULL, '2026-01-14 08:36:19.021788+00'),
	('f80064c8-9d71-4a94-bad3-3b3c4a59e9f6', 'a8265918-7943-498d-bcde-49699e08579e', '#ORD-000000130', 'served', 'normal', 'df5cd809-1daf-4c94-8d7b-14fba684c3dd', '2026-01-18 01:28:05.28+00', '2026-01-18 01:28:32.031+00', '2026-01-14 08:46:01.761086+00'),
	('341befee-6e92-414d-a33e-c692506c8d9d', '438e983a-1c86-4e51-9de5-d008565e7484', '#ORD-000000156', 'ready', 'normal', NULL, '2026-01-18 01:35:59.717+00', '2026-01-18 01:36:12.196+00', '2026-01-18 01:24:42.966368+00'),
	('e15c0ce7-0a8f-4813-89ae-767c6db9ad44', '9c6e9f72-509b-41ec-ac24-3e7a500f3a6a', '#ORD-000000149', 'ready', 'normal', NULL, '2026-01-18 01:32:45.799+00', '2026-01-18 01:37:16.5+00', '2026-01-14 18:08:00.741482+00'),
	('8538b7c1-2956-4d49-a2ee-7dfdac632ba7', 'da50ee3b-dcae-4ebb-bff0-cc88d6f1a64b', '#ORD-000000161', 'pending', 'normal', NULL, NULL, NULL, '2026-01-18 01:42:57.7787+00');


--
-- Data for Name: menu_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."menu_items" ("id", "name", "description", "category", "selling_price", "waste_percentage", "labor_cost", "status", "created_at", "updated_at", "total_cost", "contribution_margin", "image_url", "item_type", "stock_ingredient_id") VALUES
	('f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 'Coffee Macchiato', 'coffee with caramel', 'Drinks', 160.00, 2.00, 25.00, 'active', '2026-01-11 12:27:36.530799+00', '2026-01-11 12:27:36.530799+00', 25.00, 135.00, 'https://okvtephxpcacqzrmmcaw.supabase.co/storage/v1/object/public/menu-images/0.7421197881092809.png', 'standard', NULL),
	('5a76b05b-e03e-44e1-976d-b0a764ef0048', 'Water', 'Water', 'Drinks', 20.00, 0.00, 0.00, 'active', '2026-01-14 14:52:09.001592+00', '2026-01-14 15:45:13.348044+00', 10.00, 10.00, 'https://okvtephxpcacqzrmmcaw.supabase.co/storage/v1/object/public/menu-images/1b0f2dc2-08bf-492e-89e1-ce08de558f74/e4966de7-ba11-4252-aaf1-afbf185cf0b3.png', 'simple', 'd4f32505-6829-4def-bf90-f73f44d9525a'),
	('b4a4f508-e181-4b98-af0a-0cd63e2a4b28', 'Drinking Water', 'Drinking Water', 'Drinks', 0.00, 0.00, 0.00, 'active', '2026-01-18 01:39:50.645701+00', '2026-01-18 01:39:50.645701+00', 25.00, -25.00, '', 'simple', '5241aa62-33b4-4ceb-b546-a71136594470'),
	('2d41ae5d-0568-41b6-acd1-9c83871ca151', 'Coffee Americano', 'coffee americano - no sugar', 'Drinks', 160.00, 1.50, 20.00, 'deactivated', '2026-01-11 10:20:18.035597+00', '2026-01-18 03:42:33.591372+00', 30.15, 129.85, 'https://okvtephxpcacqzrmmcaw.supabase.co/storage/v1/object/public/menu-images/0.1674505241970986.png', 'standard', NULL);


--
-- Data for Name: kds_order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."kds_order_items" ("id", "kds_order_id", "menu_item_id", "quantity", "notes", "status") VALUES
	('baee17e5-e713-4ff3-a63c-04c65716923e', '09293118-40d7-40ee-a0e2-cb0c9552bcaf', '2d41ae5d-0568-41b6-acd1-9c83871ca151', 1, NULL, 'pending'),
	('1e04f6b2-6863-4bfc-930b-50a100b27ecb', '09293118-40d7-40ee-a0e2-cb0c9552bcaf', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, NULL, 'pending'),
	('3c123fdf-190c-4cac-900d-d930dee1c253', '49c0da6b-cd94-4f78-aa46-769f3bdd534c', '2d41ae5d-0568-41b6-acd1-9c83871ca151', 3, NULL, 'pending'),
	('17fbb4f9-dd31-463f-a23c-c23a53c653ce', 'def8c4a3-0fd4-4658-824b-7eca8c8366b7', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, NULL, 'pending'),
	('45043459-0614-47f5-af1c-4d4ca7ba5f6f', 'def8c4a3-0fd4-4658-824b-7eca8c8366b7', '2d41ae5d-0568-41b6-acd1-9c83871ca151', 2, NULL, 'pending'),
	('e5ce4cd0-eefe-4f0c-be17-101fa87f4acf', 'd8f644b9-0853-489c-a8e8-75abce4eba91', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, NULL, 'pending'),
	('d9a27519-0533-448a-80e5-eb1801327711', '54898ce7-54b0-433a-8cc4-7807cab4f370', '2d41ae5d-0568-41b6-acd1-9c83871ca151', 8, NULL, 'pending'),
	('6e439006-69c6-4b04-9afe-a35c94e8290a', 'c9cc3772-b452-4883-b496-c2f8a68af12a', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, NULL, 'pending'),
	('a7336d15-5bdf-4244-bf60-c190acd63672', 'e25d1215-c163-414e-896e-86e3be265d68', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 2, NULL, 'pending'),
	('a01290b8-5d08-4a12-a242-d7f366835e01', '821c4183-8550-4817-8188-b216eff5cb0c', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, NULL, 'pending'),
	('6cced898-8a99-4043-945f-ed97d080df02', '04fbbfa5-b063-4f13-adf4-0f9a5ff7de1c', '2d41ae5d-0568-41b6-acd1-9c83871ca151', 2, NULL, 'pending'),
	('aed7ae95-764e-4ffa-aa2b-133d0fe44bdc', '203e8961-99c2-4df4-931f-edca1833faff', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 3, NULL, 'pending'),
	('48e5e8cb-0874-4ab8-b168-ec212f19f03f', '4a830b76-8e7e-497e-b974-8b3b6dfbda1e', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 4, NULL, 'pending'),
	('f2f49f71-35cf-4434-bebd-6823a78c7398', '6421475b-3f10-4e14-82e9-d4805cab9fea', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, NULL, 'pending'),
	('dd68d36c-7674-4d35-97ee-9b5899c82f8c', 'a0c6008f-6b4b-411d-98f4-aa0bec5b5675', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, NULL, 'pending'),
	('0c1a87c5-a282-4d1a-a9a6-67d4642e36cd', 'e68b162d-5556-4861-93f1-6e8e19d41ad7', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 5, NULL, 'pending'),
	('0893d8f8-01b4-4a91-9ce2-5a1e1fc8c1b8', '9d75844e-6afe-4d7a-b440-c697d6aa961b', '2d41ae5d-0568-41b6-acd1-9c83871ca151', 1, NULL, 'pending'),
	('f78d3c0e-c487-412f-a453-b25088da12ed', '322f106d-6966-4c71-96a0-b374066438c8', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, NULL, 'pending'),
	('a6cfb541-0098-4209-be67-b8694e3b7bbd', '8ef0897d-48da-44fb-83ee-e41685cb2ed3', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, NULL, 'pending'),
	('34e690a3-2f18-4924-bc0c-08716967bf40', 'f63b0ec4-5079-452d-8401-09f757c4f57b', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, NULL, 'pending'),
	('a770cae0-0235-461f-be4b-816efa0490fd', '1866d02a-99c7-4fec-b324-2589f12b77e0', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, NULL, 'pending'),
	('e6d03fdb-4e37-4832-852c-d053b66ef4a3', '01a47fc6-d61f-4c96-b2df-2d846f3204bd', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, NULL, 'pending'),
	('f8441bd4-d202-4fc9-beb7-195bc1f0a59d', '9e8235be-58c1-491e-ad69-9b104ae4af6d', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, NULL, 'pending'),
	('947173a0-38bb-49c1-adf9-d8b42c868977', '5db65d39-7c3b-4f0b-8806-7ece2d346946', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, NULL, 'pending'),
	('909d7ced-29f6-4554-bb48-4627c73ce8f5', '250502dd-00e8-4e7c-9791-9c82d926e76c', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, NULL, 'pending'),
	('68207df2-dd80-4dbc-a37e-bc2967ea985b', '89c4fee8-3838-4ed5-921d-aa317a22dee5', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, NULL, 'pending'),
	('7da63035-4253-4b1e-91ae-74e8de29d437', '534b64cc-2cf1-49a4-98b0-7c136bb97b46', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, NULL, 'pending'),
	('3b605b89-d821-4fea-bc25-361112a2a82b', 'd3dcacaf-7284-40f3-87d3-3dceba44ed0d', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, NULL, 'pending'),
	('5a30c4ab-527d-4ad0-85be-b2b9e47cca37', 'fc7d6352-e5d5-4e9d-beb5-7192ba6f510d', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, NULL, 'ready'),
	('572f1865-f0c1-4b8e-a77e-d1eab20c910b', 'a0ebba64-fabf-4f4b-b169-4bfa624c479c', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, NULL, 'ready'),
	('d8e13ef0-1d2d-43d3-b55a-7b5268df6bbc', 'a0ebba64-fabf-4f4b-b169-4bfa624c479c', '2d41ae5d-0568-41b6-acd1-9c83871ca151', 1, NULL, 'ready'),
	('20c7af2d-d697-4e7b-9e85-6149ea5b0a62', '83df5b1c-e7a6-4e9b-bb5c-c136d676fa7a', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, NULL, 'ready'),
	('ea639548-1c20-4552-b842-9f29f9dc6ed5', '2bcc231d-9957-4e0a-8ab2-96177e609262', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, NULL, 'ready'),
	('4a9c7772-89e8-46c2-8d00-5099eb5269c6', '0bc11cdf-9744-4e51-b6e1-bc54e9358275', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, NULL, 'ready'),
	('cfac9025-3690-4d96-b148-ec5a1a74891b', '4f8c436c-59a7-48d0-88af-fad69a35f028', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, NULL, 'ready'),
	('679cb101-03e0-495b-a370-de475f5fe85c', 'b106dc9e-9cee-48f7-aafb-59356a99e6cb', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, NULL, 'pending'),
	('a77eeaee-6e74-41b6-ae29-f5354a93f654', '0a363ab8-127b-4da9-8f10-ef673a389c11', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, NULL, 'pending'),
	('d5bb50aa-03fb-49ac-aa85-ba100548a8cc', 'f027db42-de59-48c6-9b0b-912f3ef23e68', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, NULL, 'pending'),
	('53fff988-4f73-4fa8-a05f-7596be62f5db', 'e7b6d872-7926-4b57-9cae-2540486ef24d', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 4, NULL, 'pending'),
	('bc3e854a-ced6-48e1-8c11-f8a37647001e', 'd4b48111-0bbf-440c-aea6-47ea911c1a0a', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, NULL, 'pending'),
	('69c1bbc1-c295-4173-8fae-0687ae9e97d4', 'd128ea93-8f30-409a-8dde-6b2941ce23d2', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, NULL, 'pending'),
	('05ecb229-6513-4db4-a148-0c1c9fa9981e', 'd4e58286-7c23-4a93-978e-174e1652d902', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, NULL, 'pending'),
	('365a85df-bcac-44be-8fbc-ded47693bb61', '98c401cf-b1eb-4a2d-8427-f4868535502d', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, NULL, 'pending'),
	('4c1ce566-1073-4393-ae21-efa8e9639649', '92393ae8-56ea-4376-a643-c7f3c25dad3f', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, NULL, 'pending'),
	('cd4827b2-95f9-4c2d-816f-c8b756e360c0', 'ed4bb52d-7ef5-40d2-b5bb-62e40677de0c', '2d41ae5d-0568-41b6-acd1-9c83871ca151', 1, NULL, 'pending'),
	('a4b4f40b-08cc-4502-99cb-55f979669d95', 'ac782fb1-e906-4173-b4a2-354a9275f601', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, NULL, 'pending'),
	('f884f55e-d7dd-4ad5-b8bd-84d188702d95', '5902aa7b-65b1-44d4-a6ff-3a220f52782d', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, NULL, 'pending'),
	('a1f844af-122c-4470-9847-69bf01584458', 'dfb4800e-a30a-4db0-adef-2fc1ee5dfe75', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, NULL, 'pending'),
	('20c583f4-5de1-4e66-b36b-5b2b1f961974', 'dfb4800e-a30a-4db0-adef-2fc1ee5dfe75', '2d41ae5d-0568-41b6-acd1-9c83871ca151', 1, NULL, 'pending'),
	('09ed9d7b-6d53-4a05-ba1e-54c93959e3c8', '850e48e2-1f37-417e-91ed-4d9720cf7711', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, NULL, 'pending'),
	('8d3362d8-8d4c-4195-884f-89fbb729d078', '44055202-ecd2-49cd-871e-9cf9f52ed866', '2d41ae5d-0568-41b6-acd1-9c83871ca151', 1, NULL, 'pending'),
	('5911c367-ccbd-48b1-b7e4-3cdaf06ee8ea', 'd5913681-84a7-4d20-9b36-f9ac3cab0d9f', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 7, NULL, 'pending'),
	('a0730673-3330-4fca-aea7-31b81ea927f0', 'ce47cb38-bdfa-4cb6-8355-521850f7b34e', '2d41ae5d-0568-41b6-acd1-9c83871ca151', 4, NULL, 'pending'),
	('10bdb439-dc3b-4d0e-933b-188841571395', '39fd573c-2e2b-4865-8f58-b809098e8942', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, NULL, 'pending'),
	('1e333b03-19c9-408b-bb46-521d2d15c467', '9477a6f8-bb3e-4a2f-96de-1edad4dcbf39', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, NULL, 'pending'),
	('89617603-9805-41d2-a112-134a361e90bd', 'f80064c8-9d71-4a94-bad3-3b3c4a59e9f6', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, NULL, 'pending');


--
-- Data for Name: kitchen_displays; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."kitchen_displays" ("id", "name", "token", "created_at") VALUES
	('df5cd809-1daf-4c94-8d7b-14fba684c3dd', 'Main Kitchen', '7e84ea14-188a-4052-9080-548edf64e386', '2026-01-11 13:48:18.230176+00'),
	('2d3b91dd-cfb1-4df2-80ca-dae63ad60064', 'Bar', 'cfcb77c7-dbad-42ea-862a-809b8e8922d3', '2026-01-11 13:48:21.507451+00');


--
-- Data for Name: locations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."locations" ("id", "name", "address", "created_at") VALUES
	('ed331552-b955-470d-b2fd-0a94c3f98507', 'Storage', 'Main branch', '2026-01-11 09:10:29.536204+00');


--
-- Data for Name: menu_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."menu_categories" ("id", "name", "description", "sort_order", "created_at", "updated_at") VALUES
	('61b83d38-0a33-42c1-9051-63cb256777e0', 'Desserts', 'all desserts here', 0, '2026-01-11 10:17:19.967007+00', '2026-01-11 10:17:19.967007+00'),
	('5691b0d7-d8a5-4692-98cb-d6692ff13475', 'Appetizers', 'all appetizers here', 0, '2026-01-11 10:17:31.00381+00', '2026-01-11 10:17:31.00381+00'),
	('628fa50b-590f-4702-9afb-5ccc4ef3a831', 'Breakfast', 'all breakfast menu here', 0, '2026-01-11 10:17:40.013887+00', '2026-01-11 10:17:40.013887+00'),
	('579fe05a-6e02-4544-a42c-21ce139c531f', 'Main Course', 'all main course here', 0, '2026-01-11 10:17:49.493928+00', '2026-01-11 10:17:49.493928+00'),
	('07fbf067-7518-49d0-8f28-9e53e9528c0d', 'Drinks', 'all drinks here', 0, '2026-01-11 10:17:58.360001+00', '2026-01-11 10:17:58.360001+00');


--
-- Data for Name: order_number_counters; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."order_number_counters" ("last_number", "updated_at") VALUES
	(173, '2026-01-18 09:04:55.374485+00');


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."profiles" ("id", "email", "full_name", "role", "created_at") VALUES
	('1b0f2dc2-08bf-492e-89e1-ce08de558f74', 'menjilx@gmail.com', 'Menj', 'owner', '2026-01-10 16:28:13.171759+00');


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."suppliers" ("id", "name", "contact_person", "email", "phone", "address", "notes", "created_at") VALUES
	('405cf512-ed1d-4835-b328-990d5b05d2f3', 'YanYan Trading', 'John Doe', 'jd@yanyan.com', '09177094919', 'Dumaguete City', 'for raw materials in the kitchen like for baking and pastries ', '2026-01-11 09:59:11.727824+00'),
	('c532d80e-3b7a-4804-83b6-d4932fe0a1a7', 'Robinson', 'Mr. Rob', 'rob@robinson.com', '0911111', 'Dumaguete City', 'meet supplier', '2026-01-11 17:36:06.1689+00');


--
-- Data for Name: purchases; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."purchases" ("id", "supplier_id", "invoice_number", "invoice_date", "total_amount", "notes", "created_at", "created_by") VALUES
	('cf5c9eab-3980-459e-819c-0b88b1397cad', '405cf512-ed1d-4835-b328-990d5b05d2f3', 'inv-0001', '2026-01-11', 16900.00, 'initial stocks', '2026-01-11 11:19:39.55614+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74'),
	('7113d91e-ae23-422d-9022-429554837a09', '405cf512-ed1d-4835-b328-990d5b05d2f3', 'inv-0002', '2026-01-12', 720.00, 'additional stocks', '2026-01-11 17:22:30.444599+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74'),
	('bb274185-2e88-4884-89a1-02568bc2c77c', 'c532d80e-3b7a-4804-83b6-d4932fe0a1a7', 'inv-0003', '2026-01-12', 2760.00, 'initial stock for meet', '2026-01-11 17:36:45.70002+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74'),
	('ab49ddc4-3dbe-4577-b408-2c9ec55618c2', 'c532d80e-3b7a-4804-83b6-d4932fe0a1a7', 'inv-00010', '2026-01-14', 1000.00, 'initial stock for bottled water', '2026-01-14 15:08:22.48116+00', '1b0f2dc2-08bf-492e-89e1-ce08de558f74');


--
-- Data for Name: purchase_attachments; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."purchase_attachments" ("id", "purchase_id", "file_name", "file_url", "file_type", "file_size", "created_at", "updated_at") VALUES
	('6d3d1105-06d9-4eef-9959-1fef6fd39fdc', 'cf5c9eab-3980-459e-819c-0b88b1397cad', 'SCR-20260111-qrut.png', 'https://pub-a4da0d98ef494fbc968a352d6f9f5659.r2.dev/74db8d3e-088b-4258-ab12-f7baba18be10.png', 'image/png', 177770, '2026-01-11 11:39:03.603515+00', '2026-01-11 11:39:03.603515+00');


--
-- Data for Name: purchase_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."purchase_items" ("id", "purchase_id", "ingredient_id", "quantity", "unit_price", "location_id", "total_price") VALUES
	('213360ae-2d8f-4ef9-9584-8f2096897e0c', 'cf5c9eab-3980-459e-819c-0b88b1397cad', 'b68fd9f2-924f-4b7f-9dab-3462e0cd6169', 10.00, 1000.00, 'ed331552-b955-470d-b2fd-0a94c3f98507', 10000.00),
	('6698ddc5-2f63-4a0c-8da4-41d719bfd1ba', 'cf5c9eab-3980-459e-819c-0b88b1397cad', 'd36e9747-9868-4ed3-977e-613fdc66d1ea', 10.00, 190.00, 'ed331552-b955-470d-b2fd-0a94c3f98507', 1900.00),
	('4ce629ae-b717-42a2-9ed8-a6a1089141df', 'cf5c9eab-3980-459e-819c-0b88b1397cad', '4785e0ce-95c2-4bed-8c26-2bb4a9c6ed51', 10.00, 500.00, 'ed331552-b955-470d-b2fd-0a94c3f98507', 5000.00),
	('73cad1a4-0c8a-441a-af29-c266b6899c43', 'cf5c9eab-3980-459e-819c-0b88b1397cad', '507c2806-1f0e-4c77-ae75-7e63e022adde', 10.00, 360.00, 'ed331552-b955-470d-b2fd-0a94c3f98507', 3600.00),
	('520840d1-81e8-4b7f-a3ca-2eedb868fff8', '7113d91e-ae23-422d-9022-429554837a09', '507c2806-1f0e-4c77-ae75-7e63e022adde', 2.00, 360.00, 'ed331552-b955-470d-b2fd-0a94c3f98507', 720.00),
	('2ac32a20-b70d-4697-ada6-2a912d287ba0', 'bb274185-2e88-4884-89a1-02568bc2c77c', 'e9e2e0f4-1230-4ac4-85ee-eb7edf3e2bad', 6.00, 460.00, 'ed331552-b955-470d-b2fd-0a94c3f98507', 2760.00),
	('4fb61234-8d8c-4f7d-ab15-0ff5e6ba3db2', 'ab49ddc4-3dbe-4577-b408-2c9ec55618c2', 'd4f32505-6829-4def-bf90-f73f44d9525a', 100.00, 10.00, 'ed331552-b955-470d-b2fd-0a94c3f98507', 1000.00);


--
-- Data for Name: recipes; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: recipe_ingredients; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: recipe_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."recipe_items" ("id", "menu_item_id", "ingredient_id", "quantity", "created_at") VALUES
	('f0212203-142d-483d-8364-6ea62b6fae2b', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', '507c2806-1f0e-4c77-ae75-7e63e022adde', 5.00, '2026-01-11 12:27:36.64713+00'),
	('f17b8739-e1a7-4d82-bbb9-5319f4142dc4', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 'b68fd9f2-924f-4b7f-9dab-3462e0cd6169', 10.00, '2026-01-11 12:27:36.64713+00'),
	('49ec87a8-fac5-4262-913c-5d300717f729', '2d41ae5d-0568-41b6-acd1-9c83871ca151', 'b68fd9f2-924f-4b7f-9dab-3462e0cd6169', 20.00, '2026-01-11 12:17:45.248218+00');


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."role_permissions" ("id", "role", "permissions", "created_at", "updated_at") VALUES
	('a335cc3f-48cd-400b-810d-5d615e058152', 'manager', '["view_dashboard", "operations_pos", "operations_sales", "operations_reservations", "operations_customers", "menu_items", "menu_tables", "inventory_ingredients", "inventory_stock", "inventory_purchases", "inventory_suppliers"]', '2026-01-12 08:08:50.126463+00', '2026-01-12 08:08:50.126463+00'),
	('5d78a0d2-4281-462b-9866-eba06031aa35', 'staff', '["operations_pos", "operations_reservations", "inventory_stock"]', '2026-01-12 08:08:50.50904+00', '2026-01-12 08:08:50.50904+00');


--
-- Data for Name: sale_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."sale_items" ("id", "sale_id", "menu_item_id", "quantity", "unit_price", "notes", "total_price") VALUES
	('7d8e012a-ce67-4440-bf69-f7dc90771f42', '93633f74-57a9-4e00-9670-1e96ce9c9a33', '2d41ae5d-0568-41b6-acd1-9c83871ca151', 1, 160.00, NULL, 160.00),
	('9d86dfa2-114c-43f9-80dd-c4cf2ced3d53', '93633f74-57a9-4e00-9670-1e96ce9c9a33', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, 160.00, NULL, 160.00),
	('20defb55-93ac-4cdb-8302-9daf369b5b84', '431ed599-bc71-40e1-b33f-8efddb3b1023', '2d41ae5d-0568-41b6-acd1-9c83871ca151', 3, 160.00, NULL, 480.00),
	('0faab6b1-5a22-4d66-9547-a35cdf144f0e', '75c52383-1bbf-499b-86c8-8c6813e2fb39', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, 160.00, NULL, 160.00),
	('ff7416eb-0bc1-4162-ae18-f481100ee709', '75c52383-1bbf-499b-86c8-8c6813e2fb39', '2d41ae5d-0568-41b6-acd1-9c83871ca151', 2, 160.00, NULL, 320.00),
	('d2e5a46c-cecf-45a1-b764-df5f17e3f9a4', '2faaf4fe-b6c4-4fc6-876a-67da92473115', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, 160.00, NULL, 160.00),
	('097e4a1a-aab5-42bd-98c1-7c48e87a555e', '584e9d88-1a18-48ed-9356-47270806d141', '2d41ae5d-0568-41b6-acd1-9c83871ca151', 8, 160.00, NULL, 1280.00),
	('a05b1737-5494-43dd-885e-f97bad6d9347', 'c2a91d8f-f43b-47bc-a3c8-6c9bc7958ab5', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, 160.00, NULL, 160.00),
	('3f93f761-9031-49b0-9cd2-ab0e07081a67', 'c7433f31-8e5a-40e4-8693-9693598c0935', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 2, 160.00, NULL, 320.00),
	('e35f81be-3f68-43dc-b8a2-8e480350a921', '589731ac-9b13-4aae-bbc7-5083e94c5af1', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, 160.00, NULL, 160.00),
	('d575a3fe-6e1e-4f28-8082-ae31b8045961', 'fb6838ea-b40d-4b98-ab9b-24103f7fa815', '2d41ae5d-0568-41b6-acd1-9c83871ca151', 2, 160.00, NULL, 320.00),
	('88dbfcd7-3e3d-4563-9278-0529060e6eef', '8b6e0767-e72f-4052-a60a-556476c5d5f9', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 3, 160.00, NULL, 480.00),
	('089cdd8e-36d8-4535-bf18-c31e2f915257', '45a31649-ab56-4365-b15a-d278c71077c7', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 4, 160.00, NULL, 640.00),
	('b862815b-31a5-4a0d-a1ae-f5c961113f3b', 'b9e97a64-0948-48c4-a948-08606630915d', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, 160.00, NULL, 160.00),
	('72a888ff-9d18-4dcb-a9f3-f7af25e62784', '96230496-274b-42c3-a429-29e60369516e', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, 160.00, NULL, 160.00),
	('d9132fe4-80d6-4f92-b00a-07f5d969732e', '1b89a379-1e5d-4e19-9ced-b75c22544abe', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 5, 160.00, NULL, 800.00),
	('de0af42d-3ebf-4a34-b83a-efc0cc38b62b', '6fc7c4f7-2118-4d68-8354-7e63230409a2', '2d41ae5d-0568-41b6-acd1-9c83871ca151', 1, 160.00, NULL, 160.00),
	('07fbf8e1-d5c2-4675-b8a7-83d0be7d7ecc', '2691e87d-8267-4d24-8be0-bed59243af5d', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, 160.00, NULL, 160.00),
	('7e0c403a-83b2-4bc3-8d55-aef597aea128', 'e436ec0c-b91d-476c-ac32-30ffa16692ec', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, 160.00, NULL, 160.00),
	('f221e08f-df17-4420-b2ab-b57b23174293', 'cfebb86b-702f-4192-a3ba-fd2a054fcaeb', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, 160.00, NULL, 160.00),
	('b627e3f4-6ff2-4422-b70b-f36c2a835032', 'bf523a8c-9321-40fd-a506-271e7b1cb3a7', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, 160.00, NULL, 160.00),
	('9b4f56fe-c58e-4b21-ac32-2b94d1836482', '281eadb7-13d2-471c-a446-56bc6e6816f9', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, 160.00, NULL, 160.00),
	('65f34e43-48d3-4a35-89b5-2a01ec04a66e', '281eadb7-13d2-471c-a446-56bc6e6816f9', '2d41ae5d-0568-41b6-acd1-9c83871ca151', 1, 160.00, NULL, 160.00),
	('3567f0e2-88f5-41c4-9822-134142c0b282', 'ca1b314a-df3d-4157-a5a1-f53d62b85310', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, 160.00, NULL, 160.00),
	('ee7bd3be-dd98-4f0c-9625-488df13c9cdc', 'a6241673-ac59-4538-b8fb-74038040d4d4', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, 160.00, NULL, 160.00),
	('0b18b4cf-f586-48ce-a496-005f28b88d77', 'b4fff3ff-8c19-480c-9b95-070172fb0608', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, 160.00, NULL, 160.00),
	('dbe4bbd8-8d90-49cf-9b2b-43f61bc650ad', '246dae95-68bd-4eb6-913e-b570cac05284', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, 160.00, NULL, 160.00),
	('86979481-8b57-4f13-b408-8ed0236ae70f', '8a0bc951-c2f8-4d6d-ab87-d1c745930124', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, 160.00, NULL, 160.00),
	('fa307265-a1c9-44a8-a674-bd0c9614f3c8', '47c11b0d-54ce-44f3-a709-f55d12bcf6ab', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, 160.00, NULL, 160.00),
	('13f4c559-821f-4388-b67b-b32125c79461', 'ceeae9bf-7633-4afe-89f0-308fc12e8e70', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, 160.00, NULL, 160.00),
	('80c87a03-1871-4735-af90-e2b5d5b8d15a', '32c0f28c-fac3-42d6-905f-6308dc0a67a1', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, 160.00, NULL, 160.00),
	('359b0eb9-76df-483b-8d03-dd17d524b43d', '1b04abaf-d08e-48bc-a397-5e8a0f3c62ac', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, 160.00, NULL, 160.00),
	('b6d7ad9f-a41f-4e95-bc08-383a2089afbd', 'c3c24efa-89bc-4308-b5c1-03cd08b42b12', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, 160.00, NULL, 160.00),
	('98aead26-ff52-496f-b7e6-9b1c98e05c1a', '892c0f92-8728-4b74-8d92-30a1395daf3b', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, 160.00, NULL, 160.00),
	('1c26d7c4-4455-4726-99dd-c40c14606b2b', '0c17230e-e8ad-4a2f-aac6-93acb4034f81', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, 160.00, NULL, 160.00),
	('fd61bd08-3b27-4573-b2c3-20d49ae5f6a8', '28386f3f-affb-4abf-a716-fc005e07b95f', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, 160.00, NULL, 160.00),
	('f24c26bd-4cd1-4024-9aee-ef01479a2053', '175890b1-fdb7-4194-ac34-b53533a569b1', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, 160.00, NULL, 160.00),
	('db1108bf-bca3-47e2-af14-ffaa768726bf', '0c84e429-7ead-4359-8d4e-527f64770da5', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, 160.00, NULL, 160.00),
	('1f1bce97-a032-47ee-a157-8b59a7f43fd7', '2b669e92-36b3-480c-bb13-922d5a1b7774', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 4, 160.00, NULL, 640.00),
	('445160c4-cd16-45d2-84e0-829113b845e4', 'cb20e693-8ea2-45b4-97d2-315cfe3f7e81', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, 160.00, NULL, 160.00),
	('da0698cd-e3b8-4be3-bd20-7c4a49d5843d', 'ef5a607d-bae3-4716-a7fd-9dd8ddc98d0a', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, 160.00, NULL, 160.00),
	('b1f3069a-5d95-4aa5-84f9-f1f86d7324b0', '7f04847d-d5b5-4ac8-82fd-7f6b3ce383fb', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, 160.00, NULL, 160.00),
	('942cbe83-09b4-4753-ae04-bbbd6bd0a146', 'fd61194a-22cc-405e-a825-2f7b98872d86', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, 160.00, NULL, 160.00),
	('326c2121-a237-42fa-ab0a-5bc6feff2554', '8a9bc099-8de9-4b2b-b53c-626c17e120a3', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, 160.00, NULL, 160.00),
	('58d60acf-d797-4c26-ae34-b07393fd1499', '0bef4345-be6a-4eed-bb55-abbb2e9d5f7d', '2d41ae5d-0568-41b6-acd1-9c83871ca151', 1, 160.00, NULL, 160.00),
	('aa3360da-ed23-4583-a9be-ed9dc003a486', 'f6e94687-e972-49f0-b9e3-538e80b25858', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, 160.00, NULL, 160.00),
	('81d162d1-8124-4f35-9085-66f9f49aa93b', '013019c7-8e60-4339-9e67-0a66acae32d7', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, 160.00, NULL, 160.00),
	('bd72634a-f0cc-412d-b2d6-74a293dc9001', '3ffe95c0-5a11-4f53-aae9-b0e9db131e57', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, 160.00, NULL, 160.00),
	('a4064537-b45e-4f06-b124-747e4afd552a', '3ffe95c0-5a11-4f53-aae9-b0e9db131e57', '2d41ae5d-0568-41b6-acd1-9c83871ca151', 1, 160.00, NULL, 160.00),
	('e7164b9b-c88e-465c-a2e1-87ecbd30c4b0', 'd3e8a358-cd19-4d8b-bb03-4d7ad8f9b434', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, 160.00, NULL, 160.00),
	('0b46d433-51ec-409e-8cfc-507948d7954c', '2a3c0996-c59a-4471-8d1e-8c8053a656d3', '2d41ae5d-0568-41b6-acd1-9c83871ca151', 1, 160.00, NULL, 160.00),
	('fbd70b93-c5e6-4f2d-994f-c9897518d4e6', 'd30c69b2-bc06-4239-9135-ace422fb7f01', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 7, 160.00, NULL, 1120.00),
	('e356766b-e282-4cd8-9a5e-8a153e5e4f68', '5a46ec72-b2f9-4d8a-bfae-356ac54aed63', '2d41ae5d-0568-41b6-acd1-9c83871ca151', 4, 160.00, NULL, 640.00),
	('220ebe63-b480-42ed-8114-440de25715d6', '260260db-5c0b-4aad-82a3-4fb14c0496ed', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, 160.00, NULL, 160.00),
	('bdd6b4ae-7386-4c92-a4df-d5e7f045f52e', '406a6175-2cd3-4146-a770-5498ffbee5e2', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, 160.00, NULL, 160.00),
	('26c4e35e-ac12-4e24-be4c-8b7f4c1fa0a2', 'a8265918-7943-498d-bcde-49699e08579e', 'f4fa8b14-98d0-4d69-a44d-e9d75dd3240f', 1, 160.00, NULL, 160.00);


--
-- Data for Name: stock; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."stock" ("id", "ingredient_id", "location_id", "quantity", "last_updated") VALUES
	('0dca0a19-d87e-482c-a920-665f1b80d8bc', 'b68fd9f2-924f-4b7f-9dab-3462e0cd6169', 'ed331552-b955-470d-b2fd-0a94c3f98507', 10.00, '2026-01-11 11:38:43.415038+00'),
	('43d4818f-fdf5-4e7b-a544-ef49908ca54a', 'd36e9747-9868-4ed3-977e-613fdc66d1ea', 'ed331552-b955-470d-b2fd-0a94c3f98507', 10.00, '2026-01-11 11:38:43.415038+00'),
	('e82a8529-cad0-4133-aa13-793a9aa45389', '4785e0ce-95c2-4bed-8c26-2bb4a9c6ed51', 'ed331552-b955-470d-b2fd-0a94c3f98507', 10.00, '2026-01-11 11:38:43.415038+00'),
	('b880a921-f832-47c9-90cc-308190a7b21c', '507c2806-1f0e-4c77-ae75-7e63e022adde', 'ed331552-b955-470d-b2fd-0a94c3f98507', 12.00, '2026-01-11 17:22:30.579754+00'),
	('a88d2f25-82ea-441e-ab27-5b47c3b8048b', 'e9e2e0f4-1230-4ac4-85ee-eb7edf3e2bad', 'ed331552-b955-470d-b2fd-0a94c3f98507', 6.00, '2026-01-11 17:36:45.825399+00'),
	('f8e4b547-a09e-40e0-9bca-8c2ac1dc4c7d', 'd4f32505-6829-4def-bf90-f73f44d9525a', 'ed331552-b955-470d-b2fd-0a94c3f98507', 100.00, '2026-01-14 15:08:22.690781+00');


--
-- Data for Name: stock_adjustments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: stocktakes; Type: TABLE DATA; Schema: public; Owner: postgres
--


--
-- Data for Name: stocktake_items; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: postgres
-- (table dropped in single-tenant refactor)
--


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

TRUNCATE TABLE storage.buckets CASCADE;

INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") VALUES
	('menu-images', 'menu-images', NULL, '2026-01-11 12:22:13.489293+00', '2026-01-11 12:22:13.489293+00', true, false, NULL, NULL, NULL, 'STANDARD');


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."objects" ("id", "bucket_id", "name", "owner", "created_at", "updated_at", "last_accessed_at", "metadata", "version", "owner_id", "user_metadata") VALUES
	('65de1a6c-0d8f-412e-bacb-1a8c81617a96', 'menu-images', '0.1674505241970986.png', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', '2026-01-11 12:25:49.930113+00', '2026-01-11 12:25:49.930113+00', '2026-01-11 12:25:49.930113+00', '{"eTag": "\"ef05edacb9c31073faf58a6ac7beb501\"", "size": 1203223, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-01-11T12:25:50.000Z", "contentLength": 1203223, "httpStatusCode": 200}', 'bd9fc4a8-25e3-4506-a085-36111e58f3e6', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', '{}'),
	('f64b29cf-ca73-4908-8a46-d886750cd536', 'menu-images', '0.7421197881092809.png', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', '2026-01-11 12:26:57.82707+00', '2026-01-11 12:26:57.82707+00', '2026-01-11 12:26:57.82707+00', '{"eTag": "\"5b7bb692892f5b294a5b70a124cbbf47\"", "size": 760093, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-01-11T12:26:58.000Z", "contentLength": 760093, "httpStatusCode": 200}', 'de4649fb-cb1f-489a-8abb-ad431f639c40', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', '{}'),
	('54417afc-51cc-4eba-96e8-c93b1a3aa2c7', 'menu-images', '0.06869878167071697.png', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', '2026-01-14 14:51:31.635553+00', '2026-01-14 14:51:31.635553+00', '2026-01-14 14:51:31.635553+00', '{"eTag": "\"a0e6733cad84694d60fed332fe36d7a5\"", "size": 609169, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-01-14T14:51:32.000Z", "contentLength": 609169, "httpStatusCode": 200}', '460be5cb-0cca-4579-8d02-653cbdf02b65', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', '{}'),
	('5cb06545-ff3f-4680-9c9d-cdae59b99aae', 'menu-images', '0.07880030472647126.png', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', '2026-01-14 14:52:43.501015+00', '2026-01-14 14:52:43.501015+00', '2026-01-14 14:52:43.501015+00', '{"eTag": "\"a0e6733cad84694d60fed332fe36d7a5\"", "size": 609169, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-01-14T14:52:44.000Z", "contentLength": 609169, "httpStatusCode": 200}', 'e4013edb-8063-403d-8b4a-87583f546374', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', '{}'),
	('c8ecddf6-e635-423e-b8f0-b24cfc49f89f', 'menu-images', '1b0f2dc2-08bf-492e-89e1-ce08de558f74/e4966de7-ba11-4252-aaf1-afbf185cf0b3.png', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', '2026-01-14 15:45:08.494237+00', '2026-01-14 15:45:08.494237+00', '2026-01-14 15:45:08.494237+00', '{"eTag": "\"a0e6733cad84694d60fed332fe36d7a5\"", "size": 609169, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-01-14T15:45:09.000Z", "contentLength": 609169, "httpStatusCode": 200}', '6fe29a7d-f318-4ce3-a16f-aa85b76cc290', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', '{}');


--
-- Data for Name: prefixes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

-- Removed: storage.prefixes table does not exist in current Supabase version
-- INSERT INTO "storage"."prefixes" ("bucket_id", "name", "created_at", "updated_at") VALUES
-- 	('menu-images', '1b0f2dc2-08bf-492e-89e1-ce08de558f74', '2026-01-14 15:45:08.494237+00', '2026-01-14 15:45:08.494237+00');


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 124, true);


--
-- PostgreSQL database dump complete
--

-- \unrestrict JZEryZwL5y7dTDRGDZ8PjL3P8GT962eam5Mgd0xXjGkpV4cONvOTrD2m4QHkTRd

RESET ALL;
