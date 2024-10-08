import React from 'react'

function USDCuseCases() {
  return (
    <div className="flex flex-col text-center justify-center items-center">
                <span className="mt-9 text-white">CHOOSE YOUR ACTION</span>
                <div className="border-light-white mt-3 flex flex-col gap-5 rounded-lg border-2 border-solid bg-[#837e7e] px-5 py-5 md:w-[15.5vw]">
                    <button
                        type="button"
                        className="rounded-lg bg-[#D9D9D9]"
                    >
                        REQUEST MONEY
                    </button>
                    <button
                        type="button"
                        className="rounded-lg bg-[#D9D9D9]"
                    >
                        BRIDGE USDC
                    </button>
                </div>
            </div>
  )
}

export default USDCuseCases