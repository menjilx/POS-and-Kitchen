import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'

async function updateUser(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!currentUser || currentUser.role !== 'owner') {
    throw new Error('Unauthorized')
  }

  const userId = formData.get('userId') as string
  const role = formData.get('role') as string
  const status = formData.get('status') as string

  const { error } = await supabase
    .from('users')
    .update({ role, status })
    .eq('id', userId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard/users')
  redirect('/dashboard/users')
}

export default async function UserDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: currentUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!currentUser || currentUser.role !== 'owner') {
    redirect('/dashboard')
  }

  const { data: userItem } = await supabase
    .from('users')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!userItem) {
    notFound()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/users" className="text-primary hover:underline">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold">Edit User</h1>
      </div>

      <div className="bg-card rounded-lg border p-6">
        <form action={updateUser} className="space-y-6">
          <input type="hidden" name="userId" value={userItem.id} />

          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <p className="text-lg">{userItem.full_name || '-'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <p className="text-lg">{userItem.email}</p>
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium mb-2">
              Role
            </label>
            <select
              id="role"
              name="role"
              defaultValue={userItem.role}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={userItem.id === currentUser.id}
            >
              <option value="owner">Owner</option>
              <option value="manager">Manager</option>
              <option value="staff">Staff</option>
            </select>
            {userItem.id === currentUser.id && (
              <p className="text-sm text-muted-foreground mt-1">
                You cannot change your own role
              </p>
            )}
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium mb-2">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={userItem.status}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={userItem.id === currentUser.id}
            >
              <option value="active">Active</option>
              <option value="deactivated">Deactivated</option>
            </select>
            {userItem.id === currentUser.id && (
              <p className="text-sm text-muted-foreground mt-1">
                You cannot deactivate your own account
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Update User
          </button>
        </form>
      </div>
    </div>
  )
}
