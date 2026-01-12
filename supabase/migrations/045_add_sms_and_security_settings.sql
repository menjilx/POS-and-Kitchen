-- Add SMS settings and enhance Security settings

INSERT INTO app_settings (key, value, value_type, description, category, options) VALUES
-- SMS Settings
('sms_provider', 'twilio', 'string', 'SMS Provider', 'sms', '{"options": ["twilio", "sns", "nexmo"]}'),
('sms_account_sid', '', 'string', 'Account SID / API Key', 'sms', NULL),
('sms_auth_token', '', 'string', 'Auth Token / Secret', 'sms', '{"is_encrypted": true}'),
('sms_from_number', '', 'string', 'From Phone Number', 'sms', NULL),

-- Additional Security Settings
('mfa_enforced', 'false', 'boolean', 'Enforce Multi-Factor Authentication', 'security', NULL),
('password_expiry_days', '90', 'number', 'Password expiration in days (0 to disable)', 'security', NULL)
ON CONFLICT (key) DO NOTHING;
