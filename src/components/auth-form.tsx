"use client"
import { login, signUp } from "@/actions/actions";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import AuthFormBtn from "./auth-form-btn";
import { useFormState } from "react-dom";

export default function AuthForm({ type }: { type: "login" | "signup" }) {
  const [signupError, dispatchSignup] = useFormState(signUp, undefined)
  const [loginError, dispatchLogin] = useFormState(login, undefined)

  return (
    <form action={type === "login" ? dispatchLogin : dispatchSignup}>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required maxLength={100} />
      </div>

      <div className="mb-4 mt-2 space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required maxLength={100} />
      </div>

      <AuthFormBtn type={type} />

      {signupError && <p className="text-red-500 text-sm mt-2">{signupError.message}</p>}
      {loginError && <p className="text-red-500 text-sm mt-2">{loginError.message}</p>}
    </form>
  )
}

