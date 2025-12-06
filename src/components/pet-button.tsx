"use client"

import { PlusIcon } from "@radix-ui/react-icons"
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import PetForm from "./pet-form";
import { useState } from "react";
import { flushSync } from "react-dom";

type PetButtonProps = {
  actionType: "add" | "edit" | "checkout"
  children?: React.ReactNode
  onClick?: () => void
  disabled?: boolean
}

export default function PetButton({ actionType, onClick, disabled, children }: PetButtonProps) {

  const [isFormOpen, setIsFormOpen] = useState(false)

  if (actionType === "checkout") {
    return <Button variant="secondary" disabled={disabled} onClick={onClick}>{children}</Button>
  }
  return (
    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
      <DialogTrigger asChild>
        {
          actionType === "add" ? (
            <Button size="icon">
              <PlusIcon className="h-6 w-6" />
            </Button>
          ) : (
            <Button variant="secondary">{children}</Button>
          )
        }
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{actionType === "add" ? "Add Pet" : "Edit Pet"}</DialogTitle>
        </DialogHeader>

        <PetForm actionType={actionType} onFormSubmit={() => {
          flushSync(() => {
            setIsFormOpen(false)
          })
        }} />
      </DialogContent>
    </Dialog>
  )
}

