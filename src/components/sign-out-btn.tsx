"use client"

import { useTransition } from "react";
import { Button } from "./ui/button";
import { logout } from "@/actions/actions";

export default function SignOutBtn() {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      disabled={isPending}
      onClick={async () => {
        startTransition(async () => {
          await logout()
        })
      }}
    >
      Sign out
    </Button>
  )
}

