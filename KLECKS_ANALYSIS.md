# Klecks Painting App - Detailed Architecture Analysis

## Executive Summary
Klecks is **partially monolithic**: The painting engine (canvas, brushes, history) is well-separated from UI components, but the UI is tightly coupled to the application shell. Customization is possible but moderately complex.

---

## 1. IS IT REALLY MONOLITHIC?

### Architecture Overview

**Repository Size**: 318 TypeScript files total, 215 in the core `klecks` module

**Directory Structure**:
```
src/app/script/
├── bb/                    # Utility library (input, math, transform, color)
├── klecks/               # Core painting engine (215 files)
│   ├── brushes/          # Brush implementations (pen, blend, pixel, sketchy, etc.)
│   ├── canvas/           # Canvas rendering & layer management
│   ├── history/          # Undo/redo system
│   ├── ui/               # UI components (tightly coupled)
│   │   ├── easel/        # Interactive viewport (903 lines)
│   │   ├── project-viewport/ # Canvas preview & rendering
│   │   ├── components/   # Reusable UI components
│   │   ├── tool-tabs/    # UI for each tool
│   │   ├── mobile/       # Mobile-specific UI
│   │   └── modals/       # Dialog components
│   ├── image-operations/ # Filters, effects (text, shapes, gradients)
│   ├── filters/          # WebGL-based effects
│   ├── select-tool/      # Selection tool logic
│   ├── storage/          # PSD, PNG export, recovery
│   └── utils/            # Utilities
├── app/                  # Main application orchestration (KlApp, 2292 lines)
├── embed/               # Embed mode entry point
├── theme/               # Theming system
├── language/            # i18n
└── polyfills/
```

### Key Classes & Coupling

**File: `/src/app/script/app/kl-app.ts` (2,292 lines)**
- **Role**: Main orchestrator - manages everything
- **Coupling**: Creates and manages all UI components, canvas, history, tools
- **Components instantiated**: 
  - Easel (viewport, 903 lines)
  - KlCanvas (painting engine, 1,411 lines)
  - KlColorSlider, LayerPreview, ToolspaceToolRow, LayersUi
  - MobileUi, MobileBrushUi, MobileColorUi
  - Multiple tool instances (EaselBrush, EaselGradient, etc.)

**File: `/src/app/script/klecks/canvas/kl-canvas.ts` (1,411 lines)**
- **Role**: The painting surface - layers, drawing, selection
- **Independence**: Moderately independent - takes history as dependency
- **Responsibility**: Layer management, drawing operations, pixel manipulation

**File: `/src/app/script/klecks/ui/easel/easel.ts` (903 lines)**
- **Role**: Interactive viewport/editor
- **Generic design**: `Easel<GToolId extends string>` - tools are pluggable
- **Clean interface**: TEaselInterface exposes minimal API (transform, cursor, render requests)
- **Independence**: Can operate independently with proper tool implementations

### Separation of Concerns Analysis

**WELL SEPARATED**:
- Brushes from UI: `/src/app/script/klecks/brushes/` (separate .ts files, pure painting logic)
- Canvas from UI: KlCanvas is a painting abstraction
- History from UI: KlHistory handles undo/redo independently
- Viewport from Tools: TEaselTool interface allows pluggable tools

**TIGHTLY COUPLED**:
- KlApp orchestrates everything together (2,292 lines is a red flag)
- UI components deeply import from klecks core throughout
- Tool-specific UI (tool-tabs, brush-ui) tightly integrated with tools
- Mobile UI hardcoded alongside desktop UI
- Layout, responsive design mixed with logic

### Assessment: Moderately Monolithic
- The **core engine** (canvas, brushes, history) has good separation
- The **UI layer** is the problematic part - KlApp couples everything together
- A fork could work but would require significant refactoring to decouple UI

---

## 2. CAN WE CHANGE THE UI? HOW MUCH?

### UI Code Organization

**Location**: `/src/app/script/klecks/ui/` + `/src/app/script/app/kl-app.ts`

**Framework**: Vanilla TypeScript + DOM manipulation (NOT React, NOT Vue)
- Direct HTML element creation via `BB.el()` helper
- SCSS modules for styling
- Event listeners manually managed
- No virtual DOM, no reactive framework

**Styling**:
- **File**: `/src/app/style/` contains all CSS
- **Approach**: SCSS modules imported as `import * as classes from './component.module.scss'`
- **Variables**: `/src/app/style/vars.scss` defines color/theme variables
- **Dark mode**: `/src/app/style/dark.scss` handles dark theme

