import { forwardRef, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import './App.css'
import type { LetterData, StepId } from './types'

interface StepConfig {
  id: StepId
  title: string
  description: string
}

const indianDateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})

const todayIsoDate = new Date().toISOString().slice(0, 10)

const steps: StepConfig[] = [
  {
    id: 'sender',
    title: 'Sender details',
    description: 'Set the origin address and contact information.',
  },
  {
    id: 'recipient',
    title: 'Recipient details',
    description: 'Add the recipient’s name, designation, and address.',
  },
  {
    id: 'subject',
    title: 'Subject & reference',
    description: 'Summarise the purpose of the letter.',
  },
  {
    id: 'body',
    title: 'Salutation & body',
    description: 'Compose the main message in clear paragraphs.',
  },
  {
    id: 'closing',
    title: 'Closing & signature',
    description: 'Add the sign-off and sender details.',
  },
  {
    id: 'extras',
    title: 'Enclosures & copy',
    description: 'List annexures or CC recipients.',
  },
]

const defaultPreviewContent = {
  sender: {
    organisation: 'Department of Rural Development and Panchayat Raj',
    addressLine1: 'No. 47, Shastri Bhavan',
    addressLine2: 'Dr Rajendra Prasad Road',
    city: 'New Delhi',
    state: 'Delhi',
    pin: '110001',
    phone: '011-23097000',
    email: 'bdo.delhi@gov.in',
  },
  recipient: {
    name: 'The Managing Director',
    designation: 'National Infrastructure Development Corporation',
    organisation: 'Nirman Bhawan',
    addressLine1: 'Maulana Azad Road',
    addressLine2: 'New Delhi - 110011',
    city: 'New Delhi',
    state: 'Delhi',
    pin: '110011',
    country: 'India',
  },
  subject: 'Request for administrative approval of rural road proposal',
  reference: 'RDPR/2024/Infra/118',
  salutation: 'Respected Sir/Madam,',
  body: [
    'With due respect, I wish to submit the detailed project report for the proposed upgradation of the village access road connecting Chikkaballapur to the national highway.',
    'The project has been discussed with the Gram Sabha and has received unanimous approval. The necessary land acquisition details, cost estimates, and utility shifting plans are enclosed for your perusal.',
    'I request you to kindly accord administrative approval at the earliest so that tendering activities may commence without delay.',
  ],
  gratitude: 'Thanking you,',
  closing: 'Yours faithfully,',
  senderName: 'Ramesh Kumar',
  senderDesignation: 'Block Development Officer',
  senderOrganisation: 'Office of the Block Development Officer',
  enclosures: [
    'Annexure I – Detailed project report',
    'Annexure II – Gram Sabha resolution',
  ],
  copies: [
    'Deputy Commissioner, Chikkaballapur',
    'Executive Engineer, PWD Division',
  ],
}

const emptyLetter: LetterData = {
  senderName: '',
  senderDesignation: '',
  senderOrganisation: '',
  senderAddressLine1: '',
  senderAddressLine2: '',
  senderCity: '',
  senderState: '',
  senderPostalCode: '',
  senderPhone: '',
  senderEmail: '',
  letterDate: '',
  recipientName: '',
  recipientDesignation: '',
  recipientOrganisation: '',
  recipientAddressLine1: '',
  recipientAddressLine2: '',
  recipientCity: '',
  recipientState: '',
  recipientPostalCode: '',
  recipientCountry: '',
  subject: '',
  reference: '',
  salutation: '',
  gratitude: '',
  body: '',
  closing: '',
  copies: '',
  enclosures: '',
}

