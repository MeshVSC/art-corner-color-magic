# Klecks Integration Decision Document

**Date:** 2025-11-12
**Status:** Under Consideration
**Decision Deadline:** End of week (based on available credits)

---

## Background

We need professional painting tools for the "Paint Your Art" feature. The current custom implementation lacks the sophistication users expect from modern painting applications. We explored Klecks (https://github.com/bitbof/klecks), an open-source painting app that powers kleki.com.

---

## Klecks Overview

**License:** MIT (Free to use, modify, and integrate - just keep copyright notice)
**Tech Stack:** TypeScript (96.3%), SCSS (2.2%), WebGL
**Size:** 318 TypeScript files, ~2,292 lines in main orchestrator
**Repository:** https://github.com/bitbof/klecks

### Features
- **Brushes:** pen, blend, sketchy, pixel, chemy, smudge, eraser
- **Tools:** selection, paint bucket, text, shapes, gradient
- **Filters:** blur, tilt-shift, curves, distort, noise (WebGL-powered)
- **Advanced:** layers, pressure sensitivity, stabilizer, transform, crop, resize, perspective
- **Export:** PNG, PSD (import/export)
- **Multi-language:** 10+ languages built-in

---

## Architecture Analysis

### The GOOD ✅
- **Modular painting engine:** Brushes, canvas, layers, filters are well-separated
- **Professional quality:** Battle-tested, powers a popular web app
- **MIT licensed:** No restrictions on use or modification
- **Embed mode exists:** Can be integrated with minimal effort
- **Core components reusable:** Brush logic is pure, no UI dependencies

### The BAD ❌
- **Not React components:** Vanilla TypeScript with direct DOM manipulation
- **Monolithic UI:** KlApp orchestrator is 2,292 lines that wires everything
- **All-or-nothing in embed mode:** Can't selectively show/hide features easily
- **Framework mismatch:** Parcel bundler vs our Vite setup
- **No plugin system:** No official API for extensions

### The UGLY 💀
- **Fork maintenance:** Would require 5-10 hours/month to stay updated
- **Build system conflicts:** Their build process doesn't align with React ecosystem
- **DOM manipulation conflicts:** Vanilla JS DOM manipulation vs React's virtual DOM
- **Deep coupling:** UI and logic intertwined in many places

### The PRETTY ✨
- **Works immediately:** Embed mode can be integrated in 1-2 sessions
- **Professional tools:** WAY better than custom implementation
- **Proven solution:** Used by thousands daily on kleki.com
- **Active maintenance:** Regular updates from maintainer

---

## Integration Options

### Option 1: Embed Mode (FASTEST)

**What it is:** Load Klecks as a complete painting app inside our React app

**How it works:**
1. Load their `dist/embed.js` script
2. Create container div in React
3. Initialize: `new Klecks({ onSubmit: callback, width, height })`
4. Pass generated image to it
5. Get PNG back when user saves

**Pros:**
- ⚡ Fast implementation: 1-2 work sessions (40-80 hours human time, much faster with AI)
- 🔄 Always up-to-date: Benefit from their improvements
- 🛡️ Low maintenance: No fork to maintain
- ✅ Proven: Works on production sites

**Cons:**
- 🎨 Their UI, not ours: Can't customize interface easily
- 📦 All or nothing: Get all features, can't pick and choose
- 🔌 Black box: Limited control over behavior

**Effort:** 1-2 sessions
**Best for:** Getting to market fast, validating product-market fit

---

### Option 2: Selective Copy (RECOMMENDED)

**What it is:** Extract and copy the good parts (brushes, canvas, layers) into our React app, build our own UI on top

**What we copy from Klecks:**
- ✂️ **Brush engine** (`/brushes/` folder): All 7 brush implementations with pressure, stabilizer
- ✂️ **Canvas system** (`kl-canvas.ts`): Layer management, compositing logic
- ✂️ **History system** (`kl-history.ts`): Undo/redo with tile-based storage
- ✂️ **Filters** (optional): WebGL effects if needed
- ✂️ **Core utilities:** Color, transform, math libraries

**What we DON'T copy:**
- ❌ Their UI components
- ❌ KlApp orchestrator (2,292 lines)
- ❌ Their styling/layout system

**What we build:**
- ✅ Our React UI (we already have dual-sidebar layout)
- ✅ Our components calling their brush/canvas logic
- ✅ Our styling and branding

**Pros:**
- 🎨 Full UI control: Your design, your UX
- 🎯 Select features: Only include what you need
- 🚀 Professional tools: Get Klecks' painting quality
- ⚖️ Legal: MIT license allows this (just include copyright notice)
- 🔧 Maintainable: Own the code, update on your schedule

**Cons:**
- ⏱️ More work upfront: 13-25 work sessions
- 🔄 Manual updates: Have to pull new features yourself
- 🐛 More debugging: Integration issues to solve

**Effort Estimate:**

**For experienced human developer (manual work):**
- 80-120 hours = 2-3 weeks full-time

**For junior/mid developer (manual work):**
- 150-250 hours = 4-6 weeks full-time

**With AI assistance (Claude helping):**
- Phase 1: Extract brush/canvas code (5-10 sessions)
- Phase 2: Integrate with React UI (3-5 sessions)
- Phase 3: Test, debug, polish (5-10 sessions)
- **Total: 13-25 work sessions**

**Reality check:** 2,292 lines is NOT that much code. With AI help, this is very doable. AI can:
- Read and understand their entire codebase in minutes
- Extract relevant code automatically
- Adapt TypeScript to React patterns
- Handle most debugging
- Work much faster than manual coding

**Best for:** Custom branding, long-term product, specific feature requirements

---

### Option 3: Full Fork (NOT RECOMMENDED)

**What it is:** Fork entire Klecks repo, modify everything to fit

**Pros:**
- 🎛️ Maximum control
- 🔧 Can change anything

**Cons:**
- 💰 Massive effort: 400+ hours
- 🔄 High maintenance: 10-20 hours/month forever
- 🌊 Drowning in code: Deal with everything
- 📉 Diminishing returns: Not worth it

**Effort:** 400+ hours
**Best for:** Never (unless you need proprietary algorithms)

---

## Current UI Issues to Address

Before ANY Klecks integration, the existing "Paint Your Art" page has issues:

1. **Sidebars incomplete:** Left and right bars have no top/bottom caps, they just stop
2. **Scroll problem:** Page scrolls way too low with empty space
3. **Title misalignment:** "Paint Your Art" title not centered, smaller than other page titles
4. **Consistency:** Need to standardize header/title styling across all pages

**Pages in app:**
1. Landing page
2. Generate an image page
3. API required page
4. Paint Your Art page

---

## Decision Framework

### Choose Embed Mode if:
- ✅ You want to launch quickly
- ✅ You're okay with Klecks' UI
- ✅ You want minimal maintenance
- ✅ You want to validate the concept first

### Choose Selective Copy if:
- ✅ You need custom UI/branding
- ✅ You want specific features only
- ✅ You have time/credits for 13-25 sessions
- ✅ You want long-term product control

### Choose Full Fork if:
- ❌ You have unlimited time and budget
- ❌ You need to own everything
- ❌ **Seriously, don't do this**

---

## Recommendation

**Start with Option 2 (Selective Copy)** if you have the credits this week, because:

1. **Not that much code:** 2,000 lines is manageable, especially with AI
2. **Best of both worlds:** Professional tools + your UI
3. **Future-proof:** You own it, control updates
4. **Achievable timeline:** 13-25 sessions is realistic
5. **Already have UI:** Dual-sidebar layout is built, just need to wire painting logic

**Fallback to Option 1 (Embed)** if:
- Credits run out
- Need to launch immediately
- Can revisit custom UI later

---

## Next Steps (If Proceeding with Selective Copy)

### Phase 1: Core Extraction (5-10 sessions)
1. Clone Klecks repo and analyze structure
2. Extract brush implementations from `/brushes/`
3. Extract KlCanvas (layer system)
4. Extract KlHistory (undo/redo)
5. Set up in our project with proper attribution

### Phase 2: React Integration (3-5 sessions)
1. Create React wrapper for canvas
2. Wire brush system to our toolbar
3. Connect layer panel to KlCanvas
4. Implement undo/redo with KlHistory
5. Handle events (mouse/touch/pen pressure)

### Phase 3: Polish (5-10 sessions)
1. Test all tools thoroughly
2. Fix edge cases and bugs
3. Optimize performance
4. Add any missing features
5. Style to match app theme

---

## Technical Notes

### Legal Requirements (MIT License)
- ✅ Must include copyright notice in source files: "Copyright (c) 2025 bitbof"
- ✅ Must include copy of MIT license in project
- ❌ No attribution required in UI (but appreciated)
- ✅ Can modify, use commercially, close-source

### Integration Points
- Canvas rendering: WebGL + Canvas 2D
- Event handling: Mouse, touch, pen pressure
- State management: Will use React state + Klecks' KlHistory
- File I/O: PNG export (PSD optional)

### Dependencies to Consider
- **glfx.js:** For WebGL filters (if we want them)
- **ag-psd:** For PSD import/export (probably skip)
- **Parcel:** Their bundler (we won't use, just extract code)

---

## Personal Context

> "I'm not dating Vanessa anymore anyway, so fuck it."

This app was apparently related to someone named Vanessa. Decision on whether to invest more time/credits depends on:
- Credits available by end of week
- Whether the project is still meaningful/valuable
- Other priorities

No pressure either way - the analysis is documented, the code is ready whenever you want to proceed.

---

## Files Created During Analysis

Three detailed analysis documents were created by the research agent:

1. **KLECKS_QUICK_SUMMARY.md** (257 lines) - Executive summary
2. **KLECKS_ANALYSIS.md** (365 lines) - Architecture deep-dive
3. **KLECKS_TECHNICAL_DETAILS.md** (509 lines) - Code examples and implementation

These can be referenced for technical details during implementation.

---

## Conclusion

**Decision Status:** On hold until end of week

**If proceeding:** Option 2 (Selective Copy) recommended
**If not proceeding:** Embed mode can be done quickly if you change your mind later

**Current branch:** `claude/working-branch-011CV1mk6vBoMCQ3mq4U7THA`
**All research and UI redesign code:** Already pushed and ready

---

## Contact & References

- **Klecks GitHub:** https://github.com/bitbof/klecks
- **Klecks Demo:** https://kleki.com
- **License:** MIT - https://github.com/bitbof/klecks/blob/main/LICENSE
- **Embed Example:** https://github.com/bitbof/klecks/tree/main/examples/embed
