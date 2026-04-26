import { DefaultSession, DefaultUser } from "next-auth"
import { DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface User extends DefaultUser {
    id: string
    email: string | null
    first_name: string
    last_name: string
    username: string
    status: string
    profile_picture_url: string
    bio?: string
    created_at?: string
    end_ban_date_time?: string
    is_admin: boolean
  }
  interface Session extends DefaultSession {
    user: User & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string
    email: string
    first_name: string
    last_name: string
    username: string
    profile_picture_url?: string | null
    is_admin?: boolean
    status?: string
  }
}
