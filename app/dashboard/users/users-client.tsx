'use client'

import { useState, Fragment } from 'react'
import { DataTable } from '../../../components/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { MoreHorizontal, Plus, Shield, Users, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { inviteUser, updateUser, deleteUser } from '@/app/actions/users'
import { updateRolePermissions } from '@/app/actions/permissions'
import { ROLES, PERMISSION_LABELS, PERMISSION_GROUPS, Role, Permission } from '@/lib/permissions'

type User = {
  id: string
  full_name: string | null
  email: string
  role: string
  status: string
  last_login: string | null
  created_at: string
  tenant_id: string
}

type RolePermissions = Record<Role, Permission[]>

export function UsersClient({ 
  users, 
  currentUser,
  rolePermissions
}: { 
  users: User[], 
  currentUser: User,
  rolePermissions: RolePermissions
}) {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'full_name',
      header: 'Name',
      cell: ({ row }) => <div className="font-medium">{row.getValue('full_name') || '-'}</div>,
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.getValue('role')}
        </Badge>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        return (
          <Badge variant={status === 'active' ? 'default' : 'destructive'}>
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'last_login',
      header: 'Last Login',
      cell: ({ row }) => {
        const date = row.getValue('last_login') as string
        return date ? new Date(date).toLocaleDateString() : 'Never'
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const user = row.original
        const isSelf = user.id === currentUser.id
        const isOwner = currentUser.role === 'owner'
        
        // Only owners can edit other users
        if (!isOwner) return null

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setEditingUser(user)}>
                Edit User
              </DropdownMenuItem>
              {!isSelf && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={() => setDeletingUser(user)}
                  >
                    Delete User
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage your team members and their permissions.
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Invite User
        </Button>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Roles & Permissions
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="space-y-4">
          <DataTable columns={columns} data={users} />
        </TabsContent>
        
        <TabsContent value="roles">
          <PermissionsMatrix initialPermissions={rolePermissions} />
        </TabsContent>
      </Tabs>

      <InviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      
      {editingUser && (
        <EditUserDialog 
          user={editingUser} 
          open={!!editingUser} 
          onOpenChange={(open) => !open && setEditingUser(null)} 
          currentUser={currentUser}
        />
      )}

      {deletingUser && (
        <DeleteUserDialog
           user={deletingUser}
           open={!!deletingUser}
           onOpenChange={(open) => !open && setDeletingUser(null)}
        />
      )}
    </div>
  )
}

function InviteUserDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  async function onSubmit(formData: FormData) {
    setLoading(true)
    try {
      const result = await inviteUser(formData)
      if (result.success) {
        toast({ title: 'Invitation sent successfully', variant: 'default' })
        onOpenChange(false)
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to send invitation', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
          <DialogDescription>
            Send an invitation email to a new team member.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="user@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select name="role" defaultValue="staff">
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(ROLES).map((role) => (
                  <SelectItem key={role} value={role} className="capitalize">
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditUserDialog({ user, open, onOpenChange, currentUser }: { user: User; open: boolean; onOpenChange: (open: boolean) => void, currentUser: User }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const isSelf = user.id === currentUser.id

  async function onSubmit(formData: FormData) {
    setLoading(true)
    try {
      const result = await updateUser(formData)
      if (result.success) {
        toast({ title: 'User updated successfully', variant: 'default' })
        onOpenChange(false)
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update user', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user details and permissions.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <input type="hidden" name="userId" value={user.id} />
          
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user.email} disabled className="bg-muted" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select name="role" defaultValue={user.role} disabled={isSelf}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(ROLES).map((role) => (
                  <SelectItem key={role} value={role} className="capitalize">
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isSelf && <p className="text-xs text-muted-foreground">You cannot change your own role.</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue={user.status} disabled={isSelf}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="deactivated">Deactivated</SelectItem>
              </SelectContent>
            </Select>
             {isSelf && <p className="text-xs text-muted-foreground">You cannot deactivate yourself.</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteUserDialog({ user, open, onOpenChange }: { user: User; open: boolean; onOpenChange: (open: boolean) => void }) {
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)

    async function onConfirm() {
        setLoading(true)
        try {
            const result = await deleteUser(user.id)
            if (result.success) {
                toast({ title: 'User deleted successfully', variant: 'default' })
                onOpenChange(false)
            } else {
                toast({ title: 'Error', description: result.error, variant: 'destructive' })
            }
        } catch {
            toast({ title: 'Error', description: 'Failed to delete user', variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete User</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete <strong>{user.full_name || user.email}</strong>? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
                    <Button variant="destructive" onClick={onConfirm} disabled={loading}>
                        {loading ? 'Deleting...' : 'Delete User'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function PermissionsMatrix({ initialPermissions }: { initialPermissions: RolePermissions }) {
  const { toast } = useToast()
  const [permissions, setPermissions] = useState(initialPermissions)
  const [loading, setLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const togglePermission = (role: Role, permission: Permission) => {
    // Owner permissions are immutable
    if (role === ROLES.OWNER) return;

    setPermissions(prev => {
      const rolePermissions = prev[role]
      const newRolePermissions = rolePermissions.includes(permission)
        ? rolePermissions.filter(p => p !== permission)
        : [...rolePermissions, permission]
      
      return {
        ...prev,
        [role]: newRolePermissions
      }
    })
    setHasChanges(true)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // Save for Manager and Staff
      // We process them sequentially or in parallel
      const promises = [
        updateRolePermissions(ROLES.MANAGER, permissions[ROLES.MANAGER]),
        updateRolePermissions(ROLES.STAFF, permissions[ROLES.STAFF])
      ]
      
      await Promise.all(promises)
      
      toast({ title: 'Permissions updated successfully', variant: 'default' })
      setHasChanges(false)
    } catch {
      toast({ title: 'Error', description: 'Failed to update permissions', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const discardChanges = () => {
    setPermissions(initialPermissions)
    setHasChanges(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-card p-4 rounded-lg border">
        <div>
           <h3 className="text-lg font-medium">Configure Permissions</h3>
           <p className="text-sm text-muted-foreground">Control what each role can access.</p>
        </div>
        
        {hasChanges && (
          <div className="flex gap-2">
             <Button variant="ghost" onClick={discardChanges} disabled={loading}>
               Discard
             </Button>
             <Button onClick={handleSave} disabled={loading}>
               {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
               Save Changes
             </Button>
          </div>
        )}
      </div>

      <div className="rounded-md border bg-card">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[40%]">Permission</th>
                {Object.values(ROLES).map(role => (
                  <th key={role} className="h-12 px-4 text-center align-middle font-medium text-muted-foreground capitalize">
                    {role}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {Object.entries(PERMISSION_GROUPS).map(([group, groupPermissions]) => (
                <Fragment key={group}>
                  <tr className="bg-muted/50">
                    <td colSpan={4} className="p-2 px-4 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                      {group}
                    </td>
                  </tr>
                  {groupPermissions.map((permission) => (
                    <tr key={permission} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <td className="p-4 align-middle font-medium">
                        {PERMISSION_LABELS[permission as Permission]}
                      </td>
                      {Object.values(ROLES).map(role => {
                        const hasPermission = permissions[role].includes(permission as Permission)
                        const isOwner = role === ROLES.OWNER
                        
                        return (
                          <td key={`${role}-${permission}`} className="p-4 align-middle text-center">
                            <div className="flex justify-center">
                              <Checkbox 
                                checked={hasPermission}
                                onCheckedChange={() => togglePermission(role, permission as Permission)}
                                disabled={isOwner}
                                className={isOwner ? "opacity-50 cursor-not-allowed data-[state=checked]:bg-primary/50" : ""}
                              />
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
