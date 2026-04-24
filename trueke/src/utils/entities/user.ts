import { createClient } from "@/utils/supabase/server"
import bcrypt from "bcrypt"

export async function getUsers() {
    const supabase = await createClient()
    const { data, error } = await supabase.from('user').select('*')
    return { data, error }
}

export async function loginUserWithCredentials(email: string, password: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('user')
        .select('*')
        .eq('email', email)
        .maybeSingle()

    if (error || !data) {
        throw new Error('Invalid credentials')
    }

    const isPasswordValid = await bcrypt.compare(password, data.password_hash)
    if (!isPasswordValid) {
        throw new Error('Invalid credentials')
    }

    if (data.status === 'banned') {
        throw new Error('AccountBanned')
    }

    if (data.status === 'inactive') {
        const deactivatedAt = data.deactivated_at ? new Date(data.deactivated_at) : null
        const expiryDate = deactivatedAt ? new Date(deactivatedAt) : null
        if (expiryDate) expiryDate.setDate(expiryDate.getDate() + 30)
        const withinWindow = expiryDate !== null && new Date() < expiryDate
        throw new Error(withinWindow ? 'AccountDeactivatedRecoverable' : 'AccountDeactivated')
    }

    return data
}
