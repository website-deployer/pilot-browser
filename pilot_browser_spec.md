# Pilot: A Minimalist AI-Powered Search Browser with Intelligent Agent Task Handling

**Pilot** is a streamlined, minimalist browser featuring a single input "search pad" that supports two distinct modes:

- **Search Mode:** Standard AI-enhanced web search with multi-source aggregation, intent parsing, summarization, and zero-click answers.
- **Agent Mode:** A powerful multi-agent backend system ("Orion Framework") that interprets user prompts as tasks and generates robust browser automation scripts executed securely within Pilot.

---

## User Interface & Experience

- A **single centered input field** with minimalist styling (no tabs, no address bar, no bookmarks). Inspired by Raycast and macOS Spotlight for clean, distraction-free interaction.
- A small status indicator beneath the input shows task progress.
- Auto-matched dark/light themes.
- Results or task outputs appear as simple text/cards below the input field.
- No persistent history or multiple tabs; each query/task is atomic.

---

## Search Mode (AI-Enhanced Search)

Pilot's Search Mode behaves as an advanced, zero-click search assistant:

- **Intent-aware query parsing:** Determines whether the input is a question, a lookup, or a task trigger.
- **Multi-source aggregation:** Queries Google, Bing, DuckDuckGo, Reddit, and other APIs in parallel, merges and deduplicates results.
- **Summarized output:** Uses LLMs (e.g., GPT-4) to condense results into concise, natural language summaries instead of raw links.
- **Smart redirection:** If the input clearly describes an actionable task (e.g., "Pay my electricity bill"), Pilot automatically switches to Agent Mode.
- **Voice input support** for hands-free operation (optional).

---

## Agent Mode (The Orion Framework)

Agent Mode interprets user prompts as **complex automation tasks**. It activates a **4-agent system** that orchestrates task analysis, planning, development, and validation before delivering executable automation scripts.

### 1. Feasibility & Task Understanding

- The **Planner Agent** first determines **whether the prompt describes a feasible automation task**. This includes:
  - Checking if the task can be executed using supported tools and APIs.
  - Assessing whether user credentials or accounts are needed.
  - Flagging any unclear or ambiguous instructions that require follow-up.
  - If the task isn't feasible then it warns the user of such and asks the user to try another prompt.

### 2. Interactive Follow-Up with User

- If clarification is needed, the Planner Agent **generates follow-up questions for the user**, such as:
  - Which specific tool/platform to use? (e.g., Google Calendar, Zoom, Slack)
  - Which credentials should be used or which user account?
  - Additional task details (meeting title, invitees, time zones, message tone).
- This interactive loop repeats until sufficient information is gathered to proceed.

### 3. Account Setup & Credential Handling

- For tasks requiring user authentication (e.g., scheduling a meeting, sending emails), Pilot:
  - Uses the **user’s stored credentials** secured in encrypted local storage or via OAuth2 tokens.
  - If credentials are missing, securely prompts the user to authenticate or provide necessary tokens.
  - Respects user privacy by never transmitting credentials externally—authentication is local and encrypted.
  - Supports session management for persistent login to web services.

### 4. Multi-Agent Workflow

- **Planner Agent:** Breaks down the final, clarified task into a structured, stepwise plan referencing needed tools and credentials. Queries the Research Agent if needed for API details or task feasibility checks.
- **Research Agent:** Answers Planner’s questions about API capabilities, legal or security constraints, and best practices for tool usage.
- **Developer Agent:** Generates Python + Playwright automation scripts based on the plan, including interactions like logging in, navigating web UIs, and performing multi-step workflows (e.g., creating calendar events, messaging participants).
- **Tester Agent:** Executes the script inside a sandboxed Pilot browser context to verify correctness, usability, and output compliance. Provides iterative feedback to Developer Agent until success.

### 5. Script Execution

- The final validated automation script is delivered to the user’s local Pilot browser instance.
- Scripts execute **within the embedded Chromium context** ensuring sandboxing, GUI awareness, and ability to provide live feedback or visual status.
- Pilot manages all secure credential injection locally at runtime.

---

## 🧩 Case Scenarios for Agent Mode (Orion Framework)

### Scenario A: Meeting Scheduling via Google Calendar + Gmail
**User Input:**
> “I have a meeting in 30 minutes. Please set it up for me.”

**Agent Workflow:**
- **Planner Agent** checks feasibility:
  - Determines the task requires interacting with Google Calendar, Meet, and Gmail.
  - Verifies whether credentials are available or OAuth login is required.
  - If unclear, triggers follow-up questions:
    - “Which Google account should I use?”
    - “Meeting title?”
    - “Invitees?”
    - “Tone for the email?”
- **Research Agent** confirms:
  - Required Google API scopes (calendar, mail) are available.
  - Session management and login flows are accessible within automation.
