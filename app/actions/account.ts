"use server"

import { createClient } from "@/lib/supabase/server"

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const fullName = formData.get("full_name") as string

  if (!fullName || fullName.trim().length === 0) {
    return { error: "Name is required" }
  }

  const { error: updateError } = await supabase
    .from("users")
    .update({ full_name: fullName.trim() })
    .eq("id", user.id)

  if (updateError) {
    return { error: updateError.message }
  }

  // Also update auth metadata so it stays in sync
  await supabase.auth.updateUser({
    data: { full_name: fullName.trim() },
  })

  return { success: true }
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const newPassword = formData.get("new_password") as string
  const confirmPassword = formData.get("confirm_password") as string

  if (!newPassword || newPassword.length < 6) {
    return { error: "Password must be at least 6 characters" }
  }

  if (newPassword !== confirmPassword) {
    return { error: "Passwords do not match" }
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
