import { User } from "next-auth"

declare module "next-auth" {
  interface User {
    hasAccess: Boolean
    email: string
  }

  interface Session {
    user: User & {
      id: string
      email: string
    }
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    userId: string
    email: string
    hasAccess: Boolean
  }
}
