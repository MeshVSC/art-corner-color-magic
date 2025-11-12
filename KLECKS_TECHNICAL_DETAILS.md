# Klecks - Technical Deep Dive with Code Examples

## A. How the Embed Mode Works (and Why It's Important)

### Entry Point Structure

**File: `/src/embed.ts` (11 lines)**
```typescript
import { EmbedWrapper } from './app/script/embed/bootstrap/embed-wrapper';

Object.defineProperty(window, 'Klecks', {
    value: EmbedWrapper,
});
```
Exposes a single class on window.Klecks, lazy-loads the rest.

**File: `/src/app/script/embed/bootstrap/embed-wrapper.ts` (165 lines)**
```typescript
export class EmbedWrapper {
    private project: TKlProject | undefined;
    private instance: Embed | undefined;
    
    constructor(p: TEmbedParams) {
        // Shows loading screen immediately
        // Then async-loads main-embed.ts and instantiates Embed
        const mainEmbed = await import('../../main-embed');
        this.instance = new mainEmbed.Embed(p);
    }
    
    // Public API
    openProject(project: TKlProjectWithOptionalId) => this.instance!.openProject(project);
    getPNG() => this.instance!.getPNG();
    getPSD() => this.instance!.getPSD();
    readPSD(buffer: ArrayBuffer) => this.instance!.readPSD(buffer);
}
```

**File: `/src/app/script/main-embed.ts` (158 lines)**
```typescript
export class Embed {
    constructor(private p: TEmbedParams) {
        if (p.project) {
            this.onProjectReady(p.project);
        }
    }
    
    onProjectReady(project: TKlProjectWithOptionalId) {
        const projectWithId = {
            ...project,
            projectId: project.projectId ?? randomUuid(),
        };
        
        // THIS IS THE KEY COUPLING POINT
        this.klApp = new KlApp({
            project: projectWithId,
            bottomBar: this.p.bottomBar,
            aboutEl: this.p.aboutEl,
            embed: {
                url: this.p.embedUrl,
                onSubmit: this.p.onSubmit, // callback when user clicks "Submit"
            },
        });
        
        document.body.append(this.klApp.getElement());
    }
}
```

### Embed API Example (from /examples/embed/example.html)

```javascript
const klecks = new Klecks({
    onSubmit: async (onSuccess, onError) => {
        // User clicked submit button
        const png = await klecks.getPNG();
        // Upload to server...
        onSuccess(); // Close the painter
    },
});

// Load an existing PSD
fetch('drawing.psd')
    .then(r => r.arrayBuffer())
    .then(buf => klecks.readPSD(buf))
    .then(project => klecks.openProject(project));
```

---

## B. The Actual Painting Logic Separation

### KlCanvas - The Core Painting Engine

**File: `/src/app/script/klecks/canvas/kl-canvas.ts` (1,411 lines)**

The canvas is remarkably clean:

```typescript
export class KlCanvas {
    private layers: TKlCanvasLayer[];
    private selection: undefined | MultiPolygon = undefined;
    private readonly klHistory: KlHistory;
    
    // Main painting entry point
    drawLine(e: TDrawEvent): boolean {
        // e contains: x, y, pressure, brush info, color
        // Returns true if canvas changed
    }
    
    // Layer management
    addLayer(name: string): void
    deleteLayer(layerId: TLayerId): void
    setLayerOpacity(layerId: TLayerId, opacity: number): void
    
    // Rendering
    getComposed(scale?: number): HTMLCanvasElement | undefined
    drawPreview(ctx: CanvasRenderingContext2D): void
    
    // History integration
    pushStateForHistoryTile(): void
    
    // Export
    getThumbnail(): HTMLCanvasElement
}
```

**Key insight**: KlCanvas doesn't know about the UI. It only cares about:
- Drawing events (coordinates, pressure, brush)
- Layer data (opacity, visibility, blend mode)
- History state (for undo/redo)

### Brush System - Pure Painting Logic

**File: `/src/app/script/klecks/brushes/pen-brush.ts` (17,230 bytes)**
```typescript
export class PenBrush implements IBrush {
    draw(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        pressure: number,
        sizeMultiplier: number,
        alpha: number,
    ): void {
        // Pure pixel manipulation
        // No UI, no state, no event listeners
        // Just: given (x, y, pressure, size, alpha) -> draw pixels
    }
}
```

Brushes are:
- **Stateless functions** that transform coordinates → pixel changes
- **UI-agnostic** - don't care who's calling them
- **Pluggable** - can add new brushes without touching UI

Available brushes:
- `pen-brush.ts` (17KB) - smooth drawing
- `pixel-brush.ts` (18KB) - pixel-perfect
- `sketchy-brush.ts` (13KB) - stylized sketching
- `blend-brush.ts` (28KB) - color blending
- `smudge-brush.ts` (23KB) - smudging effect
- `chemy-brush.ts` (11KB) - chemistry effect
- `eraser-brush.ts` (9KB) - erasing

### History System - Undo/Redo