function formatIndianDate(value: string) {
  if (!value) {
    return ''
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return indianDateFormatter.format(parsed)
}

function App() {
  const [letter, setLetter] = useState<LetterData>(emptyLetter)
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)

  const canGoBack = activeStepIndex > 0
  const canGoForward = activeStepIndex < steps.length - 1

  const activeStepId = useMemo(
    () => steps[activeStepIndex]?.id ?? 'sender',
    [activeStepIndex],
  )

  const updateField = (field: keyof LetterData, value: string) => {
    setLetter((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (canGoForward) {
      setActiveStepIndex((prev) => Math.min(prev + 1, steps.length - 1))
    }
  }

  const resetLetter = () => {
    setLetter(emptyLetter)
    setActiveStepIndex(0)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPdf = async () => {
    if (!previewRef.current) {
      return
    }

    setIsGeneratingPdf(true)
    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      })
      const imageData = canvas.toDataURL('image/png')

      const pdf = new jsPDF('p', 'pt', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      const imageWidth = pageWidth
      const imageHeight = (canvas.height * imageWidth) / canvas.width

      let heightLeft = imageHeight
      let position = 0

      pdf.addImage(imageData, 'PNG', 0, position, imageWidth, imageHeight)
      heightLeft -= pageHeight

      while (heightLeft > 0) {
        position = heightLeft - imageHeight
        pdf.addPage()
        pdf.addImage(imageData, 'PNG', 0, position, imageWidth, imageHeight)
        heightLeft -= pageHeight
      }

      const sanitizedSubject = letter.subject.trim() || 'letter'
      const safeFileName = sanitizedSubject
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'letter'

      pdf.save(`${safeFileName}.pdf`)
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  return (
    <div className="app-shell">
      <section className="composer-pane">
        <header className="composer-header">
          <div>
            <p className="eyebrow">Letter composer</p>
            <h1>Indian formal letter</h1>
            <p className="subtitle">
              Move through the steps, fill in the fields, and see the printable layout update instantly.
            </p>
          </div>
          <button className="reset-button" type="button" onClick={resetLetter}>
            Reset
          </button>
        </header>

        <div className="composer-body">
          <nav className="step-list" aria-label="Letter form steps">
            {steps.map((step, index) => (
              <button
                key={step.id}
                type="button"
                className={`step-item ${index === activeStepIndex ? 'is-active' : ''}`}
                onClick={() => setActiveStepIndex(index)}
              >
                <span className="step-index">{index + 1}</span>
                <span>
                  <span className="step-title">{step.title}</span>
                  <span className="step-description">{step.description}</span>
                </span>
              </button>
            ))}
          </nav>

          <form className="step-form" onSubmit={handleSubmit}>
            <div className="form-fields">
              {activeStepId === 'sender' && (
                <div className="field-grid">
                  <label>
                    Organisation / Department
                    <input
                      type="text"
                      value={letter.senderOrganisation}
                      onChange={(event) => updateField('senderOrganisation', event.target.value)}
                      placeholder="e.g. Department of Education"
                    />
                  </label>
                  <label>
                    Address line 1
                    <input
                      type="text"
                      value={letter.senderAddressLine1}
                      onChange={(event) => updateField('senderAddressLine1', event.target.value)}
                      placeholder="123, MG Road"
                    />
                  </label>
                  <label>
                    Address line 2
                    <input
                      type="text"
                      value={letter.senderAddressLine2}
                      onChange={(event) => updateField('senderAddressLine2', event.target.value)}
                      placeholder="Near City Metro Station"
                    />
                  </label>
                  <label>
                    City
                    <input
                      type="text"
                      value={letter.senderCity}
                      onChange={(event) => updateField('senderCity', event.target.value)}
                      placeholder="Bengaluru"
                    />
                  </label>
                  <label>
                    State / UT
                    <input
                      type="text"
                      value={letter.senderState}
                      onChange={(event) => updateField('senderState', event.target.value)}
                      placeholder="Karnataka"
                    />
                  </label>
                  <label>
                    PIN code
                    <input
                      type="text"
                      value={letter.senderPostalCode}
                      onChange={(event) => updateField('senderPostalCode', event.target.value)}
                      placeholder="560001"
                    />
                  </label>
                  <label>
                    Phone number
                    <input
                      type="text"
                      value={letter.senderPhone}
                      onChange={(event) => updateField('senderPhone', event.target.value)}
                      placeholder="+91-9876543210"
                    />
                  </label>
                  <label>
                    Email address
                    <input
                      type="email"
                      value={letter.senderEmail}
                      onChange={(event) => updateField('senderEmail', event.target.value)}
                      placeholder="contact@example.in"
                    />
                  </label>
                  <label>
                    Letter date
                    <input
                      type="date"
                      value={letter.letterDate}
                      onChange={(event) => updateField('letterDate', event.target.value)}
                    />
                  </label>
                </div>
              )}

              {activeStepId === 'recipient' && (
                <div className="field-grid">
                  <label>
                    Recipient name
                    <input
                      type="text"
                      value={letter.recipientName}
                      onChange={(event) => updateField('recipientName', event.target.value)}
                      placeholder="e.g. Shri Rajesh Kumar"
                    />
                  </label>
                  <label>
                    Designation
                    <input
                      type="text"
                      value={letter.recipientDesignation}
                      onChange={(event) => updateField('recipientDesignation', event.target.value)}
                      placeholder="Joint Secretary"
                    />
                  </label>
                  <label>
                    Organisation
                    <input
                      type="text"
                      value={letter.recipientOrganisation}
                      onChange={(event) => updateField('recipientOrganisation', event.target.value)}
                      placeholder="Ministry of Finance"
                    />
                  </label>
                  <label>
                    Address line 1
                    <input
                      type="text"
                      value={letter.recipientAddressLine1}
                      onChange={(event) => updateField('recipientAddressLine1', event.target.value)}
                      placeholder="North Block"
                    />
                  </label>
                  <label>
                    Address line 2
                    <input
                      type="text"
                      value={letter.recipientAddressLine2}
                      onChange={(event) => updateField('recipientAddressLine2', event.target.value)}
                      placeholder="Central Secretariat"
                    />
                  </label>
                  <label>
                    City
                    <input
                      type="text"
                      value={letter.recipientCity}
                      onChange={(event) => updateField('recipientCity', event.target.value)}
                      placeholder="New Delhi"
                    />
                  </label>
                  <label>
                    State / UT
                    <input
                      type="text"
                      value={letter.recipientState}
                      onChange={(event) => updateField('recipientState', event.target.value)}
                      placeholder="Delhi"
                    />
                  </label>
                  <label>
                    PIN code
                    <input
                      type="text"
                      value={letter.recipientPostalCode}
                      onChange={(event) => updateField('recipientPostalCode', event.target.value)}
                      placeholder="110001"
                    />
                  </label>
                  <label>
                    Country
                    <input
                      type="text"
                      value={letter.recipientCountry}
                      onChange={(event) => updateField('recipientCountry', event.target.value)}
                      placeholder="India"
                    />
                  </label>
                </div>
              )}

              {activeStepId === 'subject' && (
                <div className="field-grid">
                  <label>
                    Subject line
                    <input
                      type="text"
                      value={letter.subject}
                      onChange={(event) => updateField('subject', event.target.value)}
                      placeholder="Request for sanction of funds"
                    />
                  </label>
                  <label>
                    Reference (optional)
                    <input
                      type="text"
                      value={letter.reference}
                      onChange={(event) => updateField('reference', event.target.value)}
                      placeholder="Ref: No. 23/2024"
                    />
                  </label>
                </div>
              )}

              {activeStepId === 'body' && (
                <div className="field-grid">
                  <label>
                    Salutation
                    <input
                      type="text"
                      value={letter.salutation}
                      onChange={(event) => updateField('salutation', event.target.value)}
                      placeholder="Respected Sir/Madam,"
                    />
                  </label>
                  <label className="textarea-field">
                    Letter body
                    <textarea
                      rows={12}
                      value={letter.body}
                      onChange={(event) => updateField('body', event.target.value)}
                      placeholder={'Introduce the subject, provide supporting details, and close with a clear request. Separate paragraphs with a blank line.'}
                    />
                  </label>
                </div>
              )}

              {activeStepId === 'closing' && (
                <div className="field-grid">
                  <label>
                    Courteous closing
                    <input
                      type="text"
                      value={letter.gratitude}
                      onChange={(event) => updateField('gratitude', event.target.value)}
                      placeholder="Thanking you,"
                    />
                  </label>
                  <label>
                    Sign-off line
                    <input
                      type="text"
                      value={letter.closing}
                      onChange={(event) => updateField('closing', event.target.value)}
                      placeholder="Yours faithfully,"
                    />
                  </label>
                  <label>
                    Sender name
                    <input
                      type="text"
                      value={letter.senderName}
                      onChange={(event) => updateField('senderName', event.target.value)}
                      placeholder="(Signature)"
                    />
                  </label>
                  <label>
                    Designation
                    <input
                      type="text"
                      value={letter.senderDesignation}
                      onChange={(event) => updateField('senderDesignation', event.target.value)}
                      placeholder="Block Education Officer"
                    />
                  </label>
                </div>
              )}

              {activeStepId === 'extras' && (
                <div className="field-grid">
                  <label className="textarea-field">
                    Enclosures (one per line)
                    <textarea
                      rows={5}
                      value={letter.enclosures}
                      onChange={(event) => updateField('enclosures', event.target.value)}
                      placeholder={'1. Copy of the utilisation certificate\n2. Annexure A'}
                    />
                  </label>
                  <label className="textarea-field">
                    Copy to (one per line)
                    <textarea
                      rows={5}
                      value={letter.copies}
                      onChange={(event) => updateField('copies', event.target.value)}
                      placeholder={'Principal, Government High School\nDistrict Treasury Officer'}
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="step-controls">
              <button
                type="button"
                className="secondary"
                onClick={() => setActiveStepIndex((prev) => Math.max(prev - 1, 0))}
                disabled={!canGoBack}
              >
                Previous
              </button>
              <button type="submit" className="primary">
                {canGoForward ? 'Next step' : 'Stay on this step'}
              </button>
            </div>
          </form>
        </div>
      </section>

      <main className="preview-pane">
        <div className="preview-toolbar">
          <div>
            <h2>Live preview</h2>
            <p>This layout is optimised for Indian formal letters and prints on A4.</p>
          </div>
          <div className="preview-actions">
            <button type="button" onClick={handlePrint}>
              Print / Save as PDF
            </button>
            <button type="button" onClick={handleDownloadPdf} disabled={isGeneratingPdf}>
              {isGeneratingPdf ? 'Preparing PDF…' : 'Download PDF'}
            </button>
          </div>
        </div>
        <LetterPreview ref={previewRef} letter={letter} activeStep={activeStepId} />
      </main>
    </div>
  )
}

interface PreviewProps {
  letter: LetterData
  activeStep: StepId
}

interface DisplayLine {
  text: string
  isPlaceholder: boolean
}

const PAGE_CHAR_LIMIT = 1300

const LetterPreview = forwardRef<HTMLDivElement, PreviewProps>(({ letter, activeStep }, ref) => {
  const bodyParagraphs = useMemo(() => {
    return letter.body
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
  }, [letter.body])

  const paginatedBody = useMemo(() => {
    const paragraphsToPaginate =
      bodyParagraphs.length > 0 ? bodyParagraphs : defaultPreviewContent.body

    if (paragraphsToPaginate.length === 0) {
      return [[]]
    }

    const pages: string[][] = [[]]
    let currentLength = 0

    paragraphsToPaginate.forEach((paragraph) => {
      const text = paragraph.trim()
      const additionLength = text.length

      if (currentLength + additionLength > PAGE_CHAR_LIMIT && pages[pages.length - 1].length > 0) {
        pages.push([text])
        currentLength = additionLength
      } else {
        pages[pages.length - 1].push(text)
        currentLength += additionLength
      }
    })

    return pages
  }, [bodyParagraphs])

  const isBodyPlaceholder = bodyParagraphs.length === 0

  const customCopies = useMemo(
    () =>
      letter.copies
        .split(/\n|,/)
        .map((entry) => entry.trim())
        .filter(Boolean),
    [letter.copies],
  )

  const customEnclosures = useMemo(
    () =>
      letter.enclosures
        .split(/\n|,/)
        .map((entry) => entry.trim())
        .filter(Boolean),
    [letter.enclosures],
  )

  const copyList = customCopies.length > 0 ? customCopies : defaultPreviewContent.copies
  const isCopyPlaceholder = customCopies.length === 0

  const enclosureList =
    customEnclosures.length > 0 ? customEnclosures : defaultPreviewContent.enclosures
  const isEnclosurePlaceholder = customEnclosures.length === 0

  const formattedDate = formatIndianDate(letter.letterDate) || formatIndianDate(todayIsoDate)
  const isDatePlaceholder = !letter.letterDate

  const makeLine = (value: string, fallback: string): DisplayLine | null => {
    const trimmedValue = value.trim()
    if (trimmedValue) {
      return { text: trimmedValue, isPlaceholder: false }
    }

    const trimmedFallback = fallback.trim()
    if (!trimmedFallback) {
      return null
    }

    return { text: trimmedFallback, isPlaceholder: true }
  }

  const senderAddressLines = [
    makeLine(letter.senderOrganisation, defaultPreviewContent.sender.organisation),
    makeLine(letter.senderAddressLine1, defaultPreviewContent.sender.addressLine1),
    makeLine(letter.senderAddressLine2, defaultPreviewContent.sender.addressLine2),
    makeLine(
      [letter.senderCity, letter.senderState].filter(Boolean).join(', '),
      `${defaultPreviewContent.sender.city}, ${defaultPreviewContent.sender.state}`,
    ),
    makeLine(
      letter.senderPostalCode ? `PIN: ${letter.senderPostalCode}` : '',
      `PIN: ${defaultPreviewContent.sender.pin}`,
    ),
  ].filter((line): line is DisplayLine => Boolean(line))

  const senderContactLines = [
    makeLine(
      letter.senderPhone ? `Phone: ${letter.senderPhone}` : '',
      defaultPreviewContent.sender.phone ? `Phone: ${defaultPreviewContent.sender.phone}` : '',
    ),
    makeLine(
      letter.senderEmail ? `Email: ${letter.senderEmail}` : '',
      defaultPreviewContent.sender.email ? `Email: ${defaultPreviewContent.sender.email}` : '',
    ),
  ].filter((line): line is DisplayLine => Boolean(line))

  const recipientAddressLines = [
    makeLine(
      [letter.recipientName, letter.recipientDesignation].filter(Boolean).join(', '),
      [
        defaultPreviewContent.recipient.name,
        defaultPreviewContent.recipient.designation,
      ]
        .filter(Boolean)
        .join(', '),
    ),
    makeLine(letter.recipientOrganisation, defaultPreviewContent.recipient.organisation),
    makeLine(letter.recipientAddressLine1, defaultPreviewContent.recipient.addressLine1),
    makeLine(letter.recipientAddressLine2, defaultPreviewContent.recipient.addressLine2),
    makeLine(
      [letter.recipientCity, letter.recipientState].filter(Boolean).join(', '),
      `${defaultPreviewContent.recipient.city}, ${defaultPreviewContent.recipient.state}`,
    ),
    makeLine(
      letter.recipientPostalCode ? `PIN: ${letter.recipientPostalCode}` : '',
      `PIN: ${defaultPreviewContent.recipient.pin}`,
    ),
    makeLine(letter.recipientCountry, defaultPreviewContent.recipient.country),
  ].filter((line): line is DisplayLine => Boolean(line))

  const subjectLine = makeLine(letter.subject, defaultPreviewContent.subject)
  const referenceLine = makeLine(letter.reference, defaultPreviewContent.reference)
  const salutationLine = makeLine(letter.salutation, defaultPreviewContent.salutation)
  const gratitudeLine = makeLine(letter.gratitude, defaultPreviewContent.gratitude)
  const closingLine = makeLine(letter.closing, defaultPreviewContent.closing)
  const senderNameLine = makeLine(letter.senderName, defaultPreviewContent.senderName)
  const senderDesignationLine = makeLine(
    letter.senderDesignation,
    defaultPreviewContent.senderDesignation,
  )
  const signatureOrganisationLine = makeLine(
    letter.senderOrganisation,
    defaultPreviewContent.senderOrganisation,
  )

  return (
    <div className="preview-scroll" ref={ref} aria-live="polite">
      {paginatedBody.map((pageParagraphs, pageIndex) => {
        const isFirst = pageIndex === 0
        const isLast = pageIndex === paginatedBody.length - 1

        return (
          <div key={pageIndex} className="preview-sheet">
            <article className="preview-page">
              <div className="page-inner">
                {isFirst && (
                  <>
                    <header className="preview-header">
                    <section
                      className={`preview-section sender-section ${
                        activeStep === 'sender' ? 'is-highlighted' : ''
                      }`}
                    >
                      {senderAddressLines.map((line, index) => (
                        <p
                          key={index}
                          className={line.isPlaceholder ? 'placeholder-text' : undefined}
                        >
                          {line.text}
                        </p>
                      ))}
                      {senderContactLines.map((line, index) => (
                        <p
                          key={`contact-${index}`}
                          className={line.isPlaceholder ? 'placeholder-text' : undefined}
                        >
                          {line.text}
                        </p>
                      ))}
                    </section>
                    <p
                      className={`letter-date${isDatePlaceholder ? ' placeholder-text' : ''}`}
                    >
                      Date: {formattedDate}
                    </p>
                  </header>

                  <section
                    className={`preview-section recipient-section ${
                      activeStep === 'recipient' ? 'is-highlighted' : ''
                    }`}
                  >
                    <p className="recipient-label">To,</p>
                    {recipientAddressLines.map((line, index) => (
                      <p
                        key={index}
                        className={line.isPlaceholder ? 'placeholder-text' : undefined}
                      >
                        {line.text}
                      </p>
                    ))}
                  </section>

                  {subjectLine && (
                    <section
                      className={`preview-section subject-section ${
                        activeStep === 'subject' ? 'is-highlighted' : ''
                      }`}
                    >
                      <p
                        className={`subject-line${
                          subjectLine.isPlaceholder ? ' placeholder-text' : ''
                        }`}
                      >
                        <span>Subject:</span> {subjectLine.text}
                      </p>
                    </section>
                  )}

                  {referenceLine && (
                    <section
                      className={`preview-section reference-section ${
                        activeStep === 'subject' ? 'is-highlighted' : ''
                      }`}
                    >
                      <p
                        className={`reference-line${
                          referenceLine.isPlaceholder ? ' placeholder-text' : ''
                        }`}
                      >
                        <span>Ref:</span> {referenceLine.text}
                      </p>
                    </section>
                  )}

                  {salutationLine && (
                    <section
                      className={`preview-section salutation-section ${
                        activeStep === 'body' ? 'is-highlighted' : ''
                      }`}
                    >
                      <p
                        className={
                          salutationLine.isPlaceholder ? 'placeholder-text' : undefined
                        }
                      >
                        {salutationLine.text}
                      </p>
                    </section>
                  )}
                </>
              )}

              <section
                className={`preview-section body-section ${
                  activeStep === 'body' ? 'is-highlighted' : ''
                }`}
              >
                {pageParagraphs.map((paragraph, paragraphIndex) => (
                  <p
                    key={paragraphIndex}
                    className={isBodyPlaceholder ? 'placeholder-text' : undefined}
                  >
                    {paragraph}
                  </p>
                ))}
              </section>

              {isLast && (
                <>
                  {gratitudeLine && (
                    <section
                      className={`preview-section gratitude-section ${
                        activeStep === 'closing' ? 'is-highlighted' : ''
                      }`}
                    >
                      <p
                        className={
                          gratitudeLine.isPlaceholder ? 'placeholder-text' : undefined
                        }
                      >
                        {gratitudeLine.text}
                      </p>
                    </section>
                  )}

                  <section
                    className={`preview-section closing-section ${
                      activeStep === 'closing' ? 'is-highlighted' : ''
                    }`}
                  >
                    {closingLine && (
                      <p
                        className={
                          closingLine.isPlaceholder ? 'placeholder-text' : undefined
                        }
                      >
                        {closingLine.text}
                      </p>
                    )}
                    <div className="signature-block">
                      {senderNameLine && (
                        <p
                          className={
                            senderNameLine.isPlaceholder ? 'placeholder-text' : undefined
                          }
                        >
                          {senderNameLine.text}
                        </p>
                      )}
                      {senderDesignationLine && (
                        <p
                          className={
                            senderDesignationLine.isPlaceholder ? 'placeholder-text' : undefined
                          }
                        >
                          {senderDesignationLine.text}
                        </p>
                      )}
                      {signatureOrganisationLine && (
                        <p
                          className={
                            signatureOrganisationLine.isPlaceholder
                              ? 'placeholder-text'
                              : undefined
                          }
                        >
                          {signatureOrganisationLine.text}
                        </p>
                      )}
                    </div>
                  </section>

                  {enclosureList.length > 0 && (
                    <section
                      className={`preview-section enclosure-section ${
                        activeStep === 'extras' ? 'is-highlighted' : ''
                      }`}
                    >
                      <p className="section-label">Enclosures:</p>
                      <ul>
                        {enclosureList.map((entry, index) => (
                          <li
                            key={index}
                            className={
                              isEnclosurePlaceholder ? 'placeholder-text' : undefined
                            }
                          >
                            {entry}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {copyList.length > 0 && (
                    <section
                      className={`preview-section copies-section ${
                        activeStep === 'extras' ? 'is-highlighted' : ''
                      }`}
                    >
                      <p className="section-label">Copy to:</p>
                      <ul>
                        {copyList.map((entry, index) => (
                          <li
                            key={index}
                            className={isCopyPlaceholder ? 'placeholder-text' : undefined}
                          >
                            {entry}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </>
              )}
              </div>
              <footer className="page-footer">Page {pageIndex + 1}</footer>
            </article>
            {!isLast && (
              <div className="page-break-indicator" aria-hidden="true">
                <span>Page break</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
})

LetterPreview.displayName = 'LetterPreview'

export default App
