"use server"

import { signIn, signOut } from "@/lib/auth-no-edge"
import prisma from "@/lib/db"
import { sleep } from "@/lib/utils"
import { PetFormSchema, authSchema, petIdSchema } from "@/lib/validations"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"
import { checkAuth, getPetByPetId } from "@/lib/server-utils"
import { Prisma } from "@prisma/client"
import { AuthError } from "next-auth"

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
// --- User Actions ---

export async function login(prevState: unknown, formData: unknown) {
  // check if formData is of FormData type
  if (!(formData instanceof FormData)) {
    return {
      message: "Invalid form data"
    }
  }

  try {
    await signIn("credentials", formData)
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin": {
          return {
            message: "Invalid credentials"
          }
        }
        default: {
          return {
            message: "Error. Could not sign in."
          }
        }
      }
    }

    throw error // nextjs redirects throws error, so we need to rethrow it
  }
}

export async function signUp(prevState: unknown, formData: unknown) {

  // check if formData is of FormData type
  if (!(formData instanceof FormData)) {
    return {
      message: "Invalid form data"
    }
  }

  // convert formData to plain object
  const formDataObj = Object.fromEntries(formData.entries())

  // validation
  const validatedFormData = authSchema.safeParse(formDataObj)
  if (!validatedFormData.success) {
    return {
      message: "Invalid form data"
    }
  }
  const { email, password } = validatedFormData.data
  const hashedPassword = await bcrypt.hash(password, 10)

  try {

    await prisma?.user.create({
      data: {
        email,
        hashedPassword
      },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return {
          message: "Email already exists"
        }
      }
    }

    return {
      message: "Failed to create user"
    }
  }


  return await signIn("credentials", formData)
}

export async function logout() {
  await signOut({ redirectTo: "/" })
}

// --- Pet Actions ---
export async function addPet(pet: unknown) {

  const session = await checkAuth()

  const validatedSchema = PetFormSchema.safeParse(pet)
  if (!validatedSchema.success) {
    return {
      message: "Invalid Pet Data"
    }
  }

  try {
    await prisma?.pet.create({
      data: {
        ...validatedSchema.data,
        user: {
          connect: {
            id: session.user.id
          }
        }
      }
    })
  } catch (error) {
    return {
      message: "Failed to add pet",
    }
  }
  revalidatePath("/app/", "layout")
}

export async function editPet(petId: unknown, newPetData: unknown) {

  //authentication check 
  const session = await checkAuth()

  //validation check
  const validatedSchema = PetFormSchema.safeParse(newPetData)
  const validatedPetId = petIdSchema.safeParse(petId)

  if (!validatedSchema.success || !validatedPetId.success) {
    return {
      message: "Invalid Pet Data"
    }
  }

  //authorization check (user owns pet)
  const pet = await getPetByPetId(validatedPetId.data)
  if (!pet || pet.userId !== session.user.id) {
    return {
      message: "Unauthorized",
    }
  }

  try {
    await prisma.pet.update({
      where: {
        id: validatedPetId.data
      },
      data: validatedSchema.data
    })
    revalidatePath("/app/", "layout")
  } catch (error) {
    return {
      message: "Failed to edit pet",
    }
  }
}

export async function checkoutPet(petId: unknown) {

  //authentication check 
  const session = await checkAuth()

  //validation check
  const validatedPetId = petIdSchema.safeParse(petId)
  if (!validatedPetId.success) {
    return {
      message: "Invalid Pet Data"
    }
  }

  //authorization check (user owns pet)
  const pet = await getPetByPetId(validatedPetId.data)
  if (!pet || pet.userId !== session.user.id) {
    return {
      message: "Unauthorized",
    }
  }

  //database mutation
  try {
    await prisma.pet.delete({
      where: {
        id: validatedPetId.data
      },
    })
    revalidatePath("/app/", "layout")
  } catch (error) {
    return {
      message: "Failed to checkout pet",
    }
  }
}

// -- Payment Actions --

export async function createCheckoutSession() {
  //authentication check
  const session = await checkAuth()

  // create checkoutSession 
  const checkoutSession = await stripe.checkout.sessions.create({
    customer_email: session.user.email,
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID,
        quantity: 1
      }
    ],
    mode: "payment",
    success_url: `${process.env.CANNONICAL_URL}/payment?success=true`,
    cancel_url: `${process.env.CANNONICAL_URL}/payment?canceled=true`,
  })

  //redirect
  redirect(checkoutSession.url)
}
