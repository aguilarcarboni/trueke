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

    if (data.status === 'inactive') {
        const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000
        const deactivatedAt = data.deactivated_at ? new Date(data.deactivated_at).getTime() : null
        const withinWindow = deactivatedAt !== null && (Date.now() - deactivatedAt) < THIRTY_DAYS_MS
        throw new Error(withinWindow ? 'AccountDeactivatedRecoverable' : 'AccountDeactivated')
    }

    return data
}
