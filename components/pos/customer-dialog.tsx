"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, UserPlus, User, Loader2, ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { Customer } from "@/types/database"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"

const normalizeCustomerName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')

const isReservedWalkInCustomerName = (value: string) => {
  const normalized = normalizeCustomerName(value)
  return (
    normalized === 'walk in' ||
    normalized === 'walk in customer' ||
    normalized === 'walkin' ||
    normalized === 'walkin customer'
  )
}

const isCanonicalWalkInCustomerName = (value: string) => normalizeCustomerName(value) === 'walk in'

interface CustomerDialogProps {
  selectedCustomer: Customer | null
  onSelect: (customer: Customer | null) => void
  tenantId?: string | null
}

export function CustomerDialog({ selectedCustomer, onSelect, tenantId }: CustomerDialogProps) {
  const [open, setOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // New Customer Form State
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    notes: ""
  })
  const [creating, setCreating] = useState(false)

  const searchCustomers = useCallback(async (query: string) => {
    setLoading(true)
    try {
      let queryBuilder = supabase
        .from('customers')
        .select('*')
        .eq('is_active', true)
        .order('name')
        .limit(20)

      if (tenantId) {
        queryBuilder = queryBuilder.eq('tenant_id', tenantId)
      }

      if (query) {
        queryBuilder = queryBuilder.or(`name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`)
      }

      const { data, error } = await queryBuilder

      if (error) throw error
      const filtered = (data || []).filter((c) => !isReservedWalkInCustomerName(c.name))
      setCustomers(filtered)
    } catch (error) {
      console.error('Error searching customers:', JSON.stringify(error, null, 2))
      // Only show toast if it's a real error, not just empty result or cancellation
      const pgError = error as { code?: string }
      if (pgError?.code !== 'PGRST116') {
          toast({
            title: "Error",
            description: "Failed to search customers",
            variant: "destructive"
          })
      }
    } finally {
      setLoading(false)
    }
  }, [tenantId, toast])

  useEffect(() => {
    if (open && !isCreating) {
      searchCustomers(searchQuery)
    }
  }, [open, searchQuery, isCreating, searchCustomers])

  const handleCreateCustomer = async () => {
    if (!newCustomer.name) {
      toast({
        title: "Required Field",
        description: "Customer name is required",
        variant: "destructive"
      })
      return
    }

    if (isReservedWalkInCustomerName(newCustomer.name)) {
      toast({
        title: "Invalid name",
        description: "Walk-in Customer is a system customer. Please use another name.",
        variant: "destructive",
      })
      return
    }

    setCreating(true)
    try {
      let targetTenantId = tenantId

      if (!targetTenantId) {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return

          const { data: userData } = await supabase
            .from("users")
            .select("tenant_id")
            .eq("id", user.id)
            .single()
            
          if (!userData?.tenant_id) throw new Error("No tenant found")
          targetTenantId = userData.tenant_id
      }

      const { data, error } = await supabase
        .from('customers')
        .insert({
          tenant_id: targetTenantId,
          name: newCustomer.name,
          phone: newCustomer.phone || null,
          email: newCustomer.email || null,
          notes: newCustomer.notes || null
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Success",
        description: "Customer created successfully"
      })

      onSelect(data)
      setOpen(false)
      setIsCreating(false)
      setNewCustomer({ name: "", phone: "", email: "", notes: "" })
    } catch (error) {
      console.error('Error creating customer:', error)
      toast({
        title: "Error",
        description: "Failed to create customer",
        variant: "destructive"
      })
    } finally {
      setCreating(false)
    }
  }

  const handleSelectWalkIn = async () => {
    setLoading(true)
    try {
      let targetTenantId = tenantId

      if (!targetTenantId) {
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return

          const { data: userData } = await supabase
            .from("users")
            .select("tenant_id")
            .eq("id", user.id)
            .single()
            
          if (!userData?.tenant_id) throw new Error("No tenant found")
          targetTenantId = userData.tenant_id
      }

      const { data: existing, error: existingError } = await supabase
        .from('customers')
        .select('*')
        .eq('tenant_id', targetTenantId)
        .in('name', ['Walk-in', 'Walk in', 'Walk-in Customer', 'Walkin', 'Walkin Customer'])
        .limit(10)

      if (!existingError && existing && existing.length > 0) {
        const active = existing.filter((c) => c.is_active !== false)
        const candidates = active.length > 0 ? active : existing
        const canonical = candidates.find((c) => isCanonicalWalkInCustomerName(c.name))
        const chosen = canonical ?? candidates[0]

        if (!canonical && !isCanonicalWalkInCustomerName(chosen.name)) {
          const { data: existingCanonical } = await supabase
            .from('customers')
            .select('id')
            .eq('tenant_id', targetTenantId)
            .eq('name', 'Walk-in')
            .maybeSingle()

          if (!existingCanonical) {
            await supabase
              .from('customers')
              .update({ name: 'Walk-in' })
              .eq('id', chosen.id)
          }
        }

        onSelect(chosen)
        setOpen(false)
        return
      }

      // Create it
      const { data: newWalkIn, error } = await supabase
        .from('customers')
        .insert({
          tenant_id: targetTenantId,
          name: 'Walk-in',
          is_active: true,
          notes: 'Default customer for walk-in sales'
        })
        .select()
        .single()

      if (error) throw error

      onSelect(newWalkIn)
      setOpen(false)
    } catch (error) {
      console.error('Error selecting walk-in:', error)
      toast({
        title: "Error",
        description: "Failed to select walk-in customer",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (customer: Customer | null) => {
    onSelect(customer)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="flex flex-col gap-1 cursor-pointer hover:opacity-80">
            <Label className="cursor-pointer">Customer</Label>
            <div className="flex items-center justify-between border rounded-md p-2 h-10 bg-background overflow-hidden">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className={`truncate ${selectedCustomer ? "font-medium" : "text-muted-foreground"}`}>
                        {selectedCustomer
                          ? (isReservedWalkInCustomerName(selectedCustomer.name) ? "Walk-in Customer" : selectedCustomer.name)
                          : "Walk-in Customer"}
                    </span>
                </div>
                {/* Visual indicator that it's clickable/selectable */}
                <Search className="h-3 w-3 text-muted-foreground opacity-50 ml-2 shrink-0" />
            </div>
        </div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isCreating ? "New Customer" : "Select Customer"}</DialogTitle>
        </DialogHeader>

        {isCreating ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input 
                id="name" 
                value={newCustomer.name} 
                onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input 
                id="phone" 
                value={newCustomer.phone} 
                onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                placeholder="+1 234 567 890"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                value={newCustomer.email} 
                onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                placeholder="john@example.com"
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input 
                id="notes" 
                value={newCustomer.notes} 
                onChange={(e) => setNewCustomer({...newCustomer, notes: e.target.value})}
                placeholder="Allergies, preferences..."
              />
            </div>
            <DialogFooter className="flex-row justify-between sm:justify-between">
                 <Button variant="ghost" onClick={() => setIsCreating(false)}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                 </Button>
                 <Button onClick={handleCreateCustomer} disabled={creating}>
                    {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Customer
                 </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, phone or email..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                </div>
                <Button size="icon" onClick={() => setIsCreating(true)} title="Add New Customer">
                    <UserPlus className="h-4 w-4" />
                </Button>
            </div>
            
            <ScrollArea className="h-80 border rounded-md p-2">
                <div className="space-y-1">
                    <div 
                        className={`flex items-center gap-3 p-2 rounded-sm cursor-pointer hover:bg-accent ${selectedCustomer?.name === 'Walk-in' || (!selectedCustomer) ? "bg-accent/50" : ""}`}
                        onClick={handleSelectWalkIn}
                    >
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                             <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="font-medium">Walk-in Customer</p>
                            <p className="text-xs text-muted-foreground">Default</p>
                        </div>
                    </div>
                    
                    {loading ? (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : customers.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>No customers found.</p>
                            <Button variant="link" onClick={() => setIsCreating(true)}>Create one?</Button>
                        </div>
                    ) : (
                        customers.map(customer => (
                            <div 
                                key={customer.id} 
                                className={`flex items-center gap-3 p-2 rounded-sm cursor-pointer hover:bg-accent ${selectedCustomer?.id === customer.id ? "bg-accent" : ""}`}
                                onClick={() => handleSelect(customer)}
                            >
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                    {customer.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-medium">{customer.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {customer.phone || customer.email || "No contact info"}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
