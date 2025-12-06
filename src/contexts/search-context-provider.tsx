"use client"

import { useState, createContext } from "react"

type SearchContextProviderProps = {
  children: React.ReactNode
}

type TSearchContext = {
  searchQuery: string
  handleChangeSearchQuerry: (querry: string) => void
}

export const SearchContext = createContext<TSearchContext | null>(null)

export default function SearchContextProvider({ children }: SearchContextProviderProps) {
  //state
  const [searchQuery, setSearchQuerry] = useState("")

  //derived state

  //event handlers / actions
  const handleChangeSearchQuerry = (querry: string) => {
    setSearchQuerry(querry)
  }


  return (
    <SearchContext.Provider
      value={{
        searchQuery,
        handleChangeSearchQuerry
      }}>
      {children}
    </SearchContext.Provider>
  )
}

