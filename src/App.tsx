import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import type { LetterData, StepId } from './types'

interface StepConfig {
  id: StepId
  title: string
  description: string
}

const steps: StepConfig[] = [
  {
    id: 'recipient',
    title: 'Recipient details',
    description: 'Who is receiving this letter?',
  },
  {
    id: 'subject',
    title: 'Subject & reference',
    description: 'Summarise the purpose of the letter.',
  },
  {
    id: 'salutation',
    title: 'Salutation',
    description: 'Set the greeting tone.',
  },
  {
    id: 'body',
    title: 'Letter body',
    description: 'Compose the main message.',
  },
  {
    id: 'closing',
    title: 'Closing & signature',
    description: 'Add a warm sign off.',
  },
  {
    id: 'copies',
    title: 'Copy to',
    description: 'List any recipients to copy.',
  },
]

const emptyLetter: LetterData = {
  recipientName: '',
  recipientTitle: '',
  recipientCompany: '',
  recipientAddress: '',
  recipientCity: '',
  recipientState: '',
  recipientPostalCode: '',
  recipientCountry: '',
  subject: '',
  reference: '',
  salutation: 'Dear',
  body: '',
  closing: 'Yours truly,',
  senderName: '',
  senderTitle: '',
  copies: '',
}

function App() {
  const [letter, setLetter] = useState<LetterData>(emptyLetter)
  const [activeStep, setActiveStep] = useState<number>(0)

  const canGoBack = activeStep > 0
  const canGoForward = activeStep < steps.length - 1

  const activeStepId = useMemo(() => steps[activeStep]?.id ?? 'recipient', [activeStep])

  const updateField = (field: keyof LetterData, value: string) => {
    setLetter((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (canGoForward) {
      setActiveStep((prev) => Math.min(prev + 1, steps.length - 1))
    }
  }

  const resetLetter = () => {
    setLetter(emptyLetter)
    setActiveStep(0)
  }

  return (
    <div className="app-shell">
      <aside className="form-pane">
        <header className="form-header">
          <div>
            <p className="eyebrow">Letter composer</p>
            <h1>Draft a polished letter</h1>
            <p className="subtitle">
              Work through each step on the left and watch the letter update in real-time on the
              right.
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
              className={`step-item ${index === activeStep ? 'is-active' : ''}`}
              onClick={() => setActiveStep(index)}
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
          {activeStepId === 'recipient' && (
            <div className="field-grid">
              <label>
                Recipient name
                <input
                  type="text"
                  value={letter.recipientName}
                  onChange={(event) => updateField('recipientName', event.target.value)}
                  placeholder="e.g. Dr. Elaine Rivers"
                />
              </label>
              <label>
                Recipient title
                <input
                  type="text"
                  value={letter.recipientTitle}
                  onChange={(event) => updateField('recipientTitle', event.target.value)}
                  placeholder="e.g. Director of Research"
                />
              </label>
              <label>
                Company or organisation
                <input
                  type="text"
                  value={letter.recipientCompany}
                  onChange={(event) => updateField('recipientCompany', event.target.value)}
                  placeholder="e.g. Riverstone Labs"
                />
              </label>
              <label>
                Street address
                <input
                  type="text"
                  value={letter.recipientAddress}
                  onChange={(event) => updateField('recipientAddress', event.target.value)}
                  placeholder="1234 Market Street"
                />
              </label>
              <label>
                City
                <input
                  type="text"
                  value={letter.recipientCity}
                  onChange={(event) => updateField('recipientCity', event.target.value)}
                  placeholder="San Francisco"
                />
              </label>
              <label>
                State / Province
                <input
                  type="text"
                  value={letter.recipientState}
                  onChange={(event) => updateField('recipientState', event.target.value)}
                  placeholder="CA"
                />
              </label>
              <label>
                Postal code
                <input
                  type="text"
                  value={letter.recipientPostalCode}
                  onChange={(event) => updateField('recipientPostalCode', event.target.value)}
                  placeholder="94016"
                />
              </label>
              <label>
                Country
                <input
                  type="text"
                  value={letter.recipientCountry}
                  onChange={(event) => updateField('recipientCountry', event.target.value)}
                  placeholder="United States"
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
                  placeholder="Regarding the Q2 partnership update"
                />
              </label>
              <label>
                Reference number (optional)
                <input
                  type="text"
                  value={letter.reference}
                  onChange={(event) => updateField('reference', event.target.value)}
                  placeholder="Ref: RS-2049"
                />
              </label>
            </div>
          )}

          {activeStepId === 'salutation' && (
            <div className="field-grid">
              <label>
                Salutation
                <input
                  type="text"
                  value={letter.salutation}
                  onChange={(event) => updateField('salutation', event.target.value)}
                  placeholder="Dear Dr. Rivers"
                />
              </label>
            </div>
          )}

          {activeStepId === 'body' && (
            <div className="field-grid">
              <label className="textarea-field">
                Letter body
                <textarea
                  rows={10}
                  value={letter.body}
                  onChange={(event) => updateField('body', event.target.value)}
                  placeholder={
                    'Share the context, key information, and clear requests. Separate paragraphs with blank lines.'
                  }
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
                  placeholder="Yours sincerely,"
                />
              </label>
              <label>
                Sender name
                <input
                  type="text"
                  value={letter.senderName}
                  onChange={(event) => updateField('senderName', event.target.value)}
                  placeholder="Avery Quinn"
                />
              </label>
              <label>
                Sender title
                <input
                  type="text"
                  value={letter.senderTitle}
                  onChange={(event) => updateField('senderTitle', event.target.value)}
                  placeholder="Partnerships Lead"
                />
              </label>
            </div>
          )}

          {activeStepId === 'copies' && (
            <div className="field-grid">
              <label className="textarea-field">
                Copy to (one per line)
                <textarea
                  rows={5}
                  value={letter.copies}
                  onChange={(event) => updateField('copies', event.target.value)}
                  placeholder={'Add names or email addresses, each on a new line.'}
                />
              </label>
            </div>
          )}

          <div className="step-controls">
            <button
              type="button"
              className="secondary"
              onClick={() => setActiveStep((prev) => Math.max(prev - 1, 0))}
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
        <LetterPreview letter={letter} activeStep={activeStepId} />
      </main>
    </div>
  )
}

interface PreviewProps {
  letter: LetterData
  activeStep: StepId
}

const PAGE_CHAR_LIMIT = 1200

function LetterPreview({ letter, activeStep }: PreviewProps) {
  const paragraphs = useMemo(() => {
    return letter.body
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
  }, [letter.body])

  const paginatedBody = useMemo(() => {
    if (paragraphs.length === 0) {
      return [[""]]
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

  const ccList = useMemo(
    () =>
      letter.copies
        .split(/\n|,/) // allow comma or newline separation
        .map((entry) => entry.trim())
        .filter(Boolean),
    [letter.copies],
  )

  return (
    <div className="preview-scroll" aria-live="polite">
      {paginatedBody.map((pageParagraphs, pageIndex) => {
        const isFirst = pageIndex === 0
        const isLast = pageIndex === paginatedBody.length - 1

        return (
          <article key={pageIndex} className="preview-page">
            <div className="page-inner">
              {isFirst && (
                <section className={`preview-section ${activeStep === 'recipient' ? 'is-highlighted' : ''}`}>
                  <address>
                    {[letter.recipientName, letter.recipientTitle]
                      .filter(Boolean)
                      .join(', ') || 'Recipient name'}
                    <br />
                    {letter.recipientCompany || 'Company or organisation'}
                    <br />
                    {letter.recipientAddress || 'Street address'}
                    <br />
                    {[letter.recipientCity, letter.recipientState]
                      .filter(Boolean)
                      .join(', ') || 'City, State'}{' '}
                    {letter.recipientPostalCode}
                    <br />
                    {letter.recipientCountry || 'Country'}
                  </address>
                </section>
              )}

              {isFirst && (
                <section className={`preview-section ${activeStep === 'subject' ? 'is-highlighted' : ''}`}>
                  <p className="subject-line">
                    <span>Subject:</span> {letter.subject || 'Write a concise subject line'}
                  </p>
                  {letter.reference && (
                    <p className="reference-line">
                      <span>Ref:</span> {letter.reference}
                    </p>
                  )}
                </section>
              )}

              {isFirst && (
                <section className={`preview-section ${activeStep === 'salutation' ? 'is-highlighted' : ''}`}>
                  <p>{letter.salutation ? `${letter.salutation.trim()} ` : 'Dear '} {letter.recipientName || 'Recipient'},</p>
                </section>
              )}

              <section className={`preview-section body-section ${activeStep === 'body' ? 'is-highlighted' : ''}`}>
                {pageParagraphs.filter(Boolean).length === 0 ? (
                  <p className="placeholder">Start typing your message to see it here.</p>
                ) : (
                  pageParagraphs.map((paragraph, paragraphIndex) => (
                    <p key={paragraphIndex}>{paragraph}</p>
                  ))
                )}
              </section>

              {isLast && (
                <section className={`preview-section closing-section ${activeStep === 'closing' ? 'is-highlighted' : ''}`}>
                  <p>{letter.closing || 'Kind regards,'}</p>
                  <p className="sender">
                    {letter.senderName || 'Your name'}
                    {letter.senderTitle ? <span>{letter.senderTitle}</span> : null}
                  </p>
                </section>
              )}

              {isLast && ccList.length > 0 && (
                <section className={`preview-section copies-section ${activeStep === 'copies' ? 'is-highlighted' : ''}`}>
                  <p className="copies-label">Copy to</p>
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
}

export default App
