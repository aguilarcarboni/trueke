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
        const banExpiry = data.end_ban_date_time ? new Date(data.end_ban_date_time) : null
        if (banExpiry && new Date() > banExpiry) {
            // Ban duration has expired – auto-restore to active (AC4)
            const { error: restoreError } = await supabase.rpc('handle_user_status_change', {
                p_user_id: data.user_id,
                p_new_status: 'active',
            })
            if (!restoreError) {
                return { ...data, status: 'active', end_ban_date_time: null }
            }
        }
        // Encode ban expiry so the login page can display a clear message (AC1)
        const banMsg = data.end_ban_date_time
            ? `AccountBanned:${data.end_ban_date_time}`
            : 'AccountBanned'
        throw new Error(banMsg)
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
