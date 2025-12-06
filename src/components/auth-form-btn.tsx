"use client"

import { useFormStatus } from "react-dom";
import { Button } from "./ui/button";

type AuthFormButtonProps = {
  type: "login" | "signup"
}

export default function AuthFormBtn({ type }: AuthFormButtonProps) {
  const { pending } = useFormStatus()

  return (
    <Button disabled={pending}>{type === "login" ? "Log In" : "Sign Up"}</Button>
  )
}

