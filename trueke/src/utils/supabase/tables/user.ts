import { createClient } from "@/utils/supabase/server"

export async function getUsers() {
    const supabase = await createClient()
    const { data, error } = await supabase.from('user').select('*')
    return { data, error }
}