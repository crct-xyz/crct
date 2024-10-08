import React from 'react'

function TriggerEventTime() {
    return (
        <div className="flex flex-col items-center justify-center text-center">
            <span className="mt-9 text-white">
                PLEASE PROVIDE DETAILS FOR THE <br /> TRIGGER EVENT
            </span>
            <form className="border-light-white mt-3 flex flex-col gap-5 rounded-lg border-2 border-solid bg-[#837e7e] px-5 py-5 w-auto">
                <label
                    className="mb-[-1.5vh] text-base"
                    htmlFor="triggerTime"
                >
                    Enter time
                </label>
                <input
                    id="triggerTime"
                    className="rounded-lg bg-[#D9D9D9] px-2 placeholder:text-xs"
                    type="datetime-local"
                />
            </form>
        </div>
    )
}

export default TriggerEventTime
