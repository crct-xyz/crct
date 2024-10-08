'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import JupyterIcon from 'components/icons/jupyter-icon'
import SquadsIcon from 'components/icons/squads-icon'
import TensorIcon from 'components/icons/tensor-icon'
import RegistrationComp from 'components/registration/registration'
import type { Metadata } from 'next'
import { useRouter } from 'next/navigation'
import { useUserContext } from 'providers/context-provider/context-provider'
import type React from 'react'
import { Fragment, type MouseEvent, useEffect, useState } from 'react'

// export const metadata: Metadata = {
//     title: 'Crct app',
//     description: 'Crct',
//     icons: {
//         icon: 'icon.ico',
//     },
// }

export default function Page() {
    const { wallet, publicKey, connected } = useWallet()
    const router = useRouter()
    const { isRegistered, setIsRegistered } = useUserContext()
    const apiUrl = 'https://squint-api.vercel.app/orders/'

    const { data, error, isFetching, isLoading, isSuccess } = useQuery({
        queryKey: ['users'],
        enabled: connected,
        queryFn: async () => {
            const response = await axios.get(
                `https://squint-api.vercel.app/users/${publicKey?.toString()}`
            )
            const data = await response.data
            setIsRegistered(data.is_registered)
            return data
        },
    })

    const handleRegistration = async (telegramUser: string) => {
        try {
            await axios
                .post('https://squint-api.vercel.app/users', {
                    wallet_public_key: publicKey,
                    telegram_username: telegramUser,
                })
                .then((res) => {
                    setIsRegistered(res.data.is_registered)
                })
            router.push('/order-page')
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(() => {
        if (!connected) {
            router.push('/')
        }
        // if (connected && !isRegistered) {
        //     router.push('/')
        // }
    }, [connected, router.push])

    useEffect(() => {
        if (connected && !isRegistered) {
            router.push('/')
        }

        if (connected && isRegistered) {
            router.push('/order-page')
        }
    }, [connected, isRegistered, router.push])

    return (
        <Fragment>
            {connected && isSuccess && !isRegistered && (
                <RegistrationComp handleRegistration={handleRegistration} />
            )}
            <div className="mt-[25px] mb-[25px] flex flex-col items-center gap-5 text-center">
                <a
                    type="button"
                    href="https://docs.google.com/forms/d/e/1FAIpQLSfvzQslsbyG6G_-nuy6X61pIEE647RbEoProtxUrbY5xHzcyw/viewform?usp=sf_link"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full rounded-xl bg-[#00CED1] p-3 text-black md:w-80"
                >
                    JOIN THE WAITLIST
                </a>
            </div>
            <div className="flex flex-col items-center justify-center text-center text-xl">
                <p className="md:w-[30rem]">
                    <span className="text-[#00CED1]">
                        ONE STOP SHOP PROVIDER FOR&nbsp;
                    </span>
                    <span className="text-white">CUSTOM CRYPTO ALERTS </span>
                    <span className="text-[#00CED1]">AND EASY </span>
                    <span className="text-white">EXECUTION</span>
                </p>
            </div>
            <div className="flex h-full flex-col flex-wrap items-center justify-center gap-12 py-10 md:flex-row">
                <div className="flex flex-col text-center">
                    <span className="text-white">SELECT AN APP</span>
                    <div className="md:w-92 border-light-white mt-5 flex h-[332px] w-auto flex-col items-center justify-between gap-5 rounded-lg border-2 border-solid bg-[#837e7e] px-5 py-5">
                        <button type="button">
                            <SquadsIcon />
                        </button>
                        <button
                            type="button"
                            className="h-16 w-16"
                        >
                            <JupyterIcon />
                        </button>
                        <button type="button">
                            <TensorIcon />
                        </button>
                    </div>
                </div>
                <div className="flex flex-col text-center">
                    <span className="text-white">CHOOSE YOUR ACTION</span>
                    <div className="md:w-92 border-light-white mt-5 flex w-auto flex-col gap-5 rounded-lg border-2 border-solid bg-[#837e7e] px-5 py-5">
                        <button
                            type="button"
                            className="rounded-lg bg-[#D9D9D9]"
                        >
                            SEND TX
                        </button>
                        <button
                            type="button"
                            className="rounded-lg bg-[#D9D9D9]"
                        >
                            REVIEW TX
                        </button>
                        <button
                            type="button"
                            className="rounded-lg bg-[#D9D9D9]"
                        >
                            DEPOSIT TX
                        </button>
                        <button
                            type="button"
                            className="rounded-lg bg-[#D9D9D9]"
                        >
                            CANCEL TX
                        </button>
                        <button
                            type="button"
                            className="rounded-lg bg-[#D9D9D9]"
                        >
                            BUY
                        </button>
                        <button
                            type="button"
                            className="rounded-lg bg-[#D9D9D9]"
                        >
                            ADD MEMBER
                        </button>
                        <button
                            type="button"
                            className="rounded-lg bg-[#D9D9D9] px-2"
                        >
                            REMOVE MEMBER
                        </button>
                    </div>
                </div>
                <div className="flex flex-col text-center">
                    <span className="text-white">SET YOUR CUSTOM TRIGGER</span>
                    <div className="md:w-92 border-light-white mt-5 flex w-auto flex-col gap-5 rounded-lg border-2 border-solid bg-[#837e7e] px-5 py-5">
                        <button
                            type="button"
                            className="rounded-lg bg-[#00CED1] px-2"
                        >
                            TIME
                        </button>
                        <button
                            type="button"
                            className="rounded-lg bg-[#00CED1] px-2"
                        >
                            WALLET BALANCE
                        </button>
                        <button
                            type="button"
                            className="rounded-lg bg-[#00CED1] px-2"
                        >
                            TRADING VOLUME
                        </button>
                        <button
                            type="button"
                            className="rounded-lg bg-[#00CED1] px-2"
                        >
                            INCOMING TX
                        </button>
                        <button
                            type="button"
                            className="rounded-lg bg-[#00CED1] px-2"
                        >
                            SWAP ACTION
                        </button>
                        <button
                            type="button"
                            className="rounded-lg bg-[#00CED1] px-2"
                        >
                            WALLET ACTIVITY
                        </button>
                        <button
                            type="button"
                            className="rounded-lg bg-[#00CED1] px-2"
                        >
                            PENDING TX
                        </button>
                    </div>
                </div>
            </div>
            <div className="flex flex-col items-center gap-5 text-center">
                <p className="text-white">
                    1. YOU SET UP YOUR&nbsp;
                    <span className="text-[#00CED1]">ACTION</span>
                </p>
                <p className="text-white">
                    2. WE
                    <span className="text-[#00CED1]"> BUILD YOUR TX,</span> ONCE
                    THE TRIGGER IS PULLED
                </p>
                <p className="text-white">
                    3. WE <span className="text-[#00CED1]">SEND&nbsp;</span>THE
                    EXECUTABLE <span className="text-[#00CED1]">TX TO YOU</span>
                </p>
                <p className="text-white">
                    4. YOU
                    <span className="text-[#00CED1]">
                        &nbsp;EXECUTE YOUR TX&nbsp;
                    </span>
                    WITH A BLINK
                </p>
            </div>
            <div className="mt-[25px] flex flex-col items-center gap-5 text-center">
                <span className="text-2xl font-semibold text-[#00CED1]">
                    COMING SOON
                </span>
            </div>
        </Fragment>
    )
}
