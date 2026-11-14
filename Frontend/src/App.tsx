import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight, BadgeCheck, Bike, BookOpen, CarFront,
  Check, CheckCircle2, ChevronDown, CircleHelp, ClipboardCheck,
  FileCheck2, FileText, Gauge, IndianRupee, LayoutDashboard, Menu,
  Plus, ShieldCheck, Sparkles, Wallet, X,
} from 'lucide-react'

type Section = 'Overview' | 'Cost & quotation' | 'PDI inspection' | 'Documents' | 'Purchase report'
type CheckState = 'Not checked' | 'Pass' | 'Issue found' | 'Not applicable'

const STORAGE_KEY = 'vahanguide.purchase.v1'
const API_URL = '/api/purchases'

type PurchasePayload = {
  vehicleType: 'Car' | 'Bike'
  vehicleName: string
  variant: string
  city: string
  stage: string
  exShowroom: number
  registration: number
  insurance: number
  accessories: number
  other: number
  checks: Record<string, CheckState>
  documents: Record<string, boolean>
  issueNotes: Record<string, string>
  quotationItems: QuotationItem[]
}

type PurchaseRecord = PurchasePayload & { id: string; createdAt?: string; updatedAt?: string }

type SaveStatus = 'connecting' | 'saving' | 'saved' | 'local' | 'error'
type QuoteClassification = 'Required / standard' | 'Optional' | 'Needs verification'
type QuotationItem = { id: string; description: string; amount: number; classification: QuoteClassification; note: string }


const carChecks = [
  { id: 1, group: 'Exterior', title: 'Inspect paint and body panels', hint: 'Look for scratches, dents, uneven paint or panel gaps.' },
  { id: 2, group: 'Exterior', title: 'Check glass, lights and mirrors', hint: 'Check for cracks, chips and working lights.' },
  { id: 3, group: 'Tyres & wheels', title: 'Inspect tyres and wheels', hint: 'Check tyre condition, visible damage and wheel alignment.' },
  { id: 4, group: 'Identification', title: 'Match VIN and chassis number', hint: 'Compare the vehicle identification number with the paperwork.' },
  { id: 5, group: 'Interior', title: 'Test seats, seatbelts and controls', hint: 'Check seat adjustment, seatbelts, windows and switches.' },
  { id: 6, group: 'Interior', title: 'Test AC and infotainment', hint: 'Check cooling, display, audio and accessible controls.' },
  { id: 7, group: 'Engine & fluids', title: 'Check for visible leaks', hint: 'Look for unusual fluid leaks. Ask a technician about concerns.' },
  { id: 8, group: 'Engine & fluids', title: 'Review warning lights', hint: 'With dealer assistance, check the dashboard for persistent warnings.' },
  { id: 9, group: 'Documents', title: 'Match invoice and vehicle details', hint: 'Verify model, variant, colour and buyer details.' },
  { id: 10, group: 'Documents', title: 'Confirm promised accessories', hint: 'Check the accessories and items listed in your agreement.' },
]

const bikeChecks = [
  { id: 101, group: 'Exterior', title: 'Inspect paint and body panels', hint: 'Look for scratches, dents and loose or damaged panels.' },
  { id: 102, group: 'Tyres & wheels', title: 'Inspect tyres and wheels', hint: 'Check visible tyre damage, tread and wheel condition.' },
  { id: 103, group: 'Identification', title: 'Match chassis and engine numbers', hint: 'Compare the vehicle identifiers with the paperwork.' },
  { id: 104, group: 'Controls', title: 'Check brakes and levers', hint: 'Check lever operation and visible brake condition. Ask for help if unsure.' },
  { id: 105, group: 'Controls', title: 'Check handlebar and switches', hint: 'Check steering movement and accessible switches.' },
  { id: 106, group: 'Lights & electrical', title: 'Test headlamp, indicators and horn', hint: 'Confirm that accessible electrical features work.' },
  { id: 107, group: 'Mechanical', title: 'Inspect chain and visible components', hint: 'For chain-driven bikes, look for obvious damage or abnormal slack.' },
  { id: 108, group: 'Mechanical', title: 'Check for visible fluid leaks', hint: 'Look for leaks or unusual visible damage; ask a technician about concerns.' },
  { id: 109, group: 'Mechanical', title: 'Review dashboard warning lights', hint: 'With dealer assistance, check for persistent warning indicators.' },
  { id: 110, group: 'Documents', title: 'Match invoice and promised items', hint: 'Check model, variant, identifiers, keys and promised accessories.' },
]


const navItems: { label: Section; icon: typeof LayoutDashboard }[] = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Cost & quotation', icon: IndianRupee },
  { label: 'PDI inspection', icon: ClipboardCheck },
  { label: 'Documents', icon: FileText },
  { label: 'Purchase report', icon: FileCheck2 },
]