### Current UI Architecture

**Main Components**:
1. **Toolspace** (sidebar UI) - tools, layers, settings
2. **Easel** (canvas viewport) - interactive drawing area
3. **Layer preview**, **color picker**, **status overlay**
4. **Tool-specific panels**: brushes, text, shapes, layers

**Coupling Issues**:
```typescript
// From kl-app.ts - KlApp controls EVERYTHING
private readonly layerPreview: LayerPreview;
private readonly klColorSlider: KlColorSlider;
private readonly toolspaceToolRow: ToolspaceToolRow;
private readonly statusOverlay: StatusOverlay;
private readonly klCanvas: KlCanvas;
private readonly easel: Easel<TKlAppToolId>;
private readonly mobileUi: MobileUi;
private readonly mobileBrushUi: MobileBrushUi;
// ... 50+ more properties managing state and lifecycle
```

### Can You Replace the UI with React?

**YES, but with significant work**:

**What would STAY (reusable)**:
- Brush implementations (pure painting logic)
- Canvas layer system (KlCanvas)
- History/undo system (KlHistory)
- Color manipulation utilities
- Filter engine (WebGL filters)
- PSD import/export logic
- Keyboard/pointer event handling infrastructure

**What you'd NEED TO REWRITE**:
1. **Replace KlApp** - Create React component replacing the 2,292-line orchestrator
2. **Replace all UI components** - Rewrite as React components:
   - Easel viewport
   - Toolspace sidebar
   - Layer panel
   - Color picker
   - Tool tabs
   - Mobile UI
3. **Replace styling** - SCSS to CSS-in-JS or Tailwind
4. **Replace event wiring** - React hooks + state management

**How tightly coupled is the UI to logic?**
- **Moderate to high**: KlApp passes references everywhere
- Each UI component receives callbacks and object references
- Tool definitions are hardcoded into KlApp
- Mobile vs desktop UI branches hardcoded

### Integration Path

```
Current: KlApp -> orchestrates UI components -> paints via KlCanvas

Potential: React App -> provides UI components -> calls KlCanvas via clean API
```

**Minimum API you'd need to expose**:
```typescript
interface IPaintingEngine {
  // Canvas operations
  getCanvas(): KlCanvas;
  getHistory(): KlHistory;
  
  // Tools
  selectTool(toolId: string): void;
  getTool(toolId: string): TEaselTool;
  
  // Colors
  getPrimaryColor(): TRgb;
  setPrimaryColor(color: TRgb): void;
  
  // Rendering
  render(ctx: CanvasRenderingContext2D): void;
  
  // Events
  handlePointer(e: TPointerEvent): void;
  handleKey(e: KeyboardEvent): void;
}
```

### What Could You Customize

**Easily**:
- Colors, themes (SCSS variables)
- Layout/positioning (UI component arrangement)
- Button labels, icons (strings in components)
- Keyboard shortcuts (UI mapping)

**Moderately**:
- Add new tools (create TEaselTool implementation + UI)
- Add new filters (extend filter library)
- Mobile breakpoints and responsive behavior
- Embed customizations (onSubmit handler, logos)

**Difficult**:
- Core brush algorithms (deeply tuned, interdependent)
- Canvas rendering pipeline (optimized for layers)
- History system (complex tile-based snapshots)
- Replace with completely different painting algorithm

---

## 3. TECHNICAL CHALLENGES

### Dependencies & Build System

**Parcel Bundler** (not webpack, not vite):
```json
{
  "parcel": "2.16.0",
  "@parcel/transformer-glsl": "2.16.0",  // WebGL shaders
  "@parcel/transformer-sass": "2.16.0",  // SCSS
  "ag-psd": "28.3.1",                    // PSD format (ag-psd library)
  "polygon-clipping": "0.15.7",          // Selection paths
  "transformation-matrix": "3.1.0",      // Matrix math
  "js-beautify": "1.15.4",               // Code formatting
  "mdn-polyfills": "5.20.0"              // Browser polyfills
}
```

**Few production dependencies** - actually good for customization

**Build outputs**:
- `npm run build` → `/dist/index.js` (standalone app)
- `npm run build:embed` → `/dist/embed.js` (embedded version, 165 lines wrapper)
- Both versions lazy-load the main bundle

### Integration Challenges into React App

**Challenge 1: Module System Mismatch**
- Klecks uses Parcel's ES modules with URL imports
- React uses standard Node module resolution
- Solution: Extract core modules, recreate module structure

