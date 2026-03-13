import { SupabaseClient } from '@supabase/supabase-js'

export async function executeVoid(supabase: SupabaseClient, saleId: string, voidReason?: string) {
  const { error: saleError } = await supabase
    .from('sales')
    .update({ payment_status: 'voided', void_reason: voidReason || null })
    .eq('id', saleId)

  if (saleError) throw saleError

  // Cancel associated KDS order
  const { data: kdsOrder } = await supabase
    .from('kds_orders')
    .select('id')
    .eq('sale_id', saleId)
    .single()

  if (kdsOrder) {
    await supabase
      .from('kds_orders')
      .update({ status: 'cancelled' })
      .eq('id', kdsOrder.id)
  }
}

export async function createVoidRequest(
  supabase: SupabaseClient,
  saleId: string,
  reason: string,
  requestedBy: string
) {
  const { data, error } = await supabase
    .from('void_requests')
    .insert({
      sale_id: saleId,
      reason,
      requested_by: requestedBy,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function approveVoidRequest(
  supabase: SupabaseClient,
  requestId: string,
  reviewedBy: string,
  notes?: string
) {
  const { data: request, error: fetchError } = await supabase
    .from('void_requests')
    .select('sale_id, reason')
    .eq('id', requestId)
    .single()

  if (fetchError) throw fetchError

  const { error: updateError } = await supabase
    .from('void_requests')
    .update({
      status: 'approved',
      reviewed_by: reviewedBy,
      review_notes: notes || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId)

  if (updateError) throw updateError

  await executeVoid(supabase, request.sale_id, request.reason)
}

export async function denyVoidRequest(
  supabase: SupabaseClient,
  requestId: string,
  reviewedBy: string,
  notes: string
) {
  const { error } = await supabase
    .from('void_requests')
    .update({
      status: 'denied',
      reviewed_by: reviewedBy,
      review_notes: notes,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId)

  if (error) throw error
}
