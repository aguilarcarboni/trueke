import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { loginUserWithCredentials } from "./entities/user"

export const authOptions: NextAuthOptions = {
    // Required for JWT decrypt in getToken / getServerSession (must match login)
    secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,

    providers: [
      CredentialsProvider({
        name: 'Credentials',
        credentials: {
          email: { label: "Email", type: "text", placeholder: "jsmith@gmail.com" },
          password: { label: "Password", type: "password" }
        },
        async authorize(credentials) {

          if (credentials?.email && credentials?.password) {
            try {

              const dbUser = await loginUserWithCredentials(credentials.email, credentials.password)
              console.log("Authenticated user:", dbUser)

              // Normalize DB shape to NextAuth user shape.
              return {
                id: dbUser.user_id,
                email: dbUser.email ?? "",
                first_name: dbUser.first_name ?? "",
                last_name: dbUser.last_name ?? "",
                username: dbUser.username ?? "",
                status: dbUser.status ?? "",
                profile_picture_url: dbUser.profile_picture_url ?? "",
                bio: dbUser.bio ?? "",
                created_at: dbUser.created_at ?? "",
                end_ban_date_time: dbUser.end_ban_date_time ?? "",
                is_admin: Boolean(dbUser.is_admin),
              }

            } catch (error) {
              throw new Error('Invalid credentials')
            }
          }
          return null
        }
      }),
    ],
    callbacks: {

      async jwt({ token, user }) {

        // Build token from user profile
        if (user) {

          console.log("Building JWT for user:", user)

          token.sub = user.id
          token.email = user.email ?? ""
          token.first_name = user.first_name ?? ""
          token.last_name = user.last_name ?? ""
          token.username = user.username ?? ""
          token.profile_picture_url = user.profile_picture_url ?? ""
          token.is_admin = Boolean(user.is_admin)

        }
        
        return token
      },
      async session({ session, token }) {

        if (session?.user) {
          
          if (token.sub) {

            console.log("Building session for user ID:", token.sub)

            // Build session user profile from token
            session.user.id = token.sub
            session.user.email = token.email ?? ""
            session.user.first_name = token.first_name ?? ""
            session.user.last_name = token.last_name ?? ""
            session.user.username = token.username ?? ""
            session.user.profile_picture_url = token.profile_picture_url ?? ""
            session.user.is_admin = Boolean(token.is_admin)

          }
          
        }
        return session
      },
      async signIn({ }) {
        return true
      }

    },
    pages: {
      signIn: '/signin',
    },
    session: {
      strategy: 'jwt'
    },
}
