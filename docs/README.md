# 📚 FloatChat / OceanGPT — Documentation Index

> Navigate the project documentation by category.

---

## 📁 Folder Structure

```
docs/
├── README.md                        ← You are here
│
├── 01_architecture/                 🏗️ System Design
│   └── ARCHITECTURE.md              System diagram, tech stack, data flow, folder map
│
├── 02_project_management/           📋 Planning & Progress
│   ├── PROJECT_PLAN.md              Detailed task breakdown (10 phases, checkboxes)
│   ├── PROGRESS.md                  Living sprint tracker with metrics
│   ├── roadmap-extended.md          Extended feature roadmap
│   └── backlog.md                   Feature backlog & priorities
│
├── 03_user_experience/              🎨 UX & User Flows
│   ├── USER_FLOW.md                 Personas, journeys, UI hierarchy, design principles
│   └── admin-dashboard.md           Admin panel design & security roadmap
│
├── 04_api_reference/                🔌 APIs & Integration
│   ├── API_INTEGRATION.md           Argovis, OceanOPS, ERDDAP usage guide
│   ├── MCP_TOOLS.md                 MCP tool catalog (params, examples, triggers)
│   ├── api-contract.md              Internal API response schemas
│   ├── ingestion.md                 Data ingestion pipeline docs
│   ├── netcdf-parsing.md            NetCDF file format & parsing guide
│   └── rag.md                       RAG pipeline architecture
│
├── 05_database/                     🗄️ Database & Schemas
│   └── schema.sql                   PostgreSQL / PostGIS schema
│
├── 06_platform_vision/              🔭 Vision & Roadmap
│   ├── 01_vision_and_purpose.md      Project vision & mission
│   ├── 02_system_architecture.md     High-level architecture vision
│   ├── 03_features_and_schema.md     Planned features & data model
│   ├── 04_user_flows_and_ui.md       Envisioned user flows
│   ├── 05_execution_roadmap.md       Execution phases
│   ├── schema_v0.6.0.sql             DB migration v0.6.0
│   └── schema_v0.7.0.sql             DB migration v0.7.0
│
└── 07_troubleshooting_and_bugs/     🐛 Bug Reports & Fixes
    └── PHASE_5_MIGRATION_BUGS.md    Bug reports for Phase 5
```

---

## 🚀 Quick Links

| I want to... | Read this |
|--------------|-----------|
| Understand the system architecture | [ARCHITECTURE.md](01_architecture/ARCHITECTURE.md) |
| See what tasks are done / remaining | [PROJECT_PLAN.md](02_project_management/PROJECT_PLAN.md) |
| Check current sprint progress | [PROGRESS.md](02_project_management/PROGRESS.md) |
| Understand the user experience | [USER_FLOW.md](03_user_experience/USER_FLOW.md) |
| Learn how external APIs work | [API_INTEGRATION.md](04_api_reference/API_INTEGRATION.md) |
| See which MCP tools exist | [MCP_TOOLS.md](04_api_reference/MCP_TOOLS.md) |
| Read the internal API contracts | [api-contract.md](04_api_reference/api-contract.md) |
| Understand the project vision | [01_vision_and_purpose.md](06_platform_vision/01_vision_and_purpose.md) |
| Read about resolved bugs | [PHASE_5_MIGRATION_BUGS.md](07_troubleshooting_and_bugs/PHASE_5_MIGRATION_BUGS.md) |

---

## 📝 How to Update These Docs

1. **Progress tracker** → Update `02_project_management/PROGRESS.md` as you complete tasks
2. **Task checkboxes** → Update `02_project_management/PROJECT_PLAN.md` with `[x]`
3. **New API endpoints** → Document in `04_api_reference/api-contract.md`
4. **New MCP tools** → Add to `04_api_reference/MCP_TOOLS.md`
