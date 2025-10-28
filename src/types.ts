export type StepId =
  | 'recipient'
  | 'subject'
  | 'salutation'
  | 'body'
  | 'closing'
  | 'copies'

export interface LetterData {
  recipientName: string
  recipientTitle: string
  recipientCompany: string
  recipientAddress: string
  recipientCity: string
  recipientState: string
  recipientPostalCode: string
  recipientCountry: string
  subject: string
  reference: string
  salutation: string
  body: string
  closing: string
  senderName: string
  senderTitle: string
  copies: string
}