- **Developer Agent** crafts script:
  - Navigate to calendar.google.com, authenticate via stored token.
  - Create calendar event with title, time, invitee emails.
  - Generate Google Meet link and copy it.
  - Compose and send a friendly email via Gmail to invitees.
- **Tester Agent** execution:
  - Runs the script inside Pilot’s embedded Chromium.
  - Verifies that:
    - The event appears in Google Calendar.
    - Email is sent correctly.
    - Optional: screenshot or log summary.
- **Iteration:**
  - If testing fails (e.g. event not visible or missing invitees), Tester feeds back to Developer for fixes.
  - Loop repeats until script meets all requirements.
- **Execution & Delivery:**
  - Final validated script runs in browser context.
  - UI updates status; user is notified when done.

### Scenario B: Booking a Flight + Sending Confirmation
**User Input:**
> “Book me a flight to San Francisco next Friday and email itinerary to me.”

**Agent Workflow:**
- **Planner Agent** parses:
  - Recognizes travel booking is actionable with multiple steps (search flights, select, checkout, send confirmation email).
  - Asks follow-ups:
    - Preferred airline?
    - Date/time flexibility?
    - Cabin class?
    - Which email address?
- **Research Agent** verifies:
  - Whether web automation is allowed on target airline site.
  - How to simulate a booking (test or sandbox mode).
- **Developer Agent** generates script steps:
  - Search flight site (e.g. Delta or Expedia).
  - Fill in origin, destination, date.
  - Select flight (lowest available price).
  - Capture booking details.
  - Compose and send an email with itinerary.
- **Tester Agent** validates:
  - Scraper correctly finds price and flight details.
  - Email formatting is correct.
  - Booking steps complete up to payment page (with mock data).
- **Execution:**
  - Script runs in Pilot’s browser context.
  - Output summary delivered to user interface.

### Scenario C: Research + Summary Task
**User Input:**
> “Find the top three AI agents being used in supply chain logistics and summarize use cases.”

**Agent Workflow:**
- **Planner Agent** identifies:
  - Task is a multi-source research + summarization job.
  - No credentials or web automation required.
- **Developer Agent:**
  - Launches search queries across Google and relevant research databases.
  - Extracts data from sources such as Blue Yonder, Siemens, logistics case studies.
- **Tester Agent** ensures:
  - Three unique agents listed.
  - Each includes supply chain-specific usage examples and sources.
- **Research Agent**, if consulted, might supply:
  - Additional context or legal considerations (e.g., compliance statements).
- **Execution:**
  - Summaries and source citations displayed in card UI.

---

## 🧠 Design Principles & Insights

- **Interactive Clarification Loops:** Planner Agent dynamically asks follow‑ups until the task is fully specified, ensuring automation scripts are precise and context-aware.
- **Feasibility Checking:** Before generating code, Planner verifies availability of APIs, web automation allowances (robots.txt, CAPTCHAs), credentials, and legality.
- **Emergent Coordination:** Agents function like a distributed system that self-organizes around tasks—similar to enterprise multi-agent orchestrators that show emergent behavior and error correction through agent-to-agent feedback loops.
- **Code‑test‑iterate Loop:** Dev/Test agent loop increases reliability dramatically—similar to self-review workflows shown to boost success rates from ~54% to ~82%.
- **Real‑world Analogues:** This four-agent collaboration mirrors industry systems like ServiceNow, Salesforce, and SAP where agentic AI automates workflows while humans oversee operations.

---

## Technology Stack Overview

| Layer              | Technology                           | Justification                             |
| ------------------ | ------------------------------------ | ----------------------------------------- |
| Frontend/UI        | Electron + HTML/CSS/JS               | Chromium-based, cross-platform minimal UI |
| Backend/API        | Python + FastAPI or Flask            | Async, lightweight REST & WebSocket API   |
| Agent Logic        | Python                               | LLM orchestration, multi-agent workflow   |
| Automation Engine  | Python + Playwright (or Pyppeteer)   | Reliable, modern browser automation       |
| Credential Storage | OS keyring / Fernet-encrypted SQLite | Secure local credential management        |
| LLM Integration    | OpenAI GPT-4 (pluggable)             | Modular, swappable LLM provider           |

---

## Security & Privacy

- Credentials are **never stored in plaintext**; encrypted storage or OS keyring used.
- OAuth2-based authentication flows implemented for all third-party services.
- All automation executes **locally within Pilot’s embedded browser**; no sensitive data leaves the user environment.
- User prompts requiring sensitive info trigger explicit consent and credential input.
- README and UI include warnings about credential security best practices.

---

## Summary

Pilot offers a clean, distraction-free browser experience with powerful, AI-driven automation behind the scenes. Agent Mode intelligently handles multi-step tasks including account setup, login, and multi-tool workflows, prompting the user for missing info and securely managing credentials. The system is modular, scalable, and designed with security and UX simplicity in mind.

