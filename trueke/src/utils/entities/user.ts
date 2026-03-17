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

    return data
}
