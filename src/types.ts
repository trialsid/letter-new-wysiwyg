export type StepId = 'sender' | 'recipient' | 'subject' | 'body' | 'closing' | 'extras'

export interface LetterData {
  senderName: string
  senderDesignation: string
  senderOrganisation: string
  senderAddressLine1: string
  senderAddressLine2: string
  senderCity: string
  senderState: string
  senderPostalCode: string
  senderPhone: string
  senderEmail: string
  letterDate: string
  recipientName: string
  recipientDesignation: string
  recipientOrganisation: string
  recipientAddressLine1: string
  recipientAddressLine2: string
  recipientCity: string
  recipientState: string
  recipientPostalCode: string
  recipientCountry: string
  subject: string
  reference: string
  salutation: string
  gratitude: string
  body: string
  closing: string
  copies: string
  enclosures: string
}
