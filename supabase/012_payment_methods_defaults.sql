-- ============================================================================
-- The Catalyst — PostgreSQL schema (Supabase)
-- 012_payment_methods_defaults.sql
-- Ensure the payment_methods JSONB column includes manualPaymentEnabled and
-- other new keys added after the original schema was created.
-- ============================================================================

-- Backfill existing settings rows: if manualPaymentEnabled key is missing,
-- add it as true (so existing UPI configs start visible immediately).
-- If the UPI ID is already filled in, keep manualPaymentEnabled = true.
update settings
set payment_methods = payment_methods
  || jsonb_build_object(
       'manualPaymentEnabled',
       coalesce((payment_methods->>'manualPaymentEnabled')::boolean,
                (payment_methods->>'upiId') is not null and payment_methods->>'upiId' != '')
     )
  || jsonb_build_object('payeeName',            coalesce(payment_methods->>'payeeName', ''))
  || jsonb_build_object('qrCodeUrl',            coalesce(payment_methods->>'qrCodeUrl', ''))
  || jsonb_build_object('paymentInstructions',  coalesce(payment_methods->>'paymentInstructions', ''))
where singleton_key = 'main';

-- Also update the column default so new rows start with the full structure.
alter table settings
  alter column payment_methods
  set default '{
    "upiId": "",
    "payeeName": "",
    "qrCodeUrl": "",
    "paymentInstructions": "",
    "manualPaymentEnabled": false,
    "googlePayLink": "",
    "phonePeLink": "",
    "paytmLink": "",
    "stripeLink": "",
    "razorpayEnabled": false,
    "bankDetails": { "accountName": "", "accountNumber": "", "ifscCode": "", "bankName": "" }
  }'::jsonb;
