import { createClient } from "@/utils/supabase/server"

export async function getUsers() {
    const supabase = await createClient()
    const { data, error } = await supabase.from('user').select('*')
    return { data, error }
}

export async function loginUserWithCredentials(email: string, password: string) {
    const supabase = await createClient()
    
    const { data, error } = await supabase.from('user').select('*').eq('email', email).eq('password_hash', password).single()
    console.log('Login attempt for email:', email, 'Result:', data, 'Error:', error)
    if (error) {
        throw error
    }
    return data
}