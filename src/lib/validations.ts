import { z } from "zod"

export const petIdSchema = z.string().cuid()

export const PetFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Name is required" })
    .max(100, { message: "Name is too long" }),
  ownerName: z
    .string()
    .trim()
    .min(1, { message: "Owner name is required" })
    .max(100, { message: "Owner name is too long" }),
  imageUrl: z
    .union([
      z.literal(""),
      z.string()
        .trim()
        .url({ message: "Image URL is invalid" })
    ]),
  age: z.coerce.number().int().positive().max(999),
  notes: z.union([
    z.literal(""),
    z.string().trim().max(1000, { message: "Notes is too long" })])
})

export type TPetForm = z.infer<typeof PetFormSchema>

export const authSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "Email is invalid" })
    .max(100, { message: "Email is too long" }),
  password: z
    .string()
    .trim()
    .max(100, { message: "Password is too long" }),
})

export type TAuth = z.infer<typeof authSchema>
