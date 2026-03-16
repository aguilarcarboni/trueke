import { User } from "next-auth"

export type UserPayload = Omit<User, 'id' | 'created_at' > & {
    password: string
}