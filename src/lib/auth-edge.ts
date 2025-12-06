import { NextAuthConfig } from "next-auth"
import { getUserByEmail } from "./server-utils"
import prisma from "./db"

export const nextAuthEdgeConfig = {
  pages: {
    signIn: "/login",
  },

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
        const userFromDb = await prisma.user.findUnique({
          where: { email: token.email }
        })
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
  },
  providers: []
} satisfies NextAuthConfig
