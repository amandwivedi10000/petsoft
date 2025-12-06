"use client"

import { addPet, checkoutPet, editPet } from "@/actions/actions"
import { PetEssentials } from "@/lib/types"
import { Pet } from "@prisma/client"
import { useState, createContext, useOptimistic } from "react"
import { toast } from "sonner"

type PetContextProviderProps = {
  data: Pet[]
  children: React.ReactNode
}

type TPetContext = {
  pets: Pet[]
  selectedPetId: Pet["id"] | null
  selectedPet: Pet | undefined
  numberOfPets: number
  handleAddPet: (newPet: PetEssentials) => Promise<void>
  handleEditPet: (petId: Pet["id"], newPetData: PetEssentials) => Promise<void>
  handleCheckoutPet: (petId: Pet["id"]) => Promise<void>
  handleChangeSelectedPetId: (petId: Pet["id"]) => void
}

export const PetContext = createContext<TPetContext | null>(null)

export default function PetContextProvider({ data, children }: PetContextProviderProps) {
  //state
  const [optimisticPets, setOptimisticPets] = useOptimistic(
    data,
    (state, { action, payload }) => {
      switch (action) {
        case "add":
          return [...state, { ...payload, id: Math.random().toString() }]
        case "edit":
          return state.map((pet) => {
            if (pet.id === payload.petId) {
              return { ...pet, ...payload.newPet }
            }
            return pet
          })
        case "delete":
          return state.filter((pet) => pet.id !== payload.petId)
        default:
          return state
      }
    })
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null)

  //derived state
  const selectedPet = optimisticPets.find((pet) => pet.id === selectedPetId)
  const numberOfPets = optimisticPets.length

  // event handlers / actions
  const handleAddPet = async (newPet: PetEssentials) => {
    setOptimisticPets({ action: "add", payload: newPet })
    const error = await addPet(newPet)
    if (error) {
      toast.warning(error.message)
      return;
    }
  }
  const handleEditPet = async (petId: Pet["id"], newPet: PetEssentials) => {
    setOptimisticPets({ action: "edit", payload: { petId, newPet } })
    const error = await editPet(petId, newPet)
    if (error) {
      toast.warning(error.message)
      return;
    }
  }
  const handleCheckoutPet = async (petId: string) => {
    setOptimisticPets({ action: "delete", payload: { petId: petId } })
    const error = await checkoutPet(petId)
    if (error) {
      toast.warning(error.message)
      return;
    }
    setSelectedPetId(null)
  }
  const handleChangeSelectedPetId = (petId: Pet["id"]) => {
    setSelectedPetId(petId)
  }


  return (
    <PetContext.Provider
      value={{
        pets: optimisticPets,
        selectedPetId,
        selectedPet,
        numberOfPets,
        handleAddPet,
        handleEditPet,
        handleCheckoutPet,
        handleChangeSelectedPetId
      }}>
      {children}
    </PetContext.Provider>
  )
}

