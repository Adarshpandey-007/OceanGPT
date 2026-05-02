# User Flows and UI/UX Design

## 1. The Interaction Model

FloatChat relies on a **Conversational Command Center** model. The chat panel is ever-present on the left, while the rich visualization panels (Map, Plot, Table, Reports) occupy the right.

Unlike traditional dashboards where users click buttons to filter data, here the user converses, and the UI reacts to the conversation.

## 2. Example User Flow: "The Politician's Inquiry"

**User (Politician):** 
> *"We are planning to build a large desalination plant near 15N 70E. Is this a good idea?"*

**System Actions (Invisible to User):**
1. **Tool Call `get_nearest_floats`:** Finds ocean data near 15N 70E.
2. **Tool Call `search_argo_vector`:** Looks for historical salinity/temperature patterns in that region.
3. **Tool Call `check_legal_compliance`:** Cross-references 15N 70E with India's CRZ and Marine Protected Areas.

**System Response (Visible):**
1. **Auto-Viz:** The Map tab automatically opens, zooms to 15N 70E, and draws a hypothetical radius.
2. **Chat Response:**
   > "Based on current ocean data and environmental law, building a desalination plant at 15N 70E requires careful consideration.
   > 
   > **🌊 Ocean Data (Measured):** The average salinity here is already high (36.2 PSU). Discharging brine here could create a toxic local halocline.
   > 
   > **⚖️ Legal (India):** This location borders a CRZ-IA zone (Ecologically Sensitive). Heavy construction is strictly regulated under the Environment Protection Act.
   > 
   > **👥 Social Impact:** This is a primary fishing ground for artisanal fishermen. Brine discharge will likely reduce local fish yields, impacting livelihoods.
   > 
   > **🔄 Recommendation:** Consider moving the proposed site 15km South, where currents are stronger (faster brine dispersion) and it falls outside the CRZ-IA buffer. Would you like me to evaluate the alternative site?"

## 3. Dynamic UI Components

### Visualization Commands Payload
To enable the UI to react to Gemini, the API response will include a structured `visualization_commands` array:

```json
{
  "message": "Here is the temperature profile you requested...",
  "visualization_commands": [
    {
      "action": "switch_tab",
      "target": "plot"
    },
    {
      "action": "load_profile",
      "float_id": "5900001",
      "cycle": 45
    }
  ]
}
```

The Zustand `chatStore` will intercept these commands and dispatch state updates, causing the React components to seamlessly transition without user clicks.

## 4. Specific Page Layouts

- **`/app` (Explorer):** Split layout. Chat on left. Tabs (Map/Plot/Table) on right.
- **`/planner` (Project Planner):** Multi-step wizard overlay on top of the Map. Generates a scrollable "Sustainability Report Card" upon completion.
- **`/legal` (Legal Expert):** Split layout. Chat on left. Right panel shows "Cited Laws" with links to full text, compliance checklists, and jurisdiction comparators.
- **`/impact` (Social/Economic):** Dashboard layout showing demographic heatmaps and cost-benefit analysis charts generated dynamically via Plotly.
