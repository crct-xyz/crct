'use client'

import { type ReactNode, createContext, useContext, useState } from 'react'
import { SquintContext } from './contracts'

const Context = createContext<SquintContext | null>(null)

export function UserProvider({ children }: { children: ReactNode }) {
    const [isRegistered, setIsRegistered] = useState<boolean>(true)
    const [isOrderSuccessfull, setIsOrderSuccessfull] = useState<boolean>(false)
    const [myRecipients, setMyRecipients] = useState<string>('')
    const [myValueId, setMyValueId] = useState<string>('')
    return (
        <Context.Provider
            value={{
                isRegistered,
                setIsRegistered,
                isOrderSuccessfull,
                setIsOrderSuccessfull,
                myRecipients,
                setMyRecipients,
                myValueId,
                setMyValueId,
            }}
        >
            {children}
        </Context.Provider>
    )
}

export function useUserContext() {
    const context = useContext(Context)
    if (!context) {
        throw new Error('useUserContext must be used within a UserProvider')
    }

    return context
}
