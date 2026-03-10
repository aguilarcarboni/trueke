import { getCurrentUser } from "@/utils/supabase/auth"
import { redirect } from "next/navigation"

type SearchParams = {
  section?: string | string[]
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>
}) {
  const user = await getCurrentUser()
  const params = searchParams ? await searchParams : {}
  const rawSection = params.section
  const section = Array.isArray(rawSection) ? rawSection[0] : rawSection

  if (!user) {
    redirect("/login")
  }

  if (user.isAdmin) {
    redirect("/admin")
  }

  if (section) {
    redirect(`/user?section=${encodeURIComponent(section)}`)
  }

  redirect("/user")
}
