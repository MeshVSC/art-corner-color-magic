# Klecks Research - Quick Summary

## TL;DR Answers

### 1. Is it really monolithic?

**Short answer**: Partially - 60% monolithic (UI), 40% modular (core)

The **core engine** (brushes, canvas, history, filters) is well-separated and reusable. The **UI orchestration** is tightly coupled in a massive 2,292-line KlApp class.

- **Good**: Painting logic (KlCanvas, brushes, history) is independent
- **Bad**: UI components all created and wired together by KlApp
- **Result**: Can reuse core, but UI needs replacement if heavily customizing


### 2. Can we change the UI? How much?

**Short answer**: Yes, but it requires significant work (160-400+ hours)

**What's easy to customize**:
- Colors and themes (SCSS variables)
- Layout and spacing
- Button labels and icons
- Keyboard shortcuts

**What needs replacement**:
- KlApp (2,292 lines) - the main orchestrator
- All UI components (sidebar, panels, dialogs)
- Styling system (SCSS modules)
- Event wiring between components

**The painting engine stays** (KlCanvas, brushes, history)

**Can you use React components?** Yes, but you'd create a React wrapper around the core painting engine. Not a simple CSS override.


### 3. What are the challenges?

**Technical**:
- Module system mismatch (Parcel vs Node)
- DOM manipulation conflicts (vanilla vs React)
- SCSS styling doesn't integrate with React easily
- Canvas event handling needs bridging

**Maintenance**:
- Fork maintenance: 5-10 hours/month
- Merge conflicts when upstream updates
- No official plugin system
- Custom build system (Parcel, not Vite/Webpack)

**Licensing**: MIT (very permissive) ✓
- Can fork, modify, close-source
- Must keep copyright notice
- No attribution required in app (but appreciated)

---

## Recommended Path Forward

### Option 1: Use Embed Mode (Easiest) ⭐ RECOMMENDED
```
Timeline: 40-80 hours
Effort: Low
Maintenance: Minimal

Use Klecks as-is in embed mode:
- Inject into your React app
- Customize via CSS overrides
- Call getPNG/getPSD for results
- Leverage all Klecks updates
```

**Best for**: Getting to market quickly, simple customization needs

### Option 2: Light Fork (Medium Effort)
```
Timeline: 160-240 hours
Effort: Medium
Maintenance: 5-10 hours/month

Keep core painting engine, replace UI:
- Keep: brushes, canvas, history, filters
- Replace: KlApp, all UI components, styling
- Add: React wrapper layer
- Benefit: Full control over UI
```

**Best for**: Specific branding, custom tools/features, long-term product

### Option 3: Deep Fork (Not Recommended)
```
Timeline: 400+ hours
Effort: High
Maintenance: 10-20 hours/month

Complete rewrite with React:
- Replace: Everything except brushes library
- Benefit: Full React integration, custom algorithm
- Cost: Massive, hard to maintain
```

**Best for**: Only if you have proprietary painting algorithm

---

## Key Architecture Facts

**Codebase**: 318 TypeScript files
- Core engine: 215 files (brushes, canvas, history, filters)
- UI: ~100 files (components, tools, modals)

**Main bottleneck**: KlApp class
- 2,292 lines of orchestration code
- Creates and wires 50+ UI components
- Manages app state, event handling, layout
- **This is what you'd replace with React**

**Entry points**:
- Standalone: `/src/main-standalone.ts` → creates KlApp
- Embed: `/src/embed.ts` → `/src/main-embed.ts` → creates KlApp
- Both ultimately create the same KlApp class

**Brush implementations** (all pluggable, pure):
- Pen (17KB) - smooth drawing
- Pixel (18KB) - pixel-perfect
- Sketchy (13KB) - artistic
- Blend (28KB) - color mixing
- Smudge (23KB) - blending
- Chemy (11KB) - chemistry
- Eraser (9KB) - erasing

**Canvas system**:
- Layer-based (max 16 layers)
- Tile-based history (memory efficient)
- Selection support (via polygon-clipping)
- Undo/redo system (sophisticated)

---

## Files to Reference

**Core Engine** (reuse these):
- `/src/app/script/klecks/canvas/kl-canvas.ts` - Layer & painting
- `/src/app/script/klecks/history/kl-history.ts` - Undo/redo
- `/src/app/script/klecks/brushes/` - All brush implementations
- `/src/app/script/klecks/filters/` - WebGL effects

**UI** (replace these):
- `/src/app/script/app/kl-app.ts` - Main orchestrator (2,292 lines)
- `/src/app/script/klecks/ui/easel/easel.ts` - Viewport (903 lines)
- `/src/app/script/klecks/ui/` - All components

**Build/Config**:
- `/package.json` - Dependencies (Parcel bundler)
- `/src/app/style/style.scss` - Global styles
- `/src/embed.ts` - Embed entry point (11 lines)

---

## Effort Estimates

| Goal | Time | Difficulty | Maintenance |
|------|------|-----------|------------|
| Use embed mode as-is | 40-80h | Low | None |
| CSS overrides + theming | +20-40h | Low | 1h/month |
| New tool implementation | +40-80h | Medium | 2h/month |
| Replace UI with React | 160-240h | High | 5-10h/month |
| Custom painting algorithm | 400+h | Very High | 10-20h/month |

---

## Decision Matrix

Use **Embed Mode** if:
- ✓ Timeline is important
- ✓ Can live with default UI
- ✓ Only need basic customization
- ✓ Want to leverage upstream updates

**Light Fork** if:
- ✓ Need specific branding
- ✓ Want custom tools
- ✓ Have 6+ months timeline
- ✓ Can maintain a fork

**NOT** worth forking for:
- ✗ Just color changes (CSS overrides work)
- ✗ Sidebar repositioning (rearrange components)
- ✗ Adding simple filters (extend filter library)
- ✗ Keyboard shortcuts (config change)

---

## Next Steps

1. **Decide path** (embed vs fork)
2. **Review** `/src/app/script/app/kl-app.ts` to understand coupling
3. **Test** embed mode with your use case
4. **If forking**: Start with `/src/app/script/klecks/canvas/kl-canvas.ts` as the API layer
5. **If staying**: Extend via CSS and `/src/app/script/klecks/ui/` components

---

## References

**License**: MIT (very permissive)
**Repo**: https://github.com/bitbof/klecks
**Demo**: https://kleki.com
**Author**: bitbof (bitbof.com)

**Build commands**:
```bash
npm ci                  # Install
npm run lang:build      # Generate language files
npm run start           # Dev server
npm run build           # Production build
npm run build:embed     # Embed version
```

**Embed example**:
```javascript
const klecks = new Klecks({
    onSubmit: (onSuccess, onError) => {
        // Handle submission
    }
});
klecks.openProject({
    width: 800,
    height: 600,
    layers: [{...}]
});
```

---

## Critical Questions to Answer Before Deciding

1. **Do you need Klecks' specific brushes?**
   - Yes → Keep core, light fork makes sense
   - No → Might be easier to use alternative

2. **Can you live with Klecks' UI temporarily?**
   - Yes → Start with embed, add custom UI later
   - No → Requires full fork from day 1

3. **Do you have React as your stack?**
   - Yes → Forking requires React wrapper (doable)
   - No → Keep Klecks as-is or use web component pattern

4. **Is this a 2-week project or 2-year product?**
   - Short-term → Embed mode is fine
   - Long-term → Light fork with clear API

5. **What's your maintenance budget?**
   - <5 hours/month → Use embed mode
   - 5-10 hours/month → Light fork is viable
   - 10+ hours/month → Deep fork is possible
