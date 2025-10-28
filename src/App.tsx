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
  letterDate: todayIsoDate,
  recipientName: '',
  recipientDesignation: '',
  recipientOrganisation: '',
  recipientAddressLine1: '',
  recipientAddressLine2: '',
  recipientCity: '',
  recipientState: '',
  recipientPostalCode: '',
  recipientCountry: 'India',
  subject: '',
  reference: '',
  salutation: 'Respected Sir/Madam,',
  body: '',
  closing: 'Yours faithfully,',
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
      <aside className="form-pane">
        <header className="form-header">
          <div>
            <p className="eyebrow">Letter composer</p>
            <h1>Indian formal letter</h1>
            <p className="subtitle">
              Work through each step on the left and watch the preview update on the right.
            </p>
          </div>
          <button className="reset-button" type="button" onClick={resetLetter}>
            Reset
          </button>
        </header>

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
                Closing phrase
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
      </aside>

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

const PAGE_CHAR_LIMIT = 1300

const LetterPreview = forwardRef<HTMLDivElement, PreviewProps>(({ letter, activeStep }, ref) => {
  const paragraphs = useMemo(() => {
    return letter.body
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
  }, [letter.body])

  const paginatedBody = useMemo(() => {
    if (paragraphs.length === 0) {
      return [[]]
    }

    const pages: string[][] = [[]]
    let currentLength = 0

    paragraphs.forEach((paragraph) => {
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
  }, [paragraphs])

  const isBodyEmpty = paragraphs.length === 0

  const ccList = useMemo(
    () =>
      letter.copies
        .split(/\n|,/)
        .map((entry) => entry.trim())
        .filter(Boolean),
    [letter.copies],
  )

  const enclosureList = useMemo(
    () =>
      letter.enclosures
        .split(/\n|,/)
        .map((entry) => entry.trim())
        .filter(Boolean),
    [letter.enclosures],
  )

  const formattedDate = formatIndianDate(letter.letterDate) || formatIndianDate(todayIsoDate)

  const senderAddressLines = [
    letter.senderOrganisation || 'Organisation / Department',
    letter.senderAddressLine1 || 'Address line 1',
    letter.senderAddressLine2,
    [letter.senderCity, letter.senderState].filter(Boolean).join(', ') || 'City, State/UT',
    letter.senderPostalCode ? `PIN: ${letter.senderPostalCode}` : 'PIN: _______',
  ].filter(Boolean)

  const contactLines = [
    letter.senderPhone ? `Phone: ${letter.senderPhone}` : '',
    letter.senderEmail ? `Email: ${letter.senderEmail}` : '',
  ].filter(Boolean)

  const recipientAddressLines = [
    [letter.recipientName, letter.recipientDesignation].filter(Boolean).join(', ') || 'Recipient name, designation',
    letter.recipientOrganisation || 'Organisation',
    letter.recipientAddressLine1 || 'Address line 1',
    letter.recipientAddressLine2,
    [letter.recipientCity, letter.recipientState].filter(Boolean).join(', ') || 'City, State/UT',
    letter.recipientPostalCode ? `PIN: ${letter.recipientPostalCode}` : 'PIN: _______',
    letter.recipientCountry || 'India',
  ].filter(Boolean)

  return (
    <div className="preview-scroll" ref={ref} aria-live="polite">
      {paginatedBody.map((pageParagraphs, pageIndex) => {
        const isFirst = pageIndex === 0
        const isLast = pageIndex === paginatedBody.length - 1

        return (
          <article key={pageIndex} className="preview-page">
            <div className="page-inner">
              {isFirst && (
                <section className={`preview-section sender-section ${activeStep === 'sender' ? 'is-highlighted' : ''}`}>
                  <div>
                    {senderAddressLines.map((line, index) => (
                      <p key={index}>{line}</p>
                    ))}
                    {contactLines.map((line, index) => (
                      <p key={`contact-${index}`}>{line}</p>
                    ))}
                  </div>
                  <p className="letter-date">Date: {formattedDate}</p>
                </section>
              )}

              {isFirst && (
                <section className={`preview-section recipient-section ${activeStep === 'recipient' ? 'is-highlighted' : ''}`}>
                  {recipientAddressLines.map((line, index) => (
                    <p key={index}>{line}</p>
                  ))}
                </section>
              )}

              {isFirst && (
                <section className={`preview-section subject-section ${activeStep === 'subject' ? 'is-highlighted' : ''}`}>
                  <p className="subject-line">
                    <span>Subject:</span> {letter.subject || 'Enter a brief subject'}
                  </p>
                  {letter.reference && (
                    <p className="reference-line">
                      <span>Ref:</span> {letter.reference}
                    </p>
                  )}
                </section>
              )}

              {isFirst && (
                <section className={`preview-section salutation-section ${activeStep === 'body' ? 'is-highlighted' : ''}`}>
                  <p>{letter.salutation || 'Respected Sir/Madam,'}</p>
                </section>
              )}

              <section className={`preview-section body-section ${activeStep === 'body' ? 'is-highlighted' : ''}`}>
                {isBodyEmpty ? (
                  isFirst ? (
                    <p className="placeholder">Start typing your message to see it here.</p>
                  ) : null
                ) : (
                  pageParagraphs.map((paragraph, paragraphIndex) => (
                    <p key={paragraphIndex}>{paragraph}</p>
                  ))
                )}
              </section>

              {isLast && (
                <section className={`preview-section closing-section ${activeStep === 'closing' ? 'is-highlighted' : ''}`}>
                  <p>{letter.closing || 'Yours faithfully,'}</p>
                  <div className="signature-block">
                    <p>{letter.senderName || '(Signature)'}</p>
                    {letter.senderDesignation && <p>{letter.senderDesignation}</p>}
                    {letter.senderOrganisation && <p>{letter.senderOrganisation}</p>}
                  </div>
                </section>
              )}

              {isLast && enclosureList.length > 0 && (
                <section className={`preview-section enclosure-section ${activeStep === 'extras' ? 'is-highlighted' : ''}`}>
                  <p className="section-label">Enclosures:</p>
                  <ul>
                    {enclosureList.map((entry, index) => (
                      <li key={index}>{entry}</li>
                    ))}
                  </ul>
                </section>
              )}

              {isLast && ccList.length > 0 && (
                <section className={`preview-section copies-section ${activeStep === 'extras' ? 'is-highlighted' : ''}`}>
                  <p className="section-label">Copy to:</p>
                  <ul>
                    {ccList.map((entry, index) => (
                      <li key={index}>{entry}</li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
            <footer className="page-footer">Page {pageIndex + 1}</footer>
          </article>
        )
      })}
    </div>
  )
})

LetterPreview.displayName = 'LetterPreview'

export default App
