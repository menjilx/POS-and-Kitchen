-- Migration: Merge users — consolidate to single owner (menjilx@gmail.com)
-- Source user (swakihan): a9a9d589-b37f-4d7c-a62d-f297dacd8476
-- Target user (menjilx):  1b0f2dc2-08bf-492e-89e1-ce08de558f74
-- Admin user to remove:    659a1d36-be59-449b-a2f4-ed23f1ceac47

BEGIN;

-- 1. Disable sale_history trigger to prevent spurious audit entries during bulk UPDATE
ALTER TABLE public.sales DISABLE TRIGGER USER;

-- 2. Reassign all FK references from swakihan → menjilx

UPDATE public.stock_adjustments
  SET created_by = '1b0f2dc2-08bf-492e-89e1-ce08de558f74'
  WHERE created_by = 'a9a9d589-b37f-4d7c-a62d-f297dacd8476';

UPDATE public.stocktakes
  SET performed_by = '1b0f2dc2-08bf-492e-89e1-ce08de558f74'
  WHERE performed_by = 'a9a9d589-b37f-4d7c-a62d-f297dacd8476';

UPDATE public.purchases
  SET created_by = '1b0f2dc2-08bf-492e-89e1-ce08de558f74'
  WHERE created_by = 'a9a9d589-b37f-4d7c-a62d-f297dacd8476';

UPDATE public.sales
  SET created_by = '1b0f2dc2-08bf-492e-89e1-ce08de558f74'
  WHERE created_by = 'a9a9d589-b37f-4d7c-a62d-f297dacd8476';

UPDATE public.expenses
  SET created_by = '1b0f2dc2-08bf-492e-89e1-ce08de558f74'
  WHERE created_by = 'a9a9d589-b37f-4d7c-a62d-f297dacd8476';

UPDATE public.sale_history
  SET created_by = '1b0f2dc2-08bf-492e-89e1-ce08de558f74'
  WHERE created_by = 'a9a9d589-b37f-4d7c-a62d-f297dacd8476';

UPDATE public.cashier_sessions
  SET user_id = '1b0f2dc2-08bf-492e-89e1-ce08de558f74'
  WHERE user_id = 'a9a9d589-b37f-4d7c-a62d-f297dacd8476';

UPDATE public.void_requests
  SET requested_by = '1b0f2dc2-08bf-492e-89e1-ce08de558f74'
  WHERE requested_by = 'a9a9d589-b37f-4d7c-a62d-f297dacd8476';

UPDATE public.void_requests
  SET reviewed_by = '1b0f2dc2-08bf-492e-89e1-ce08de558f74'
  WHERE reviewed_by = 'a9a9d589-b37f-4d7c-a62d-f297dacd8476';

-- 3. Update storage objects ownership from swakihan → menjilx
UPDATE storage.objects
  SET owner = '1b0f2dc2-08bf-492e-89e1-ce08de558f74',
      owner_id = '1b0f2dc2-08bf-492e-89e1-ce08de558f74'
  WHERE owner = 'a9a9d589-b37f-4d7c-a62d-f297dacd8476'
     OR owner_id = 'a9a9d589-b37f-4d7c-a62d-f297dacd8476';

-- 4. Update menu_items.image_url paths containing swakihan's UUID
UPDATE public.menu_items
  SET image_url = REPLACE(image_url, 'a9a9d589-b37f-4d7c-a62d-f297dacd8476', '1b0f2dc2-08bf-492e-89e1-ce08de558f74')
  WHERE image_url LIKE '%a9a9d589-b37f-4d7c-a62d-f297dacd8476%';

-- 5. Update storage.objects.name paths for menu-images bucket
UPDATE storage.objects
  SET name = REPLACE(name, 'a9a9d589-b37f-4d7c-a62d-f297dacd8476', '1b0f2dc2-08bf-492e-89e1-ce08de558f74')
  WHERE bucket_id = 'menu-images'
    AND name LIKE '%a9a9d589-b37f-4d7c-a62d-f297dacd8476%';

-- 6. Ensure menjilx has role='owner' in public.users
UPDATE public.users
  SET role = 'owner'
  WHERE id = '1b0f2dc2-08bf-492e-89e1-ce08de558f74';

-- 7. Delete swakihan from public.users, then auth.users
--    (CASCADE on auth.users handles auth.identities, sessions, refresh_tokens, mfa_amr_claims)
DELETE FROM public.users
  WHERE id = 'a9a9d589-b37f-4d7c-a62d-f297dacd8476';

DELETE FROM auth.users
  WHERE id = 'a9a9d589-b37f-4d7c-a62d-f297dacd8476';

-- 8. Delete admin@kitchensystem.internal from public.users and auth.users
DELETE FROM public.users
  WHERE id = '659a1d36-be59-449b-a2f4-ed23f1ceac47';

DELETE FROM auth.users
  WHERE id = '659a1d36-be59-449b-a2f4-ed23f1ceac47';

-- 9. Re-enable sale_history trigger
ALTER TABLE public.sales ENABLE TRIGGER USER;

COMMIT;
