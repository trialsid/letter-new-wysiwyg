import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
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
        <LetterPreview ref={previewRef} letter={letter} />
      </main>
    </div>
  )
}

interface PreviewProps {
  letter: LetterData
}

interface DisplayLine {
  text: string
  isPlaceholder: boolean
}

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

const splitList = (value: string) =>
  value
    .split(/\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean)

type DebouncedFn<T extends (...args: unknown[]) => void> = ((...args: Parameters<T>) => void) & {
  cancel: () => void
}

const AddressBlock: React.FC<{ lines: Array<DisplayLine | null> }> = ({ lines }) => (
  <>
    {lines
      .filter((line): line is DisplayLine => Boolean(line))
      .map((line, index) => (
        <p key={index} className={line.isPlaceholder ? 'placeholder-text' : undefined}>
          {line.text}
        </p>
      ))}
  </>
)

const LetterPreview = forwardRef<HTMLDivElement, PreviewProps>(({ letter }, ref) => {
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageDimensions, setPageDimensions] = useState({ width: 0, height: 0, gap: 24 })
  const [fontSize, setFontSize] = useState(12)

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const contentMeasureRef = useRef<HTMLDivElement>(null)

  const debounce = <T extends (...args: unknown[]) => void>(
    func: T,
    delay: number,
  ): DebouncedFn<T> => {
    let timeoutId: ReturnType<typeof setTimeout>
    const debounced = (...args: Parameters<T>) => {
      clearTimeout(timeoutId)
      timeoutId = window.setTimeout(() => {
        func(...args)
      }, delay)
    }

    debounced.cancel = () => {
      clearTimeout(timeoutId)
    }

    return debounced
  }

  const fallbackDate = formatIndianDate(todayIsoDate)
  const formattedDate = formatIndianDate(letter.letterDate) || fallbackDate
  const isDatePlaceholder = !letter.letterDate

  const senderAddressLines = [
    makeLine(letter.senderOrganisation, defaultPreviewContent.sender.organisation),
    makeLine(letter.senderAddressLine1, defaultPreviewContent.sender.addressLine1),
    makeLine(letter.senderAddressLine2, defaultPreviewContent.sender.addressLine2),
    makeLine(
      [letter.senderCity, letter.senderState].filter(Boolean).join(', '),
      `${defaultPreviewContent.sender.city}, ${defaultPreviewContent.sender.state}`,
    ),
    makeLine(
      [letter.senderPostalCode].filter(Boolean).length
        ? `PIN: ${letter.senderPostalCode}`
        : '',
      `PIN: ${defaultPreviewContent.sender.pin}`,
    ),
  ]

  const senderContactLines = [
    makeLine(
      letter.senderPhone ? `Phone: ${letter.senderPhone}` : '',
      defaultPreviewContent.sender.phone ? `Phone: ${defaultPreviewContent.sender.phone}` : '',
    ),
    makeLine(
      letter.senderEmail ? `Email: ${letter.senderEmail}` : '',
      defaultPreviewContent.sender.email ? `Email: ${defaultPreviewContent.sender.email}` : '',
    ),
  ]

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
    makeLine(
      [letter.recipientAddressLine1, letter.recipientAddressLine2]
        .filter(Boolean)
        .join(', '),
      [
        defaultPreviewContent.recipient.addressLine1,
        defaultPreviewContent.recipient.addressLine2,
      ]
        .filter(Boolean)
        .join(', '),
    ),
    makeLine(
      [letter.recipientCity, letter.recipientState, letter.recipientPostalCode]
        .filter(Boolean)
        .join(', '),
      [
        defaultPreviewContent.recipient.city,
        defaultPreviewContent.recipient.state,
        defaultPreviewContent.recipient.pin,
      ]
        .filter(Boolean)
        .join(', '),
    ),
    makeLine(letter.recipientCountry, defaultPreviewContent.recipient.country),
  ]

  const subjectLine = makeLine(letter.subject, defaultPreviewContent.subject)
  const referenceLine = makeLine(letter.reference, defaultPreviewContent.reference)
  const salutationLine = makeLine(letter.salutation, defaultPreviewContent.salutation)
  const gratitudeLine = makeLine(letter.gratitude, defaultPreviewContent.gratitude)
  const closingLine = makeLine(letter.closing, defaultPreviewContent.closing)

  const signatureLines = [
    makeLine(letter.senderName, defaultPreviewContent.senderName),
    makeLine(letter.senderDesignation, defaultPreviewContent.senderDesignation),
    makeLine(letter.senderOrganisation, defaultPreviewContent.senderOrganisation),
  ]

  const bodyContent = letter.body.trim()
    ? letter.body
    : defaultPreviewContent.body.join('\n\n')
  const isBodyPlaceholder = !letter.body.trim()

  const enclosureEntries = splitList(letter.enclosures)
  const enclosureList =
    enclosureEntries.length > 0 ? enclosureEntries : defaultPreviewContent.enclosures
  const isEnclosurePlaceholder = enclosureEntries.length === 0

  const copyEntries = splitList(letter.copies)
  const copyList = copyEntries.length > 0 ? copyEntries : defaultPreviewContent.copies
  const isCopyPlaceholder = copyEntries.length === 0

  const letterContent = (
    <div className="letter-document">
      <div className="letter-header">
        <div className="letter-header-group">
          <div className="letter-address">
            <p className="letter-label">From</p>
            <AddressBlock lines={senderAddressLines} />
            <AddressBlock lines={senderContactLines} />
          </div>
          <div className="letter-address">
            <p className="letter-label">To</p>
            <AddressBlock lines={recipientAddressLines} />
          </div>
        </div>
        <div className="letter-meta">
          <p className={`letter-date${isDatePlaceholder ? ' placeholder-text' : ''}`}>
            Date: {formattedDate}
          </p>
        </div>
      </div>

      {subjectLine && (
        <div className="letter-subject">
          <span className="letter-label">Subject</span>
          <p className={subjectLine.isPlaceholder ? 'placeholder-text' : undefined}>
            {subjectLine.text}
          </p>
        </div>
      )}

      {referenceLine && (
        <div className="letter-reference">
          <span className="letter-label">Ref</span>
          <p className={referenceLine.isPlaceholder ? 'placeholder-text' : undefined}>
            {referenceLine.text}
          </p>
        </div>
      )}

      {salutationLine && (
        <p className={`letter-salutation${salutationLine.isPlaceholder ? ' placeholder-text' : ''}`}>
          {salutationLine.text}
        </p>
      )}

      <div className={`letter-body${isBodyPlaceholder ? ' placeholder-text' : ''}`}>
        {bodyContent}
      </div>

      {gratitudeLine && (
        <p className={`letter-gratitude${gratitudeLine.isPlaceholder ? ' placeholder-text' : ''}`}>
          {gratitudeLine.text}
        </p>
      )}

      {closingLine && (
        <p className={`letter-closing${closingLine.isPlaceholder ? ' placeholder-text' : ''}`}>
          {closingLine.text}
        </p>
      )}

      <div className="letter-signature">
        <AddressBlock lines={signatureLines} />
        <AddressBlock lines={senderContactLines} />
      </div>

      {enclosureList.length > 0 && (
        <div className="letter-meta-section">
          <p className="letter-label">Enclosures</p>
          <ul>
            {enclosureList.map((item, index) => (
              <li
                key={index}
                className={isEnclosurePlaceholder ? 'placeholder-text' : undefined}
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {copyList.length > 0 && (
        <div className="letter-meta-section">
          <p className="letter-label">Copy to</p>
          <ul>
            {copyList.map((item, index) => (
              <li key={index} className={isCopyPlaceholder ? 'placeholder-text' : undefined}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )

  useLayoutEffect(() => {
    const calculatePageDimensions = () => {
      if (!scrollContainerRef.current) {
        return
      }

      const containerWidth = scrollContainerRef.current.clientWidth
      const pageWidth = containerWidth - 64

      if (pageWidth <= 0) {
        return
      }

      const pageHeight = pageWidth / (210 / 297)
      const newFontSize = Math.max(10, pageHeight * 0.013)

      setPageDimensions({ width: pageWidth, height: pageHeight, gap: 24 })
      setFontSize(newFontSize)
    }

    const debouncedLayoutUpdate = debounce(calculatePageDimensions, 100)
    calculatePageDimensions()
    window.addEventListener('resize', debouncedLayoutUpdate)

    return () => {
      window.removeEventListener('resize', debouncedLayoutUpdate)
      debouncedLayoutUpdate.cancel()
    }
  }, [])

  useLayoutEffect(() => {
    if (!contentMeasureRef.current || !pageDimensions.height) {
      return
    }

    const contentHeight = contentMeasureRef.current.scrollHeight
    const pageHeight = pageDimensions.height
    const newTotalPages = Math.max(1, Math.ceil(contentHeight / pageHeight))

    if (newTotalPages !== totalPages) {
      setTotalPages(newTotalPages)
      setCurrentPage((current) => Math.min(current, newTotalPages - 1))
    }
  }, [letter, pageDimensions.height, totalPages])

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || pageDimensions.height === 0) {
      return
    }

    const { scrollTop } = scrollContainerRef.current
    const pageWithGap = pageDimensions.height + pageDimensions.gap
    const current = Math.floor((scrollTop + pageWithGap / 2) / pageWithGap)
    setCurrentPage(current)
  }, [pageDimensions])

  const debouncedScrollHandler = useMemo(() => debounce(handleScroll, 50), [handleScroll])

  useEffect(() => {
    return () => {
      debouncedScrollHandler.cancel()
    }
  }, [debouncedScrollHandler])

  const scrollToPage = (pageIndex: number) => {
    if (!scrollContainerRef.current || pageDimensions.height === 0) {
      return
    }

    const targetScrollTop = pageIndex * (pageDimensions.height + pageDimensions.gap)
    scrollContainerRef.current.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth',
    })
    setCurrentPage(pageIndex)
  }

  return (
    <div className="preview-wrapper" ref={ref} aria-live="polite">
      <div
        className="preview-measure"
        style={{ width: pageDimensions.width, fontSize: `${fontSize}px` }}
      >
        <div ref={contentMeasureRef}>{letterContent}</div>
      </div>

      <div
        ref={scrollContainerRef}
        onScroll={debouncedScrollHandler}
        className="preview-scroll"
        role="article"
      >
        {pageDimensions.height > 0 &&
          Array.from({ length: totalPages }).map((_, pageIndex) => (
            <div
              key={`page-${pageIndex}`}
              className="preview-page"
              style={{
                width: pageDimensions.width,
                height: pageDimensions.height,
                fontSize: `${fontSize}px`,
              }}
            >
              <div
                className="letter-page-surface"
                style={{ transform: `translateY(-${pageIndex * pageDimensions.height}px)` }}
              >
                {letterContent}
              </div>
            </div>
          ))}
      </div>

      <div className="preview-pagination">
        <button
          type="button"
          onClick={() => scrollToPage(currentPage - 1)}
          disabled={currentPage === 0}
        >
          Previous
        </button>
        <span>
          Page {currentPage + 1} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => scrollToPage(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
        >
          Next
        </button>
      </div>
    </div>
  )
})

LetterPreview.displayName = 'LetterPreview'

export default App