**File: `/src/app/script/klecks/history/kl-history.ts`**

```typescript
export class KlHistory {
    // Stores tile-based snapshots (efficient storage)
    push(entry: THistoryEntryDataComposed): void
    undo(): THistoryEntryDataComposed | undefined
    redo(): THistoryEntryDataComposed | undefined
    
    // Tile-based storage to minimize memory
    // Typical entry: {
    //   layer changes: only changed tiles, not full canvas
    //   visibility, opacity, blend mode changes
    // }
}
```

History is:
- **Independent** - manages its own state
- **Tile-based** - stores only changed pixels (efficient)
- **Agnostic** - doesn't care who's using it

---

## C. The UI Coupling Problem

### How KlApp Ties Everything Together

**File: `/src/app/script/app/kl-app.ts` (2,292 lines)**

The problematic structure:

```typescript
export class KlApp {
    // THE PROBLEM: 50+ instance variables
    private readonly rootEl: HTMLElement;
    private uiWidth: number;
    private uiHeight: number;
    private readonly layerPreview: LayerPreview;
    private readonly klColorSlider: KlColorSlider;
    private readonly toolspaceToolRow: ToolspaceToolRow;
    private readonly statusOverlay: StatusOverlay;
    private readonly klCanvas: KlCanvas;
    private uiLayout: TUiLayout;  // left or right sidebar
    private readonly saveToComputer: SaveToComputer;
    private readonly lineSanitizer: LineSanitizer;
    private readonly easel: Easel<TKlAppToolId>;
    private readonly easelProjectUpdater: EaselProjectUpdater<TKlAppToolId>;
    private readonly easelBrush: EaselBrush;
    private readonly collapseThreshold: number = 820;
    private readonly mobileUi: MobileUi;
    private readonly mobileBrushUi: MobileBrushUi;
    private readonly mobileColorUi: MobileColorUi;
    private readonly toolspace: HTMLElement;
    private readonly toolspaceInner: HTMLElement;
    private readonly toolWidth: number = 271;
    private readonly bottomBar: HTMLElement | undefined;
    private readonly layersUi: LayersUi;
    private readonly toolspaceScroller: ToolspaceScroller;
    // ... 30+ more properties ...
    
    constructor(p: TKlAppParams) {
        // 2,292 lines of orchestration
        this.klHistory = new KlHistory({...});
        this.klCanvas = new KlCanvas({...});
        this.easel = new Easel({...});
        this.layerPreview = new LayerPreview({...});
        // ... creates 50+ components ...
        
        // Wires them all together
        this.easel.onPointer = (e) => {
            const tool = this.getCurrentTool();
            tool.handle(e);
        };
        
        this.klCanvas.onUpdate = () => {
            this.layerPreview.render();
            this.statusOverlay.update();
            this.easel.render();
        };
        
        // ... 2,200+ more lines of wiring ...
    }
}
```

### The Easel Interface - The ONLY Clean API

**File: `/src/app/script/klecks/ui/easel/easel.ts` (903 lines)**

The good news: Easel has a clean interface:

```typescript
export type TEaselParams<GToolId extends string> = {
    width: number;
    height: number;
    project: TEaselProject;
    tools: Record<GToolId, TEaselTool>;  // Pluggable!
    tool: NoInfer<GToolId>;
    onChangeTool: (toolId: NoInfer<GToolId>) => void;
    onTransformChange: (transform: TViewportTransform, scaleOrAngleChanged: boolean) => void;
    onUndo?: () => void;
    onRedo?: () => void;
};

export class Easel<GToolId extends string> {
    // Can be reused independently!
    setSize(width: number, height: number): void
    render(): void
    setTool(toolId: GToolId): void
    getTransform(): TViewportTransform
    setSelection(selection?: MultiPolygon): void
}
```

The tools themselves are pluggable:

```typescript
export type TEaselTool = {
    tempTriggers?: TEaselToolTrigger[];  // spacebar, etc.
    onPointer: (e: TPointerEvent) => void;  // Main event handler
    onKeyDown?: TOnKeyDown;
    onKeyUp?: TOnKeyUp;
    getSvgElement: () => SVGElement;
    getHtmlOverlayElement?: () => HTMLElement;
    setEaselInterface?: (easelInterface: TEaselInterface) => void;  // Access to viewport
    getIsLocked?: () => boolean;  // Prevents tool switching while drawing
};
```

Example tool implementation:

```typescript
// File: /src/app/script/klecks/ui/easel/tools/easel-brush.ts
export class EaselBrush implements TEaselTool {
    onPointer(e: TPointerEvent) {
        // Just handle pointer events
        // Let KlCanvas do the actual painting
        this.klCanvas.drawLine(e);
    }
    
    getSvgElement(): SVGElement {
        // Provide cursor overlay if needed
        return this.svgEl;
    }
}
```

---

## D. React Integration Strategy

### Option A: Minimal Integration (Recommended)

Use Klecks as a black box in React:

```typescript
// React component
function PaintingApp() {
    const containerRef = useRef<HTMLDivElement>(null);
    const klecksRef = useRef<typeof Klecks>();
    
    useEffect(() => {
        if (containerRef.current && !klecksRef.current) {
            // Load Klecks embed
            const script = document.createElement('script');
            script.src = 'klecks-embed.js';
            script.onload = () => {
                klecksRef.current = new (window as any).Klecks({
                    onSubmit: (onSuccess, onError) => {
                        // Your logic
                        onSuccess();
                    },
                });
            };
            document.body.appendChild(script);
        }
    }, []);
    
    return <div ref={containerRef} style={{width: '100%', height: '100%'}} />;
}
```

**Pros**:
- Zero coupling
- Use all Klecks updates
- Simple maintenance
- Easy to replace

**Cons**:
- No control over UI
- Limited customization
- Klecks still manages its own state

### Option B: Light Fork (Canvas Wrapping)

Extract KlCanvas, keep everything else custom:

```typescript
// Core layer (from Klecks, unchanged)
import { KlCanvas } from 'klecks/canvas/kl-canvas';
import { KlHistory } from 'klecks/history/kl-history';
import { BRUSHES } from 'klecks/brushes/brushes';

// React wrapper
function PaintEngine() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [canvas] = useState(() => new KlCanvas({
        width: 800,
        height: 600,
        klHistory: new KlHistory({...}),
    }));
    
    const handleBrushStroke = (e: TDrawEvent) => {
        canvas.drawLine(e);
        // Render canvas to screen
        redraw();
    };
    
    return (
        <>
            <canvas ref={canvasRef} />
            <ColorPicker onColorChange={...} />
            <BrushSelector onBrushChange={...} />
        </>
    );
}
```

**Pros**:
- Reuse core painting engine
- Full UI control
- React-native integration

**Cons**:
- Need to implement viewport (transform, zoom, pan)
- Need to implement tools
- Higher development effort (200+ hours)

---

## E. File Size Reference (for estimation)

```
Critical files:
  app/kl-app.ts                      2,292 lines   ← Main orchestrator
  canvas/kl-canvas.ts                1,411 lines   ← Painting engine
  ui/easel/easel.ts                    903 lines   ← Viewport
  brushes/blend-brush.ts              28 KB        ← Complex brush
  brushes/smudge-brush.ts             23 KB        ← Complex brush
  brushes/pixel-brush.ts              18 KB        ← Simpler brush
  
If forking and keeping core:
  ✓ Keep: brushes/ (all 7 files, ~100KB total)
  ✓ Keep: canvas/ (kl-canvas.ts + utilities)
  ✓ Keep: history/ (kl-history.ts + tiles)
  ✓ Keep: filters/ (WebGL effects)
  ✓ Keep: image-operations/ (text, shapes, gradients)
  ✗ Replace: kl-app.ts (2,292 lines → React wrapper)
  ✗ Replace: ui/easel/* (903 lines → React viewport)
  ✗ Replace: ui/components/* (all UI components)
  ✗ Replace: ui/tool-tabs/* (tool-specific UI)
  ✗ Replace: ui/mobile/* (mobile UI)
```

---

## F. Build System Details

**Current Build** (Parcel):
```bash
npm run start         # Dev server with hot reload
npm run build         # Production build → /dist/index.js
npm run build:embed   # Embed build → /dist/embed.js
npm run build:help    # Help page → /dist/help.html
```

**Converting to React**:
If you keep Klecks core and wrap with React, you'd typically:
1. Keep Parcel for Klecks core (or convert to ES modules)
2. Use Vite/Webpack for React app
3. Export KlCanvas, KlHistory, BRUSHES as npm module
4. Import in React app

---

## G. Export Formats

Klecks supports multiple formats:

```typescript
// PNG (always works)
const png: Blob = await klApp.getPNG();

// PSD (complex, uses ag-psd library)
const psd: Blob = await klApp.getPSD();

// Custom project format (JSON)
const project: TKlProject = {
    width: 800,
    height: 600,
    layers: [
        {
            name: 'Background',
            isVisible: true,
            opacity: 1,
            mixModeStr: 'source-over',
            image: canvasElement,  // or HTMLImageElement or {fill: '#fff'}
        }
    ],
    projectId: 'uuid-here'
};
```

---

## H. Browser Storage & Recovery

Klecks automatically saves:

```typescript
// Auto-save to IndexedDB
// Recovery on next load if browser crash

// In your fork, you might want to:
// 1. Disable auto-save (setRecoveryDisabled)
// 2. Save to your own backend
// 3. Use browser storage quota API

const projectStore = new ProjectStore();
await projectStore.saveProject(project, thumbnail);
```

---

## Conclusion

**Klecks is 60% monolithic** (UI coupling) **40% modular** (core engine).

The engine (brushes, canvas, history) is extraction-worthy. The UI is tightly coupled and better left alone or fully replaced.

**Best path**: Use as embed initially, then decide if heavy customization justifies a fork.
