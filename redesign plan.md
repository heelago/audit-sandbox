Audit Sandbox: UI/UX Design Specification

An extension of the H2eApps Design System

1. Core Philosophy & System Architecture

Audit Sandbox is an academic platform where lecturers generate intentionally flawed AI texts, and students critically audit them.

Tone: Serious, academic, modern, clear. Never playful.

Visual Language: Inherits the H2eApps style (soft beige backgrounds, Sage/Amber glowing accents, deep grey typography, puzzle/connection metaphors).

Architecture: Clear separation between Pedagogy (creating/auditing) and Admin (settings/rosters).

Language: Hebrew Native, RTL (Right-to-Left) First.

2. RTL (Right-To-Left) & Typography Rules

Since the system is Hebrew-first, standard UI patterns must be mirrored.

Global RTL Directives

HTML Attribute: <html dir="rtl" lang="he">

Alignment: Default text alignment is right.

Logical Properties: Use CSS logical properties instead of physical ones (e.g., margin-inline-start instead of margin-left).

Layout Flow: Primary navigation/sidebars should appear on the right side of the screen. Reading flow moves Right-to-Left.

Typography (Hebrew Web Fonts)

To maintain the "academic yet modern" H2eApps contrast:

Headings (Academic/Editorial Serif): Frank Ruhl Libre or David Libre.

Usage: Assignment titles, wizard step titles, empty state headers.

Body & UI (Modern/Clean Sans-Serif): Rubik, Assistant, or Heebo.

Usage: Assignment text, tags, buttons, tooltips, analytical data.

Line Height: Hebrew requires slightly more breathing room. Base line-height should be 1.6 for long reading passages.

3. Adapting the H2eApps Color Palette

The established palette takes on specific semantic meanings in the Audit Sandbox.

Base Canvas (#F5F2EA): Main application background. Reduces eye strain during long reading/auditing sessions.

Card UI (#FCFAF5): Used for text panels, wizard steps, and student workspaces.

Academic Sage (#85A88B): Indicates truth, verified statements, successful progression, and "General/Approved" system statuses.

Burnt Amber (#B85D3B): Indicates Planted Signals, logical flaws, AI errors, and areas requiring student auditing. It is the color of "critical attention."

UI Shadows: Retain the soft ambient occlusion 0px 16px 48px rgba(140, 132, 119, 0.12). No harsh borders.

4. The Lecturer Experience (Creator Flow)

Goal: Reduce cognitive load via Progressive Disclosure and Wizard-like staging.

4.1 Dashboard

Uncluttered: Displays "Active Audits" and "Drafts" as elevated cards. Admin settings are hidden in a secondary top-nav or dropdown.

Action: A prominent primary button (Sage green): "צור מטלה חדשה" (Create New Assignment).

4.2 The Assignment Wizard (The "Puzzle Spine" layout)

Instead of a giant form, creation is a staged vertical wizard. The "Puzzle Spine" from the landing page becomes the vertical progress tracker on the right side of the screen.

Step 1: Context & Presets

Input: Topic/Prompt.

UI: A grid of selectable cards for Discipline Presets (General Academic, Anthropology, Ancient Med, Critical Theory, Law, Clinical).

Auto-suggest: If the user types a prompt first, the system softly highlights the recommended preset card with a Sage glow.

Step 2: Planted Signals & Brainstorming

UI: A checklist of flaws (e.g., Empty fluent paragraph, Causal leap, Concept blur).

Brainstorm Feature: A discrete button labeled "חולל רעיונות לכשלים" (Generate flaw ideas). Opens a side-panel where an AI suggests high-value pedagogical mistakes based on the topic.

Step 3: Generation & Agents (Lifecycle States)

Process Transparency: Do not just show a spinner. Show a skeleton loading state with glowing text indicating states: Draft (טיוטה) → Generating Texts (מייצר טקסטים) → Analyzing Signals (מנתח אותות).

Visual: Audit agents scanning the text are represented by soft Amber pulses moving down the skeleton text.

Step 4: Calibration (Manual Review)

The generated texts are presented.

Planted signals are pre-highlighted in a soft Amber wash (#F4E8E3).

Lecturer can click any text to add/edit/reject flaws before releasing to students.

5. The Student Experience (Audit Flow)

Goal: A focused, distraction-free environment for deep reading and critical analysis.

5.1 The Workspace Layout

Two-Pane Design (Desktop):

Right Pane (60%): The generated text to be audited. Large, highly legible typography (Rubik, 18px).

Left Pane (40%): The "Audit Inspector" panel. Fixed on scroll.

Mobile Behavior: The inspector panel acts as a bottom-sheet that pulls up when text is selected.

5.2 Interaction: Selecting & Tagging

Selection: Student highlights a text span.

Floating Action: A minimal toolbar appears above the selection (like Medium or Notion) with an "Audit" icon.

Tagging (Inspector Panel):

The selected text appears in the Left Pane.

Student selects an Issue Type from chips (Error, Missing Element, Nuance, Better Alternative, Verified).

Color Coding: "Verified" tags are Sage; "Errors/Missing" tags are Amber.

Explanation & Evidence: Two clear text areas for the student to justify their audit.

Visual Feedback: Once tagged, the text span in the main document gets a subtle dashed underline matching the category color (Amber/Sage). Hovering the underline shows a glowing connection line to the left pane.

6. Component Specifications & Behavior

AI Transparency Indicators

Whenever the system is performing an AI task (generating flaws, running agents), use a subtle animated SVG of the H2eApps "connection nodes" glowing sequentially.

Do not expose raw AI prompts. Use human-readable status text: "מתאים את שפת המודל לשיח המשפטי..." (Adapting model language to legal discourse...).

Tagging Chips (Student View)

Must be highly scannable.

Style: Pill-shaped, semi-transparent background.

[ סוגיה לוגית ] (Logical Issue) -> Background: #F6EDE9 (Ultra-light amber), Text: #B85D3B.

[ טיעון מאומת ] (Verified Claim) -> Background: #EDF3EE (Ultra-light sage), Text: #85A88B.

The "Planted Signal" Highlight (Lecturer View)

When a lecturer views the text before publishing, the AI's planted mistakes are visible.

Style: background-color: rgba(184, 93, 59, 0.15); border-radius: 4px; border-bottom: 2px solid #B85D3B;

Clicking this highlight opens a popover detailing the exact pedagogical intent (e.g., "Overgeneralization").

7. Developer Handoff Notes (CSS/Tailwind Guidelines)

Ensure Tailwind or your CSS framework has rtl prefixing enabled.

Map your semantic colors: primary -> Sage, warning/critical -> Amber.

Use grid-cols-1 md:grid-cols-12 for the Student workspace, allocating col-span-7 to text and col-span-5 to the inspector.

Rely on backdrop-blur for sticky headers or bottom sheets to maintain the "glassy/fluid" laboratory feel without adding harsh borders.