function money(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
}

export default function App() {
  const [section, setSection] = useState<Section>('Overview')
  const [vehicleType, setVehicleType] = useState<'Car' | 'Bike'>('Car')
  const [showSetup, setShowSetup] = useState(false)
  const [vehicleName, setVehicleName] = useState('Hyundai Creta')
  const [variant, setVariant] = useState('SX Tech')
  const [stage, setStage] = useState('Vehicle allocated')
  const [city, setCity] = useState('Hyderabad, Telangana')
  const [exShowroom, setExShowroom] = useState(1420000)
  const [registration, setRegistration] = useState(155000)
  const [insurance, setInsurance] = useState(42000)
  const [accessories, setAccessories] = useState(18000)
  const [other, setOther] = useState(5000)
  const [checks, setChecks] = useState<Record<number, CheckState>>({})
  const [docs, setDocs] = useState<Record<string, boolean>>({ Invoice: true, Insurance: true })
  const [mobileNav, setMobileNav] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [apiReady, setApiReady] = useState(false)
  const [purchaseId, setPurchaseId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('connecting')
  const [issueNotes, setIssueNotes] = useState<Record<number, string>>({})
  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([])

  function payloadFromState(): PurchasePayload {
    return {
      vehicleType, vehicleName, variant, stage, city,
      exShowroom, registration, insurance, accessories, other,
      checks: Object.fromEntries(Object.entries(checks).map(([key, value]) => [key, value])),
      documents: docs,
      issueNotes: Object.fromEntries(Object.entries(issueNotes).map(([key, value]) => [key, value])),
      quotationItems,
    }
  }

  function applyPurchase(data: Partial<PurchaseRecord>) {
    if (data.vehicleType === 'Car' || data.vehicleType === 'Bike') setVehicleType(data.vehicleType)
    if (typeof data.vehicleName === 'string') setVehicleName(data.vehicleName)
    if (typeof data.variant === 'string') setVariant(data.variant)
    if (typeof data.stage === 'string') setStage(data.stage)
    if (typeof data.city === 'string') setCity(data.city)
    if (typeof data.exShowroom === 'number') setExShowroom(data.exShowroom)
    if (typeof data.registration === 'number') setRegistration(data.registration)
    if (typeof data.insurance === 'number') setInsurance(data.insurance)
    if (typeof data.accessories === 'number') setAccessories(data.accessories)
    if (typeof data.other === 'number') setOther(data.other)
    if (data.checks && typeof data.checks === 'object') setChecks(Object.fromEntries(Object.entries(data.checks).map(([key, value]) => [Number(key), value as CheckState])))
    if (data.documents && typeof data.documents === 'object') setDocs(data.documents)
    if (data.issueNotes && typeof data.issueNotes === 'object') setIssueNotes(Object.fromEntries(Object.entries(data.issueNotes).map(([key, value]) => [Number(key), String(value)])))
    if (Array.isArray(data.quotationItems)) setQuotationItems(data.quotationItems.map((item, index) => ({
      id: String(item.id || `quote-${index + 1}`),
      description: String(item.description || ''),
      amount: Math.max(0, Number(item.amount || 0)),
      classification: (['Required / standard', 'Optional', 'Needs verification'].includes(item.classification) ? item.classification : 'Needs verification') as QuoteClassification,
      note: String(item.note || ''),
    })))
  }

  function readLegacyWorkspace(): Partial<PurchasePayload> | null {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      const data = JSON.parse(raw) as Record<string, unknown>
      return {
        vehicleType: data.vehicleType === 'Bike' ? 'Bike' : 'Car',
        vehicleName: typeof data.vehicleName === 'string' ? data.vehicleName : 'Hyundai Creta',
        variant: typeof data.variant === 'string' ? data.variant : 'SX Tech',
        city: typeof data.city === 'string' ? data.city : 'Hyderabad, Telangana',
        stage: typeof data.stage === 'string' ? data.stage : 'Vehicle allocated',
        exShowroom: Number(data.exShowroom ?? 1420000), registration: Number(data.registration ?? 155000),
        insurance: Number(data.insurance ?? 42000), accessories: Number(data.accessories ?? 18000), other: Number(data.other ?? 5000),
        checks: (data.checks && typeof data.checks === 'object' ? data.checks : {}) as Record<string, CheckState>,
        documents: (data.docs && typeof data.docs === 'object' ? data.docs : { Invoice: true, Insurance: true }) as Record<string, boolean>,
        issueNotes: (data.issueNotes && typeof data.issueNotes === 'object' ? data.issueNotes : {}) as Record<string, string>,
        quotationItems: Array.isArray(data.quotationItems) ? data.quotationItems as QuotationItem[] : [],
      }
    } catch {
      return null
    }
  }

  // Load the most recently updated project from the API. If the database is empty,
  // migrate this browser's existing workspace (if any) into PostgreSQL.
  useEffect(() => {
    let cancelled = false
    async function initialise() {
      setSaveStatus('connecting')
      try {
        const response = await fetch(API_URL)
        if (!response.ok) throw new Error(`API returned ${response.status}`)
        const projects = await response.json() as PurchaseRecord[]
        if (cancelled) return
        if (projects.length > 0) {
          const latest = [...projects].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))[0]
          setPurchaseId(latest.id)
          applyPurchase(latest)
        } else {
          const legacy = readLegacyWorkspace()
          const initial: PurchasePayload = {
            vehicleType: legacy?.vehicleType ?? 'Car', vehicleName: legacy?.vehicleName ?? 'Hyundai Creta',
            variant: legacy?.variant ?? 'SX Tech', city: legacy?.city ?? 'Hyderabad, Telangana',
            stage: legacy?.stage ?? 'Vehicle allocated', exShowroom: legacy?.exShowroom ?? 1420000,
            registration: legacy?.registration ?? 155000, insurance: legacy?.insurance ?? 42000,
            accessories: legacy?.accessories ?? 18000, other: legacy?.other ?? 5000,
            checks: Object.fromEntries(Object.entries(legacy?.checks ?? {}).map(([k, v]) => [k, v])),
            documents: legacy?.documents ?? { Invoice: true, Insurance: true },
            issueNotes: Object.fromEntries(Object.entries(legacy?.issueNotes ?? {}).map(([k, v]) => [k, String(v)])),
            quotationItems: legacy?.quotationItems ?? [],
          }
          const createResponse = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(initial) })
          if (!createResponse.ok) throw new Error(`Could not create purchase project (${createResponse.status})`)
          const created = await createResponse.json() as PurchaseRecord
          if (cancelled) return
          setPurchaseId(created.id)
          applyPurchase(created)
        }
        setApiReady(true)
        setSaveStatus('saved')
      } catch (error) {
        if (cancelled) return
        console.error('VahanGuide API connection failed:', error)
        const legacy = readLegacyWorkspace()
        if (legacy) applyPurchase(legacy as Partial<PurchaseRecord>)
        setApiReady(false)
        setSaveStatus('local')
      } finally {
        if (!cancelled) setHydrated(true)
      }
    }
    initialise()
    return () => { cancelled = true }
  }, [])

  // Keep local recovery data, and debounce API writes so typing doesn't create a request per keystroke.
  useEffect(() => {
    if (!hydrated) return
    const localData = { ...payloadFromState(), docs, issueNotes, quotationItems }
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...localData, docs, issueNotes })) } catch { /* optional recovery cache */ }
    if (!apiReady || !purchaseId) return
    setSaveStatus('saving')
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(`${API_URL}/${purchaseId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payloadFromState()),
        })
        if (!response.ok) throw new Error(`Save failed (${response.status})`)
        setSaveStatus('saved')
      } catch (error) {
        console.error('VahanGuide save failed:', error)
        setSaveStatus('error')
      }
    }, 500)
    return () => window.clearTimeout(timeout)
  }, [hydrated, apiReady, purchaseId, vehicleType, vehicleName, variant, stage, city, exShowroom, registration, insurance, accessories, other, checks, docs, issueNotes, quotationItems])

  const total = exShowroom + registration + insurance + accessories + other

  const activeChecks = vehicleType === 'Bike' ? bikeChecks : carChecks
  const completedChecks = activeChecks.filter(
      item => checks[item.id] === 'Pass' ||
          checks[item.id] === 'Not applicable'
  ).length
  const checkedCount = activeChecks.filter(
      item => checks[item.id] &&
          checks[item.id] !== 'Not checked'
  ).length
  const checkedDocs = Object.values(docs).filter(Boolean).length
  const progress = Math.round(
      ((checkedCount / activeChecks.length) +
          (checkedDocs / 5)) / 2 * 100
  )
  const attentionCount = activeChecks.filter(
      item => checks[item.id] === 'Issue found'
  ).length
  const quotationTotal = quotationItems.reduce((sum, item) => sum + Math.max(0, Number(item.amount) || 0), 0)
  const optionalTotal = quotationItems.filter(item => item.classification === 'Optional').reduce((sum, item) => sum + item.amount, 0)
  const verificationTotal = quotationItems.filter(item => item.classification === 'Needs verification').reduce((sum, item) => sum + item.amount, 0)
  function updateQuotationItem(id: string, patch: Partial<QuotationItem>) {
    setQuotationItems(items => items.map(item => item.id === id ? { ...item, ...patch } : item))
  }
  function addQuotationItem() {
    setQuotationItems(items => [...items, { id: `quote-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, description: '', amount: 0, classification: 'Needs verification', note: '' }])
  }
  const moneyRows = useMemo(() => [
    { label: 'Ex-showroom price', value: exShowroom, set: setExShowroom },
    { label: 'Registration & RTO', value: registration, set: setRegistration },
    { label: 'Insurance', value: insurance, set: setInsurance },
    { label: 'Accessories', value: accessories, set: setAccessories },
    { label: 'Other charges', value: other, set: setOther },
  ], [exShowroom, registration, insurance, accessories, other])

  function changeCheck(id: number, value: CheckState) {
    setChecks(prev => ({ ...prev, [id]: value }))
  }

  function changeIssueNote(id: number, value: string) {
    setIssueNotes(prev => ({ ...prev, [id]: value }))
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><Gauge size={21} strokeWidth={2.5} /></div>
          <div><div className="brand-name">vahan<span>guide</span></div><div className="brand-caption">YOUR PURCHASE CO-PILOT</div></div>
          <button className="icon-button mobile-close" onClick={() => setMobileNav(false)} aria-label="Close menu"><X size={18}/></button>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="nav-list">
          {navItems.map(item => {
            const Icon = item.icon
            return <button key={item.label} className={`nav-item ${section === item.label ? 'active' : ''}`} onClick={() => { setSection(item.label); setMobileNav(false) }}>
              <Icon size={18} /><span>{item.label}</span>{item.label === 'PDI inspection' && attentionCount > 0 && <span className="nav-count">{attentionCount}</span>}
            </button>
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card"><div className="help-icon"><CircleHelp size={17}/></div><div><strong>First time buying?</strong><p>We’ll walk you through it.</p><button onClick={() => setSection('PDI inspection')}>Explore the guide <ArrowRight size={13}/></button></div></div>
          <div className="profile-row"><div className="avatar">S</div><div className="profile-copy"><strong>My workspace</strong><span>Personal purchase</span></div><ChevronDown size={16} className="muted-icon"/></div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="icon-button menu-trigger" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu size={20}/></button>
          <div className="breadcrumb">My purchase <span>/</span> <strong>{section}</strong></div>
          <div className="top-actions"><span className="save-state"><span className={`save-dot ${saveStatus === 'saved' ? 'saved' : ''}`}></span>{saveStatus === 'connecting' ? 'Connecting to API…' : saveStatus === 'saving' ? 'Saving changes…' : saveStatus === 'saved' ? 'Saved to PostgreSQL' : saveStatus === 'error' ? 'API save failed' : 'Local mode — API unavailable'}</span><button className="avatar top-avatar" aria-label="Profile">S</button></div>
        </header>

        {section === 'Overview' && <div className="page-content">
          <div className="welcome-row">
            <div><div className="eyebrow"><Sparkles size={14}/> YOUR NEXT VEHICLE, MADE SIMPLE</div><h1>Let’s get you <em>road-ready.</em></h1><p className="subtitle">A little clarity now can make your delivery day a whole lot easier.</p></div>
            <button className="button button-primary" onClick={() => setShowSetup(true)}><Plus size={17}/> Edit purchase <ArrowRight size={16}/></button>
          </div>

          <section className="vehicle-banner">
            <div className="vehicle-art"><div className="art-glow"></div>{vehicleType === 'Car' ? <CarFront size={104} strokeWidth={1.1}/> : <Bike size={104} strokeWidth={1.1}/>}<span className="art-tag"><span className="live-dot"></span> PURCHASE IN PROGRESS</span></div>
            <div className="vehicle-info"><div className="vehicle-type"><span>{vehicleType === 'Car' ? <CarFront size={14}/> : <Bike size={14}/>} {vehicleType}</span><span className="separator">•</span><span>{city}</span></div><h2>{vehicleName || 'Your vehicle'}</h2><p className="variant">{variant || 'Variant not added'}</p><div className="stage-row"><span className="stage-pill"><span className="stage-dot"></span>{stage}</span><span className="muted-small">Updated just now</span></div></div>
            <div className="banner-divider"></div>
            <div className="total-block"><span className="field-label">ESTIMATED ON-ROAD COST</span><div className="big-total">{money(total)}</div><button className="text-link light-link" onClick={() => setSection('Cost & quotation')}>View breakdown <ArrowRight size={14}/></button><div className="banner-mini-note"><ShieldCheck size={14}/> Your numbers, your decision.</div></div>
          </section>

          <div className="section-heading"><div><h2>Your purchase, at a glance</h2><p>Pick up where you left off.</p></div><span className="progress-caption">{progress}% journey tracked</span></div>
          <div className="progress-track"><div style={{width: `${progress}%`}}/></div>

          <div className="overview-grid">
            <div className="main-column">
              <section className="panel journey-panel">
                <div className="panel-heading"><div><h3>Purchase journey</h3><p>Small steps. More confident decisions.</p></div><span className="count-pill">{checkedCount + checkedDocs}/11 steps</span></div>
                <div className="journey-list">
                  {[
                    {n:'01', title:'Understand your total cost', desc:'Know where every rupee goes.', icon:Wallet, status:'Review your breakdown', section:'Cost & quotation' as Section, done:false},
                    {n:'02', title:'Review the quotation', desc:'Spot unclear charges before you pay.', icon:FileText, status:'Open quotation', section:'Cost & quotation' as Section, done:false},
                    {n:'03', title:'Inspect your vehicle', desc:'Follow a beginner-friendly PDI checklist.', icon:ClipboardCheck, status:checkedCount ? `${checkedCount} of ${activeChecks.length} checked` : 'Start inspection', section:'PDI inspection' as Section, done:completedChecks === activeChecks.length},
                    {n:'04', title:'Get your documents ready', desc:'Keep the important paperwork together.', icon:FileCheck2, status:`${checkedDocs} of 5 ready`, section:'Documents' as Section, done:checkedDocs === 5},
                  ].map((item) => { const Icon = item.icon; return <div className="journey-item" key={item.n}><div className={`journey-icon ${item.done ? 'done' : ''}`}>{item.done ? <Check size={18}/> : <Icon size={18}/>}</div><div className="journey-copy"><div className="journey-title">{item.title}{item.done && <CheckCircle2 size={14} className="green-icon"/>}</div><p>{item.desc}</p></div><button className="journey-action" onClick={() => setSection(item.section)}>{item.status}<ArrowRight size={14}/></button></div>})}
                </div>
              </section>

              <section className="panel cost-panel">
                <div className="panel-heading"><div><h3>Where your money goes</h3><p>Your current estimate, item by item.</p></div><button className="text-link" onClick={() => setSection('Cost & quotation')}>Edit costs <ArrowRight size={14}/></button></div>
                <div className="cost-visual"><div className="cost-bar"><span style={{width:`${exShowroom/total*100}%`}}></span><span style={{width:`${registration/total*100}%`}}></span><span style={{width:`${insurance/total*100}%`}}></span><span style={{width:`${accessories/total*100}%`}}></span><span style={{width:`${other/total*100}%`}}></span></div></div>
                <div className="cost-legend">{[{label:'Vehicle price', value:exShowroom, color:'swatch-dark'},{label:'Registration',value:registration,color:'swatch-sage'},{label:'Insurance',value:insurance,color:'swatch-gold'},{label:'Accessories & other',value:accessories+other,color:'swatch-gray'}].map(row=><div className="legend-row" key={row.label}><span className={`legend-swatch ${row.color}`}></span><span>{row.label}</span><strong>{money(row.value)}</strong></div>)}</div>
              </section>
            </div>

            <div className="side-column">
              <section className="panel focus-panel"><div className="focus-top"><div className="focus-icon"><ClipboardCheck size={19}/></div><span className="focus-label">YOUR NEXT BEST STEP</span></div><h3>Give your vehicle a proper once-over.</h3><p>Use the inspection checklist to record what you’ve checked and anything that needs attention before delivery.</p><div className="focus-metrics"><div><strong>{completedChecks}<span>/{activeChecks.length}</span></strong><small>Checks passed</small></div><div><strong>{attentionCount}</strong><small>Issues flagged</small></div></div><button className="button button-dark full-button" onClick={() => setSection('PDI inspection')}>Continue inspection <ArrowRight size={16}/></button><div className="focus-foot"><ShieldCheck size={14}/> Keep a record of what you find.</div></section>

              <section className="panel tip-panel"><div className="tip-heading"><div className="tip-icon"><BookOpen size={17}/></div><span>BUYER’S NOTEBOOK</span></div><h3>Never feel rushed at delivery.</h3><p>Ask for time to inspect the vehicle in daylight. If you find an issue, take a photo and ask the dealer to record it before you accept delivery.</p><button className="text-link" onClick={() => setSection('PDI inspection')}>See inspection tips <ArrowRight size={14}/></button></section>
              <div className="disclaimer"><ShieldCheck size={16}/><p><strong>Independent guidance.</strong> VahanGuide helps you organise your checks and questions. It does not replace professional inspection or official advice.</p></div>
            </div>
          </div>
        </div>}

        {section === 'Cost & quotation' && <div className="page-content narrow-page">
          <div className="page-title-row"><div><div className="eyebrow"><IndianRupee size={14}/> COST CLARITY</div><h1>Know where every <em>rupee goes.</em></h1><p className="subtitle">Record each line from your dealer quotation, classify it, and follow up on unclear charges.</p></div><span className="button button-secondary"><Check size={16}/> Auto-save enabled</span></div>
          <section className="panel cost-editor"><div className="panel-heading"><div><h3>On-road cost breakdown</h3><p>Update any amount to recalculate the total.</p></div><span className="count-pill">INR · ₹</span></div>
            {moneyRows.map(row=><label className="money-row" key={row.label}><span>{row.label}<small>{row.label==='Registration & RTO'?'Verify against applicable official charges.':row.label==='Accessories'?'Usually a separate decision from the vehicle price.':'Enter the amount shown in your quote.'}</small></span><div className="money-input"><span>₹</span><input type="number" min="0" value={row.value} onChange={e=>row.set(Math.max(0, Number(e.target.value)))} /></div></label>)}
            <div className="total-summary"><div><span>Estimated on-road total</span><small>Based on the figures you entered; not an official quote.</small></div><strong>{money(total)}</strong></div>
          </section>
          <section className="panel quotation-analyzer">
            <div className="panel-heading"><div><h3>Dealer quotation review</h3><p>Add line items exactly as they appear on the written quotation.</p></div><button className="button button-secondary" onClick={addQuotationItem}><Plus size={15}/> Add charge</button></div>
            <div className="classification-guide">
              <div><span className="class-dot standard"></span><strong>Required / standard</strong><small>Appears to be part of the expected purchase process; verify local applicability.</small></div>
              <div><span className="class-dot optional"></span><strong>Optional</strong><small>Ask whether you can decline it without affecting the vehicle purchase.</small></div>
              <div><span className="class-dot verify"></span><strong>Needs verification</strong><small>Ask for the basis, itemisation, and whether it is mandatory.</small></div>
            </div>
            {quotationItems.length === 0 ? <div className="quote-empty"><FileText size={25}/><strong>No quotation line items yet</strong><p>Add a charge from your dealer's written quotation to start reviewing it.</p><button className="button button-primary" onClick={addQuotationItem}><Plus size={15}/> Add first charge</button></div> : <div className="quote-items">{quotationItems.map((item, index) => <div className="quote-item" key={item.id}>
              <div className="quote-item-top"><span className="quote-index">CHARGE {String(index + 1).padStart(2, '0')}</span><button className="remove-charge" onClick={() => setQuotationItems(items => items.filter(row => row.id !== item.id))} aria-label={`Remove ${item.description || 'charge'}`}><X size={15}/> Remove</button></div>
              <div className="quote-fields">
                <label className="form-field">Charge / line item<input value={item.description} onChange={e => updateQuotationItem(item.id, { description: e.target.value })} placeholder="e.g. Extended warranty"/></label>
                <label className="form-field">Quoted amount (₹)<input type="number" min="0" value={item.amount} onChange={e => updateQuotationItem(item.id, { amount: Math.max(0, Number(e.target.value)) })}/></label>
                <label className="form-field">Review category<select value={item.classification} onChange={e => updateQuotationItem(item.id, { classification: e.target.value as QuoteClassification })}><option>Required / standard</option><option>Optional</option><option>Needs verification</option></select></label>
              </div>
              <label className="form-field quote-note-input">Question / dealer explanation<textarea value={item.note} onChange={e => updateQuotationItem(item.id, { note: e.target.value })} placeholder="What did the dealer say? What do you still need to confirm?" rows={2}/></label>
            </div>)}</div>}
            <div className="quote-summary-grid">
              <div><span>Quotation items</span><strong>{quotationItems.length}</strong></div>
              <div><span>Total entered</span><strong>{money(quotationTotal)}</strong></div>
              <div><span>Optional charges</span><strong>{money(optionalTotal)}</strong></div>
              <div><span>Needs verification</span><strong>{money(verificationTotal)}</strong></div>
            </div>
            {quotationItems.length > 0 && <div className="quote-review-result"><ShieldCheck size={18}/><div><strong>{verificationTotal > 0 ? 'Some charges need follow-up' : optionalTotal > 0 ? 'Review optional items before agreeing' : 'Keep supporting documents'}</strong><p>{verificationTotal > 0 ? `${money(verificationTotal)} is currently marked for verification. Ask for a written explanation and check the applicable rules before deciding.` : optionalTotal > 0 ? `${money(optionalTotal)} is marked optional. Confirm whether you want these items and request an updated written quote if you decline them.` : 'Keep the itemised quotation and receipts so the amounts can be compared with the final invoice.'} This is a tracking aid, not a legal determination of whether a charge is valid.</p></div></div>}
          </section>
          <section className="panel quote-note"><div className="note-symbol"><CircleHelp size={19}/></div><div><h3>What should you review?</h3><p>Compare the item names and amounts against the dealer's written quotation. For an unclear charge, ask what it covers, request itemisation, and confirm whether it is optional or legally required in your location. This tool does not label a charge unlawful based on its name alone.</p></div></section>
        </div>}


        {section === 'PDI inspection' && (
            <div className="page-content narrow-page">
              <div className="page-title-row">
                <div>
                  <div className="eyebrow">
                    <ClipboardCheck size={14} /> BEFORE YOU ACCEPT DELIVERY
                  </div>
                  <h1>
                    Inspect with <em>confidence.</em>
                  </h1>
                  <p className="subtitle">
                    A checklist tailored to your selected vehicle. Inspect each item
                    before marking its status.
                  </p>
                </div>

                <div className="pdi-score">
                  <strong>{checkedCount}/{activeChecks.length}</strong>
                  <span>reviewed</span>
                </div>
              </div>

              <div className="notice-banner">
                <ShieldCheck size={18} />
                <p>
                  <strong>
                    {vehicleType === 'Bike' ? 'Motorcycle inspection.' : 'Car inspection.'}
                  </strong>{' '}
                  This checklist provides general guidance, not a technical certification.
                  Ask a qualified technician to inspect anything you cannot safely verify.
                </p>
              </div>

              {Array.from(new Set(activeChecks.map(item => item.group))).map(group => {
                const groupItems = activeChecks.filter(item => item.group === group)
                const reviewed = groupItems.filter(
                    item => checks[item.id] && checks[item.id] !== 'Not checked'
                ).length

                return (
                    <section className="panel checklist-panel" key={group}>
                      <div className="checklist-group-title">
                        <h3>{group}</h3>
                        <span>{reviewed}/{groupItems.length} reviewed</span>
                      </div>

                      {groupItems.map(item => (
                          <div className="checklist-item" key={item.id}>
                            <div
                                className={`checklist-status ${
                                    checks[item.id] === 'Pass'
                                        ? 'pass'
                                        : checks[item.id] === 'Issue found'
                                            ? 'issue'
                                            : ''
                                }`}
                            >
                              {checks[item.id] === 'Pass' ? (
                                  <Check size={16} />
                              ) : checks[item.id] === 'Issue found' ? (
                                  <CircleHelp size={16} />
                              ) : (
                                  <ClipboardCheck size={16} />
                              )}
                            </div>

                            <div className="checklist-copy">
                              <strong>{item.title}</strong>
                              <p>{item.hint}</p>
                            </div>

                            <select
                                aria-label={`Status for ${item.title}`}
                                value={checks[item.id] || 'Not checked'}
                                onChange={e =>
                                    changeCheck(item.id, e.target.value as CheckState)
                                }
                            >
                              <option>Not checked</option>
                              <option>Pass</option>
                              <option>Issue found</option>
                              <option>Not applicable</option>
                            </select>

                            {checks[item.id] === 'Issue found' && (
                                <div className="issue-note-field">
                                  <label htmlFor={`issue-note-${item.id}`}>
                                    Issue details / dealer follow-up
                                  </label>
                                  <textarea
                                      id={`issue-note-${item.id}`}
                                      value={issueNotes[item.id] || ''}
                                      onChange={e => changeIssueNote(item.id, e.target.value)}
                                      placeholder="Describe the issue and the dealer's response..."
                                      rows={2}
                                  />
                                </div>
                            )}
                          </div>
                      ))}
                    </section>
                )
              })}

              {attentionCount > 0 && (
                  <div className="notice-banner issue-notice">
                    <CircleHelp size={18} />
                    <p>
                      <strong>
                        {attentionCount} item{attentionCount === 1 ? '' : 's'} flagged for review.
                      </strong>{' '}
                      Record the details and ask the dealer to document unresolved issues
                      before delivery.
                    </p>
                  </div>
              )}

              <div className="bottom-actions">
      <span>
        {completedChecks} checks passed or marked not applicable
      </span>
                <button
                    className="button button-primary"
                    onClick={() => setSection('Overview')}
                >
                  Finish inspection <ArrowRight size={16} />
                </button>
              </div>
            </div>
        )}

        {section === 'Documents' && <div className="page-content narrow-page">
          <div className="page-title-row"><div><div className="eyebrow"><FileText size={14}/> KEEP THE PAPERWORK TOGETHER</div><h1>Paperwork, <em>sorted.</em></h1><p className="subtitle">Mark a document ready only after you have checked the actual document.</p></div><div className="pdi-score"><strong>{checkedDocs}/5</strong><span>ready</span></div></div>
          <section className="panel docs-panel"><div className="panel-heading"><div><h3>Purchase document checklist</h3><p>Requirements can vary by state and purchase situation.</p></div><span className="count-pill">{checkedDocs} ready</span></div>{[
            ['Invoice','Check buyer name, vehicle variant and amount.'],
            ['Insurance','Verify policy details, coverage and effective date.'],
            ['Registration paperwork','Confirm the applicable registration process and receipt/status.'],
            ['Warranty & owner manual','Collect warranty details and vehicle documentation.'],
            ['Delivery items','Confirm keys, accessories and any promised items.'],
          ].map(([name,desc])=><label className="doc-row" key={name}><input type="checkbox" checked={!!docs[name]} onChange={e=>setDocs(prev=>({...prev,[name]:e.target.checked}))}/><span className="custom-check"><Check size={13}/></span><span className="doc-copy"><strong>{name}</strong><small>{desc}</small></span><span className={`doc-status ${docs[name]?'ready':''}`}>{docs[name]?'Ready':'Pending'}</span></label>)}</section>
          <section className="panel quote-note"><div className="note-symbol"><CircleHelp size={19}/></div><div><h3>Keep copies in one place</h3><p>Store copies securely and avoid sharing sensitive identification or policy details unnecessarily. This demo does not upload or store your documents.</p></div></section>
        </div>}

        {section === 'Purchase report' && <div className="page-content narrow-page">
          <div className="page-title-row"><div><div className="eyebrow"><FileCheck2 size={14}/> YOUR PURCHASE RECORD</div><h1>Your progress, <em>in one place.</em></h1><p className="subtitle">A preview of the summary VahanGuide will generate from your purchase details.</p></div><button className="button button-primary" onClick={()=>window.print()}><FileText size={16}/> Print report</button></div>
          <section className="panel report-card"><div className="report-brand"><div className="brand-mark"><Gauge size={19}/></div><span>VAHANGUIDE / PURCHASE SUMMARY</span><BadgeCheck size={19}/></div><h2>{vehicleName}</h2><p>{variant} · {vehicleType} · {city}</p><div className="report-total"><span>Current estimated total</span><strong>{money(total)}</strong></div><div className="report-grid">{moneyRows.map(r=><div key={r.label}><span>{r.label}</span><strong>{money(r.value)}</strong></div>)}</div><div className="report-section"><h3>Inspection status</h3><p>{checkedCount} of {activeChecks.length} items reviewed · {completedChecks} passed/not applicable · {attentionCount} flagged for review</p></div><div className="report-section"><h3>Documents</h3><p>{checkedDocs} of 5 items marked ready</p></div><div className="report-section"><h3>Dealer quotation review</h3><p>{quotationItems.length} line items recorded · Total {money(quotationTotal)} · Optional {money(optionalTotal)} · Needs verification {money(verificationTotal)}</p>{quotationItems.map(item => <p key={item.id}><strong>{item.description || 'Unnamed charge'} — {money(item.amount)} ({item.classification})</strong>{item.note ? `: ${item.note}` : ''}</p>)}</div>{attentionCount > 0 && <div className="report-section"><h3>Items flagged for review</h3>{activeChecks.filter(item=>checks[item.id]==='Issue found').map(item=><p key={item.id}><strong>{item.title}:</strong> {issueNotes[item.id]?.trim() || 'No details recorded yet.'}</p>)}</div>}<div className="report-foot">Generated from user-entered demo data. Amounts and statuses are not independently verified.</div></section>
        </div>}
      </main>

      {mobileNav && <button className="mobile-overlay" onClick={() => setMobileNav(false)} aria-label="Close navigation"/>}
      {showSetup && <div className="modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setShowSetup(false)}}><div className="setup-modal" role="dialog" aria-modal="true" aria-labelledby="setup-title"><div className="modal-header"><div><div className="eyebrow"><Sparkles size={14}/> YOUR PURCHASE DETAILS</div><h2 id="setup-title">Let’s set up your vehicle.</h2><p>Change the demo details to match your purchase.</p></div><button className="icon-button" onClick={()=>setShowSetup(false)} aria-label="Close"><X size={18}/></button></div><div className="type-selector"><button className={vehicleType==='Car'?'selected':''} onClick={()=>setVehicleType('Car')}><CarFront size={20}/> Car</button><button className={vehicleType==='Bike'?'selected':''} onClick={()=>setVehicleType('Bike')}><Bike size={20}/> Bike</button></div><label className="form-field">Brand & model<input value={vehicleName} onChange={e=>setVehicleName(e.target.value)} placeholder="e.g. Hyundai Creta"/></label><label className="form-field">Variant<input value={variant} onChange={e=>setVariant(e.target.value)} placeholder="e.g. SX Tech"/></label><label className="form-field">Purchase location<input value={city} onChange={e=>setCity(e.target.value)} placeholder="City, state"/></label><label className="form-field">Purchase stage<select value={stage} onChange={e=>setStage(e.target.value)}><option>Researching</option><option>Booked</option><option>Vehicle allocated</option><option>Delivery scheduled</option><option>Delivered</option></select></label><div className="modal-actions"><button className="button button-secondary" onClick={()=>setShowSetup(false)}>Cancel</button><button className="button button-primary" onClick={()=>{setShowSetup(false)}}><Check size={16}/> Save purchase</button></div></div></div>}
    </div>
  )
}
