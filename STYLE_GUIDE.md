# Polymerase Style Guide

A design system based on the schemat.io documentation templates.
Use this as reference for consistent UI development across the Polymerase project.

---

## Color System

### Semantic Accent Colors

| Name      | Tailwind Class   | Usage                              |
|-----------|------------------|------------------------------------|
| Green     | `text-green-400` | Success, code nodes, execution     |
| Blue      | `text-blue-400`  | Information, inputs (target)       |
| Purple    | `text-purple-400`| Input nodes, properties            |
| Orange    | `text-orange-400`| Schematic load, warnings           |
| Pink      | `text-pink-400`  | Schematic viewer                   |
| Cyan      | `text-cyan-400`  | Schematic save, execution          |
| Amber     | `text-amber-400` | Outputs, tips                      |

### Background Opacity Scale

```
bg-{color}-500/5   - Subtle hover state
bg-{color}-500/10  - Icon container background
bg-{color}-500/20  - Active/selected state, code tags
bg-{color}-900/10  - Info box background
bg-{color}-900/30  - Gradient start for sections
```

### Neutral Scale

```
neutral-200        - Primary text on dark backgrounds
neutral-300        - Body text
neutral-400        - Secondary text, labels
neutral-500        - Placeholder text, disabled states
neutral-600        - Subtle borders on hover
neutral-700/50     - Standard borders
neutral-800/30     - Card backgrounds
neutral-800/50     - Code block backgrounds, inputs
neutral-900/60     - Panel backgrounds
neutral-900/80     - Node backgrounds
neutral-950        - Deep backgrounds, code blocks
```

---

## Typography

### Font Families