**Challenge 2: DOM Manipulation**
- Klecks directly creates DOM elements: `BB.el({ className, css, ... })`
- React manages DOM
- Solution: Wrap painting canvas in a `<div ref={}>` container, let Klecks create viewport

**Challenge 3: Styling**
- Klecks uses SCSS modules
- React apps typically use CSS-in-JS or Tailwind
- Solution: Extract and convert SCSS to CSS modules or Tailwind

**Challenge 4: Canvas Rendering**
- Klecks uses OffscreenCanvas for layers
- Multiple canvas contexts needed
- Solution: Provide canvas elements from React, pass to painting engine

**Challenge 5: Event Handling**
- Klecks uses custom PointerListener, KeyListener
- React has synthetic events
- Solution: Bridge: React events → Klecks event system

**Challenge 6: State Management**
- Klecks keeps all state in class instances
- React uses hooks/Redux/context
- Solution: Create React hooks wrapper around KlCanvas, KlHistory

### Fork Maintenance Challenges

**Difficulty: MODERATE TO HIGH**

**Reasons**:
1. **Code tightly integrated**: Refactoring upstream requires merging carefully
2. **No official plugin API**: Adding features means editing core files
3. **Custom build system**: Parcel-specific (not the React ecosystem standard)
4. **Upstreamability**: Most customizations won't merge back
5. **Update drift**: Major React ecosystem updates won't help (not React-based)

**Maintenance effort**:
- **Weekly**: Monitor bug fixes from upstream
- **Monthly**: Evaluate security updates (Parcel, polyfills)
- **Quarterly**: Merge bug fixes (Git cherry-pick, manual conflict resolution)
- **Yearly**: Major version updates (very difficult if core changed)

**Estimate**: 5-10 hours/month for active maintenance, more if making major changes

### Licensing & Attribution

**License: MIT** (permissive, very favorable)
- You can fork, modify, commercialize, sublicense
- Must include copyright notice and license
- Must retain copyright: "Copyright (c) 2025 bitbof (bitbof.com)"

**Attribution Requirements**:
- Keep license in repo: ✓ MIT text must be included
- Code comments?: No formal requirement, but good practice
- Credit in app?: No requirement, but appreciated

**No GPL/copyleft concerns** - you can close-source a modified version if desired

---

## SUMMARY: PATH FORWARD

### Recommendation: **Wrap, Don't Fork** (initially)

**Best approach**:
1. **Use embed mode** as-is in your React app initially
2. Inject Klecks painter into your UI via `<iframe>` or container
3. Communicate via the Embed API (getPNG, getPSD, openProject)
4. Customize via CSS overrides and build system

**Why?**:
- Minimal maintenance burden
- Leverage all Klecks updates
- Clear separation of concerns
- Easier to add your custom features

### If you must customize heavily:

**Consider a **light fork** approach**:
1. Keep Klecks core (canvas, brushes, history) as-is
2. Replace only KlApp + UI layer (create React wrapper)
3. Reuse: brush logic, canvas rendering, history system
4. Create adapter layer: React components → KlCanvas/KlHistory APIs

**Effort estimate**:
- Shallow integration: 40-80 hours (custom CSS, config)
- Medium customization: 160-240 hours (new tools, UI changes)
- Deep fork: 400+ hours (React rewrite, major changes)

### Do NOT fork for:
- Styling/theming changes (CSS overrides work)
- Minor UI rearrangement (component order changes)
- Simple filter additions (extend filter library)

### DO fork if you need:
- Custom paint rendering algorithm
- Proprietary brush engines
- Completely different tool set
- Integration with specific backend system

---

## Key Files Reference

**Core Engine** (reusable):
- `/src/app/script/klecks/canvas/kl-canvas.ts` - Layer & painting system
- `/src/app/script/klecks/history/kl-history.ts` - Undo/redo
- `/src/app/script/klecks/brushes/` - All brush implementations
- `/src/app/script/klecks/filters/` - Effects system

**UI** (replace if needed):
- `/src/app/script/app/kl-app.ts` - Main orchestrator
- `/src/app/script/klecks/ui/easel/easel.ts` - Viewport
- `/src/app/script/klecks/ui/` - All components

**Entry Points**:
- `/src/main-standalone.ts` - Standalone app bootstrap
- `/src/embed.ts` → `/src/main-embed.ts` - Embed mode bootstrap
- `/src/index.html` - Main HTML

**Build**:
- `/package.json` - Dependencies, build scripts
- `/src/app/style/style.scss` - Global styling
