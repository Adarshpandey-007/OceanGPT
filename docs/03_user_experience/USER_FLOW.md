# FloatChat / OceanGPT — User Flow & UX Design

> Last updated: 2026-05-06

---

## 1. Primary User Personas

### 🔬 Researcher
- Needs access to specific float data by WMO ID
- Wants temperature/salinity depth profiles
- Exports data as CSV for papers
- **Key flow**: Chat → Search by float ID → View profile → Export

### 🌊 Student / Curious Learner
- Explores ocean data by location ("near the Maldives")
- Asks broad questions ("Is the ocean getting warmer?")
- Needs plain-language explanations
- **Key flow**: Landing → Type question → See map + explanation

### 🏗️ Coastal Planner
- Evaluates environmental impact of coastal projects
- Needs legal compliance information
- Uploads project specifications
- **Key flow**: Planner → Define project → Get assessment → Check legal

### 👨‍💼 Admin / Operator
- Monitors platform health
- Checks API connectivity and data freshness
- **Key flow**: Admin dashboard → Review stats → Check env flags

---

## 2. User Journeys

### Journey 1: "Chat with the Ocean" (Core Flow)

```
Landing Page (/)
│
├─ User sees hero section with query input
├─ Types: "Show me temperature near the Maldives"
├─ Clicks "Explore" or presses Enter
│
▼
Explorer Page (/app)
│
├─ Chat Panel (left)
│   ├─ User message appears
│   ├─ Loading indicator: "Thinking..."
│   ├─ Tool badges appear: "🌊 Fetching Profiles" "📍 Spatial Search"
│   ├─ Assistant responds with scientific explanation
│   └─ Suggested follow-ups appear as chips
│
├─ Visualization Panel (right) — auto-switches based on intent
│   ├─ MAP tab: Leaflet map zooms to Maldives, float markers appear
│   ├─ PLOT tab: Plotly chart shows temp vs depth for nearest float
│   └─ TABLE tab: Tabular data with export button
│
├─ User asks follow-up: "Is that float still active?"
│   ├─ MCP calls check_float_health
│   └─ Response: "Float 2902169 was deployed on 2022-03-15,
│       battery at 82%, all sensors operational."
│
└─ User clicks "Export CSV" → downloads data
```

### Journey 2: Coastal Project Planning

```
Navigation → Planner (/planner)
│
├─ Project Wizard appears
│   ├─ Enter project name
│   ├─ Describe location (geocoded to coordinates)
│   ├─ Select project type (marina, desalination, etc.)
│   └─ Upload supporting documents
│
├─ Chat with Nature Advocate
│   ├─ AI assesses environmental impact
│   ├─ Suggests mitigation measures
│   └─ Provides sustainability score
│
└─ User navigates to Legal (/legal)
    ├─ Select jurisdiction
    ├─ Query: "What permits do I need for a marina in Kerala?"
    └─ AI returns relevant maritime laws & regulations
```

### Journey 3: Admin Operations

```
Navigation → Admin (/admin)
│
├─ Health Card: "ok" with timestamp
├─ Floats Discovered: 1151
├─ Profile Caches: 1152
├─ LLM Integration: "Enabled" (Gemini key detected)
│
├─ Environment Flags section
│   ├─ REAL_PROFILE_SOURCE: cache
│   ├─ GEMINI_API_KEY: [set]
│   ├─ ARGOVIS_API_KEY: [set]  ← NEW
│   └─ MCP_SERVER_URL: http://127.0.0.1:8000/sse  ← NEW
│
└─ Data Discovery: Sample float IDs displayed
```

---

## 3. UI Component Hierarchy

```
<RootLayout>                          layout.tsx
├── <NavigationHeader />              components/layout/
├── <main>
│   │
│   ├── [Landing Page]               app/page.tsx
│   │   ├── <Hero />
│   │   ├── <CapabilityStrip />
│   │   ├── <LiveStats />
│   │   ├── <RoadmapTimeline />
│   │   └── <CtaBand />
│   │
│   ├── [Explorer Page]              app/app/page.tsx
│   │   └── <ChatAppShell />
│   │       ├── <ChatPanel />             ← LEFT PANEL
│   │       │   ├── Message bubbles
│   │       │   ├── Tool badges
│   │       │   ├── Hint chips
│   │       │   └── Input + Send button
│   │       │
│   │       └── <VisualizationTabs />     ← RIGHT PANEL
│   │           ├── <MapPanel />      Leaflet map
│   │           ├── <PlotPanel />     Plotly charts
│   │           └── <TablePanel />    Data table + export
│   │
│   ├── [Admin Page]                 app/admin/page.tsx
│   │   ├── <AdminStatCard /> ×4
│   │   ├── Environment Flags grid
│   │   └── Data Discovery section
│   │
│   ├── [Planner Page]               app/planner/page.tsx
│   │   ├── <ProjectWizard />
│   │   ├── <PlannerChat />
│   │   └── <ImpactAssessment />
│   │
│   ├── [Legal Page]                 app/legal/page.tsx
│   │   └── <JurisdictionSelector />
│   │
│   └── [Dashboard Page]             app/dashboard/page.tsx
│       ├── <StatCards />
│       └── <RecentProjectsTable />
│
└── <OceanFooter />                  components/layout/
```

---

## 4. UX Design Principles

### 4.1 Ocean-First Aesthetics
- Dark deep-ocean background (`#0a1628` → `#0d2137`)
- Cyan accent for interactive elements (`#22d3ee`)
- Glassmorphism panels (`bg-white/5`, `backdrop-blur`)
- Ambient bubble animations (reduced-motion aware)
- Gradient text for headings

### 4.2 Conversational-First Interaction
- Chat is always the primary input method
- No complex forms; users express intent naturally
- Visualization auto-switches based on detected intent
- Suggested follow-up prompts reduce friction

### 4.3 Progressive Disclosure
- Landing page → simple query input
- Explorer → split panel (chat + viz)
- Admin → detailed technical dashboard
- Each level adds complexity for those who need it

### 4.4 Responsive Design Targets
- **Desktop** (1280px+): Side-by-side chat + visualization
- **Tablet** (768px–1279px): Stacked panels with tab switching
- **Mobile** (< 768px): Full-screen chat, viz accessible via tabs

---

## 5. Interaction Patterns

### 5.1 Chat Message Types

| Type | Visual | Example |
|------|--------|---------|
| User message | Cyan border, right-aligned | "Show me float 2900018" |
| Assistant message | Dark glass, left-aligned, markdown | Scientific explanation |
| Tool badge | Green pill, icon + label | 🌊 Fetching Profiles |
| Error message | Red text | "Error processing request" |
| Loading | Bouncing dots | ⚫⚫⚫ Thinking... |
| Hint chips | Ghost buttons below input | "Show depth profile" |

### 5.2 Visualization Auto-Switching

| Detected Intent | Active Tab | Behavior |
|-----------------|------------|----------|
| `map` | Map | Zoom to coordinates, show float markers |
| `plot` | Plot | Render temp/salinity vs depth chart |
| `table` | Table | Show tabular data with export |
| `chat` | None | Keep current tab, just show message |

### 5.3 Error Recovery

| Scenario | User sees | Recovery |
|----------|-----------|----------|
| MCP server offline | "Could not connect to backend" | Chat falls back to Gemini-only mode |
| Argovis API down | "Data source temporarily unavailable" | Suggest ERDDAP fallback |
| Rate limited | "Too many requests" | Show retry timer |
| No results | "No floats found in that area" | Suggest widening search |