- **Sans-serif**: System default (Tailwind's font-sans)
- **Monospace**: `font-mono` / JetBrains Mono for code

### Headings

```tsx
// Section title (xl)
<h2 className="text-xl font-bold text-white">Section Title</h2>

// Subsection title (lg)  
<h3 className="text-lg font-semibold text-white">Subsection</h3>

// Card/component title (md)
<h4 className="text-base font-semibold text-white">Card Title</h4>

// Small label
<span className="text-sm font-medium text-white">Label</span>
```

### Body Text

```tsx
// Primary body
<p className="text-neutral-300">Main content text</p>

// Secondary/muted
<p className="text-neutral-400">Supporting text</p>

// Small text (metadata, captions)
<span className="text-xs text-neutral-500">Metadata</span>
```

### Code Text

```tsx
// Inline code
<code className="px-2 py-1 rounded bg-neutral-700/50 text-neutral-200">
  set_block()
</code>

// Code with accent
<code className="px-1 rounded bg-green-500/20 text-green-300">
  context.Schematic
</code>
```

---

## Spacing

### Standard Scale

| Token | Value | Usage                           |
|-------|-------|---------------------------------|
| `1`   | 4px   | Tight spacing, inline elements  |
| `2`   | 8px   | Between related items           |
| `3`   | 12px  | Component internal padding      |
| `4`   | 16px  | Card padding, section gaps      |
| `6`   | 24px  | Section padding                 |
| `8`   | 32px  | Major section separation        |

---

## Borders & Corners

### Border Colors

```tsx
// Standard border
className="border border-neutral-800/50"

// Subtle border  
className="border border-neutral-700/50"

// Accent border (active/selected)
className="border border-green-500/50"

// Colored info border
className="border border-amber-500/20"
```

### Border Radius

| Class         | Usage                           |
|---------------|---------------------------------|
| `rounded`     | Small elements, code tags       |
| `rounded-lg`  | Buttons, inputs, small cards    |
| `rounded-xl`  | Cards, containers, nodes        |
| `rounded-2xl` | Large modals, feature sections  |

---

## Components

### Section Header with Icon

```tsx
<div className="flex items-center gap-3 mb-6">
  <div className="flex items-center justify-center w-12 h-12 border rounded-xl bg-green-500/10 border-green-500/20">
    <Zap className="w-6 h-6 text-green-400" />
  </div>
  <div>
    <h2 className="text-xl font-bold text-white">Section Title</h2>
    <p className="text-neutral-400">Section description</p>
  </div>
</div>
```

### Node Card

```tsx
<div className={`
  relative min-w-[220px] rounded-xl overflow-hidden
  bg-neutral-900/80 backdrop-blur-sm
  border transition-all duration-200
  ${selected ? 'border-green-500/50 shadow-lg shadow-green-500/10' : 'border-neutral-800/50'}
`}>
  {/* Header */}
  <div className="px-4 py-3 bg-gradient-to-r from-green-900/30 to-neutral-900/50 border-b border-neutral-800/50">
    <div className="flex items-center gap-2">
      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-green-500/20">
        <Icon className="w-4 h-4 text-green-400" />
      </div>
      <span className="font-medium text-sm text-white">{label}</span>
    </div>
  </div>
  {/* Content */}
  <div className="p-3">{children}</div>
</div>
```

### Info Callout

```tsx
<div className="p-4 rounded-xl border border-green-500/20 bg-green-900/10">
  <div className="flex items-center gap-2 mb-3">
    <Zap className="w-4 h-4 text-green-400" />
    <span className="text-sm font-medium text-green-100">Tips</span>
  </div>
  <div className="space-y-2 text-xs text-green-200/70">
    <div className="flex items-start gap-2">
      <ArrowRight className="w-3 h-3 mt-0.5 text-green-400 flex-shrink-0" />
      <span>Tip content here</span>
    </div>
  </div>
</div>
```

### Modal

```tsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Modal Title"
  subtitle="Modal description"
  icon={<Icon className="w-5 h-5" />}
  iconColor="text-green-400"
  size="lg" // sm | md | lg | xl | full
>
  {children}
</Modal>
```

---

## Button Variants

### Primary Action

```tsx
<button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 transition-all">
  <Play className="w-4 h-4" />
  Execute
</button>
```

### Ghost Button

```tsx
<button className="flex items-center gap-2 px-3 py-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-colors">
  <Icon className="w-4 h-4" />
  <span className="text-sm">Label</span>
</button>
```

### Outlined Button

```tsx
<button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-300 rounded-lg bg-neutral-800/50 border border-neutral-700/50 hover:bg-neutral-700/50 transition-all">
  <Icon className="w-4 h-4" />
  Save
</button>
```

---

## Transitions & Effects

### Standard Transitions

```tsx
// Color transitions
className="transition-colors duration-200"

// All properties
className="transition-all duration-200"
```

### Hover Effects

```tsx
// Scale on hover
className="hover:scale-[1.02] active:scale-[0.98]"

// Background change
className="hover:bg-neutral-800/50"

// Border highlight
className="hover:border-neutral-600/50"
```

### Backdrop Effects

```tsx
// Light blur
className="backdrop-blur-sm"

// Heavy blur (modals, panels)
className="backdrop-blur-xl"
```

### Shadows

```tsx
// Standard elevation
className="shadow-xl shadow-black/20"

// Colored glow (for selected states)
className="shadow-lg shadow-green-500/10"
```

---

## Icon Usage

Use Lucide React icons consistently:

```tsx
import { 
  Zap,           // Code nodes
  Hash,          // Number input
  Type,          // Text input
  ToggleLeft,    // Boolean input
  FolderOpen,    // Load schematic
  Save,          // Save schematic
  Eye,           // Viewer
  Play,          // Execute
  Settings,      // Properties
  Terminal,      // Execution logs
  Code,          // Code editor
  ArrowRight,    // List items
  Check,         // Success
  X,             // Error, close
  AlertTriangle, // Warning
  Info,          // Information
  Loader2,       // Loading
  Trash2,        // Delete
} from 'lucide-react';
```

Standard icon sizes:
- `w-3 h-3` - Inline with small text
- `w-4 h-4` - Buttons, inline with body text
- `w-5 h-5` - Card headers, modal icons
- `w-6 h-6` - Section headers
- `w-8 h-8` - Feature icons, empty states

---

## Dark Theme Only

This design system is optimized for dark mode. Key principles:

1. **Text hierarchy**: white → neutral-300 → neutral-400 → neutral-500
2. **Backgrounds**: Layer from darkest (neutral-950) to lighter (neutral-800)
3. **Borders**: Use low-opacity borders (neutral-800/50) for subtle separation
4. **Accents**: Use saturated colors sparingly for emphasis
5. **Contrast**: Ensure sufficient contrast for accessibility

---

## Don'ts

- Don't use emojis in UI or logs
- Don't use gradients on body text
- Don't mix border radius sizes inconsistently
- Don't use pure black (#000) or pure white (#fff)
- Don't over-animate - stick to 200ms transitions
- Don't use more than 2 accent colors in a single component

