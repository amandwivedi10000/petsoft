import NextAuth, { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs"
import { getUserByEmail } from "./server-utils";
import { authSchema } from "@/lib/validations";

const config = {
  pages: {
    signIn: "/login",
  },
  session: {
    maxAge: 30 * 24 * 60 * 60,
    strategy: "jwt",
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        // runs on login

        // validation
        const validatedFormData = authSchema.safeParse(credentials)
        if (!validatedFormData.success) {
          return null
        }
        // extracted values
        const { email, password } = validatedFormData.data

        const user = await getUserByEmail(email)
        if (!user) {
          console.log("No user found")
          return null
        }

        const isValid = await bcrypt.compare(password, user.hashedPassword)

        if (!isValid) {
          console.log("Invalid credentials")
          return null
        }

        return {
          id: user.id,
          email: user.email,
        }
      }
    })
  ],
  callbacks: {
    authorized: ({ auth, request }) => {
      // runs on every request with middleware
      const isAuthenticated = Boolean(auth?.user)
      const isTryingToAccessApp = request.nextUrl.pathname.includes("/app")

      if (!isAuthenticated && isTryingToAccessApp) {
        return false
      }
      if (isAuthenticated && isTryingToAccessApp && !auth?.user.hasAccess) {
        return Response.redirect(new URL("/payment", request.nextUrl))
      }
      if (isAuthenticated && isTryingToAccessApp && auth?.user.hasAccess) {
        return true
      }

      if (
        isAuthenticated &&
        (request.nextUrl.pathname.includes("/login") &&
          request.nextUrl.pathname.includes("/signup"))
      ) {
        return Response.redirect(new URL("/app/dashboard", request.nextUrl))
      }

      if (isAuthenticated && !isTryingToAccessApp && !auth?.user.hasAccess) {
        if (
          request.nextUrl.pathname.includes("/login") ||
          request.nextUrl.pathname.includes("/signup")
        ) {
          return Response.redirect(new URL("/payment", request.nextUrl))
        }

        return true
      }

      if (!isAuthenticated && !isTryingToAccessApp) {
        return true
      }

      return false
    },
    jwt: async ({ token, user, trigger }) => {
      if (user) {
        token.userId = user.id
        token.email = user.email!
        token.hasAccess = user.hasAccess
      }

      if (trigger === "update") {
        // on every request
        const userFromDb = await getUserByEmail(token.email)
        if (userFromDb) {
          token.hasAccess = userFromDb.hasAccess
        }
      }

      return token
    },
    session: ({ session, token }) => {
      session.user.id = token.userId
      session.user.hasAccess = token.hasAccess

      return session
    }
  }

} satisfies NextAuthConfig

export const { auth, signIn, signOut, handlers: { GET, POST } } = NextAuth(config)
