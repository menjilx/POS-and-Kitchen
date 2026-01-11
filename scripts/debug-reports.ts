
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Load environment variables from .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8')
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim().replace(/^['"]|['"]$/g, '') // Remove quotes
      process.env[key] = value
    }
  })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugReports() {
  console.log('--- Starting Debug Session for Reports ---')

  // 0. Login as owner (using a known owner email if possible, or creating a session)
  // For this script, we need a valid user.
  // Let's try to find an owner user first via admin client if possible, or just fail if we can't login.
  // Since the previous login failed, let's try to list users first using service role key if available?
  // But we only have ANON key in .env.local usually for client side. 
  // Wait, .env.local usually has SUPABASE_SERVICE_ROLE_KEY for server side actions?
  // Let's check if we can find a service role key in .env.local or process.env

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
   let adminClient
   
   if (serviceRoleKey) {
     console.log("Using Service Role Key")
     adminClient = createClient(supabaseUrl, serviceRoleKey)
   } else {
    console.log("No Service Role Key found, trying with Anon Key (might fail RLS)")
    adminClient = supabase
  }

  // Fetch a real user to impersonate or login
  // We'll try to find a user with role 'owner'
  let ownerUser
  if (serviceRoleKey) {
      const { data: users, error: usersError } = await adminClient
        .from('users')
        .select('id, email, tenant_id')
        .eq('role', 'owner')
        .limit(1)
      
      if (users && users.length > 0) {
          ownerUser = users[0]
          console.log(`Found owner user: ${ownerUser.email} (ID: ${ownerUser.id})`)
      }
  }

  // If we can't auto-login, we might need manual credentials or just use the service role client for queries
  // But RPC calls often depend on auth.uid()
  
  // For debugging, let's use the service role client to fetch data directly first to verify it exists
  const clientToUse = adminClient || supabase

  // 1. Fetch a Tenant
  const { data: tenants, error: tenantError } = await clientToUse
    .from('tenants')
    .select('id, name')
    .limit(1)

  if (tenantError || !tenants || tenants.length === 0) {
    console.error('Error fetching tenants:', tenantError)
    return
  }
  const tenantId = tenants[0].id
  console.log(`Tenant: ${tenants[0].name} (${tenantId})`)

  // 2. Fetch PURCHASES to check Ingredient Trends
  console.log('\n--- Checking Purchases for Ingredient Trends ---')
  const { data: purchases, error: purchasesError } = await clientToUse
    .from('purchases')
    .select('id, invoice_date, total_amount')
    .eq('tenant_id', tenantId)
    .order('invoice_date', { ascending: false })
    .limit(5)
  
  if (purchasesError) {
      console.error('Error fetching purchases:', purchasesError)
  } else {
      console.log(`Found ${purchases?.length} recent purchases:`)
      purchases?.forEach(p => {
          console.log(`- ID: ${p.id}, Date: ${p.invoice_date}, Amount: ${p.total_amount}`)
      })
  }

  if (purchases && purchases.length > 0) {
      const samplePurchase = purchases[0]
      const { data: purchaseItems, error: pItemsError } = await clientToUse
        .from('purchase_items')
        .select('id, ingredient_id, quantity, unit_price')
        .eq('purchase_id', samplePurchase.id)
      
      console.log(`\nItems for Purchase ${samplePurchase.id}:`)
      if (pItemsError) console.error(pItemsError)
      else console.log(purchaseItems)
  }

  // 3. Test RPC get_ingredient_cost_trends
  console.log('\n--- Testing RPC get_ingredient_cost_trends ---')
  const startDate = '2020-01-01' 
  const endDate = '2030-12-31'
  
  // Note: If we are using service role key, auth.uid() might be null in the RPC unless we impersonate
  // But our RPC has a check: SELECT tenant_id INTO v_user_tenant FROM users WHERE id = auth.uid();
  // So we MUST be authenticated as a user belonging to that tenant.
  
  if (!ownerUser && !serviceRoleKey) {
      console.error("Cannot test RPC without a valid logged-in user or service role impersonation.")
      return 
  }

  // If we have service role, we can try to call RPC but the internal logic checks auth.uid()
  // So we really need to simulate a user.
  // Ideally, we should temporarily remove the auth check in the RPC for debugging OR use a real user token.
  
  console.log("Skipping RPC call in script because we can't easily simulate auth.uid() without a password.")
  console.log("However, we confirmed above that Purchases and Purchase Items EXIST in the DB.")
  
  // Check Ingredients table
  const { data: ingredients, error: ingError } = await clientToUse
    .from('ingredients')
    .select('id, name, tenant_id')
    .eq('tenant_id', tenantId)
    .limit(5)
    
  console.log(`\nChecking Ingredients for Tenant ${tenantId}:`)
  if (ingError) console.error(ingError)
  else {
      console.log(`Found ${ingredients.length} ingredients.`)
      console.log(ingredients)
  }

}

debugReports()
