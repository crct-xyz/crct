const ConfirmationModal = ({
    setisOrderSuccessfull,
}: {
    setisOrderSuccessfull: (value: boolean) => void
}) => {
    //@ts-ignore
    return (
        <div className="top-30 absolute right-0 left-0 mx-auto w-96 animate-fadeInUp rounded-md border bg-white p-5 shadow-lg">
            <div className="mt-3 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                    <svg
                        className="h-6 w-6 text-[#00CED1]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w.org/2000/svg"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M5 13l4 4L19 7"
                        ></path>
                    </svg>
                </div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Your order was submitted
                </h3>
                <div className="items-center px-4 py-3">
                    <button
                        id="ok-btn"
                        className="w-full rounded-md bg-[#00CED1] px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-300"
                        onClick={() => setisOrderSuccessfull(false)}
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ConfirmationModal
