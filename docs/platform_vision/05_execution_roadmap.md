# Versioned Execution Roadmap

This document outlines the step-by-step implementation plan for transforming FloatChat into a comprehensive decision-support platform.

---

## v0.5.0: Smart Advisor (Current Target)
**Focus:** Making the AI layman-friendly, context-aware, and capable of controlling the UI.

### Tasks
1. **Context & Persona Update:** Modify `src/lib/llm/gemini.ts` to include the "Ocean Advisor" persona, time/location context, and conversation history.
2. **Auto-Visualization Commands:**
   - Define the `control_visualization` tool in Gemini.
   - Update `src/app/api/query/route.ts` to return these commands.
   - Update `chatStore.ts` to handle and execute these commands.
3. **Data Synthesis:** Implement logic in `toolExecutor.ts` to handle empty query results by fetching historical regional averages and explicitly marking them as "Estimated".
4. **UI Fixes:** Ensure cross-tab chat visibility and scrolling work flawlessly (already partially completed).

---

## v0.6.0: Project Planner & Evaluate Mode
**Focus:** A dedicated tool for planning coastal projects and getting nature-first impact assessments.

### Tasks
1. **Schema Update:** Create `planned_projects` table in PostgreSQL.
2. **UI:** Build `/planner` page with the multi-step `ProjectWizard` component.
3. **Backend Logic:** Create `/api/planner/assess` route.
4. **Evaluate Mode:** Implement the "Nature Advocate" prompt that generates the Sustainability Score (0-100) and highlights Red Flags based on the project parameters and surrounding ocean data.
5. **Reporting:** Build PDF/Markdown export functionality for the generated assessment.

---

## v0.7.0: Legal Expert Mode
**Focus:** Multi-jurisdiction environmental law compliance checking.

### Tasks
1. **Data Ingestion:** Scrape/curate environmental laws for 15+ countries and international orgs (UN, IMO, IUCN).
2. **Vector DB Expansion:** Create an `environmental_laws` collection in ChromaDB and embed the legal texts.
3. **Schema Update:** Create `legal_zones` table in PostGIS for spatial compliance checks (e.g., CRZ boundaries).
4. **UI:** Build `/legal` page with `JurisdictionSelector` and comparative view components.
5. **Backend Logic:** Update Gemini tools to query the legal vector DB and PostGIS zones.

---

## v0.8.0: Social & Economic Impact
**Focus:** Human-centric analysis and integrated dashboard.

### Tasks
1. **Schema Update:** Create `coastal_demographics` table in PostgreSQL.
2. **UI:** Build `/impact` page with `StakeholderMatrix` and `EconomicCalculator` components.
3. **Backend Logic:** Integrate demographic and economic data into the core evaluation prompts to ensure every assessment balances nature with human livelihood.
4. **Unified Dashboard:** Create a high-level summary view combining Nature, Legal, and Social scores into a single traffic-light report.
