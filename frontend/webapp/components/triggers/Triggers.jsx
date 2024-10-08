'use client'
import TriggerEventTime from 'components/triggerEventTime/TriggerEventTime'
import React, { useState } from 'react'

function Triggers() {
    const [showTriggers, setShowTriggers] = useState(false);

    // Function to handle button click
    const handleTriggersClick = () => {
        setShowTriggers(prevState => !prevState);
    };
  return (
    <div className="flex flex-col items-center justify-center text-center">
            <div className="flex flex-col text-center items-center justify-center">
                <span className="mt-9 text-white">SET YOUR CUSTOM TRIGGERS</span>
                <div className="border-light-white mt-3 flex flex-col gap-5 rounded-lg border-2 border-solid bg-[#837e7e] px-5 py-5 w-auto">
                    <button
                        type="button"
                        className={`rounded-lg ${showTriggers ? 'bg-[#00CED1]' : 'bg-[#D9D9D9]'}`}
                        onClick={handleTriggersClick}
                    >
                        TIME
                    </button>
                    <button
                        type="button"
                        className="rounded-lg bg-[#D9D9D9]"
                    >
                        WALLET BALANCE
                    </button>
                    <button
                        type="button"
                        className="rounded-lg bg-[#D9D9D9]"
                    >
                        TRADING VOLUME
                    </button>
                    <button
                        type="button"
                        className="rounded-lg bg-[#D9D9D9]"
                    >
                        PENDING TX
                    </button>
                    <button
                        type="button"
                        className="rounded-lg bg-[#D9D9D9]"
                    >
                        INCOMING TX
                    </button>
                    <button
                        type="button"
                        className="rounded-lg bg-[#D9D9D9]"
                    >
                        SWAP ACTION
                    </button>
                    <button
                        type="button"
                        className="rounded-lg bg-[#D9D9D9]"
                    >
                        WALLET ACTIVITY
                    </button>
                </div>
            </div>
            {showTriggers && <TriggerEventTime />}
        </div>
  )
}

export default Triggers
