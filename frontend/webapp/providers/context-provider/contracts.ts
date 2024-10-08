export type SquintContext = {
  isRegistered: boolean
  setIsRegistered: React.Dispatch<React.SetStateAction<boolean>>
  isOrderSuccessfull: boolean
  setIsOrderSuccessfull: React.Dispatch<React.SetStateAction<boolean>>
  myRecipients: string
  setMyRecipients: React.Dispatch<React.SetStateAction<string>>
  myValueId: string
  setMyValueId: React.Dispatch<React.SetStateAction<string>>
}
