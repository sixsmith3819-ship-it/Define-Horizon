# Define Horizon BMS - CSS Class Reference Guide

## Overview

The system now uses a single, clean `globals.css` file. All styles are organized into clear sections with no duplication.

---

## 1. LAYOUT SYSTEM

### Page Containers

Use these to control the maximum width of your page content:

```tsx
// Full width (dashboards, tables) - 1280px max
<div className="content-full">...</div>

// Wide content (complex forms) - 1152px max
<div className="content-wide">...</div>

// Standard content (most forms) - 896px max
<div className="content-standard">...</div>
<div className="form-wrapper">...</div>  {/* Same as content-standard */}

// Narrow content (simple forms) - 672px max
<div className="content-narrow">...</div>
<div className="form-wrapper-narrow">...</div>
```

### Example Usage

**Simple Form:**

```tsx
<div className="form-wrapper-narrow">
  <form>...</form>
</div>
```

**Standard Form:**

```tsx
<div className="form-wrapper">
  <form>...</form>
</div>
```

**Data Table:**

```tsx
<div className="content-full">
  <table>...</table>
</div>
```

---

## 2. GLASSMORPHISM

```tsx
<div className="glass">Frosted glass effect</div>
<div className="glass-sm">Subtle glass</div>
<div className="glass-lg">Strong glass</div>
<div className="glass-dark">Dark glass (for dark backgrounds)</div>
```

---

## 3. BUTTONS

### Basic Buttons

```tsx
<button className="btn btn-primary">Primary Action</button>
<button className="btn btn-secondary">Secondary</button>
<button className="btn btn-ghost">Ghost Button</button>
<button className="btn btn-danger">Delete</button>
<button className="btn btn-success">Confirm</button>
<button className="btn btn-warning">Warning</button>
```

### Button Sizes

```tsx
<button className="btn btn-primary btn-sm">Small</button>
<button className="btn btn-primary">Medium (default)</button>
<button className="btn btn-primary btn-lg">Large</button>
<button className="btn btn-primary btn-xl">Extra Large</button>
```

---

## 4. CARDS

### Standard Cards

```tsx
<div className="card card-md">
  <h3>Card Title</h3>
  <p>Card content</p>
</div>
```

### Glass Cards

```tsx
<div className="card-glass card-lg">
  <h3>Glassmorphism Card</h3>
</div>

<div className="card-glass-dark card-md">
  <h3>Dark Glass Card</h3>
</div>
```

### Card Sizes

```tsx
<div className="card card-sm">Small padding</div>
<div className="card card-md">Medium padding (standard)</div>
<div className="card card-lg">Large padding</div>
```

---

## 5. INPUTS & FORMS

### Text Inputs

```tsx
<label className="label">Email Address</label>
<input type="email" className="input" placeholder="your@email.com" />

<label className="label">Large Input</label>
<input type="text" className="input input-lg" />

<label className="label label-error">Error Field</label>
<input type="text" className="input input-error" />

<label className="label">Success Field</label>
<input type="text" className="input input-success" />
```

### Glass Inputs (for dark backgrounds)

```tsx
<input type="text" className="input-glass" placeholder="Enter text..." />
```

---

## 6. BADGES

```tsx
<span className="badge badge-primary">Primary</span>
<span className="badge badge-success">Success</span>
<span className="badge badge-warning">Warning</span>
<span className="badge badge-danger">Danger</span>
<span className="badge badge-info">Info</span>
<span className="badge badge-glass">Glass Badge</span>
```

---

## 7. GRADIENTS

### Background Gradients

```tsx
<div className="gradient-primary">Primary Gradient</div>
<div className="gradient-accent">Accent Gradient</div>
<div className="gradient-success">Success Gradient</div>
<div className="gradient-warning">Warning Gradient</div>
<div className="gradient-danger">Danger Gradient</div>
```

### Gradient Text

```tsx
<h1 className="text-gradient-primary">Gradient Title</h1>
<h2 className="text-gradient-accent">Accent Title</h2>
```

---

## 8. HOVER EFFECTS

```tsx
<div className="hover-lift">Lifts on hover</div>
<div className="hover-lift-sm">Small lift on hover</div>
<div className="hover-scale">Scales up on hover</div>
<div className="hover-scale-sm">Small scale on hover</div>
```

---

## 9. ANIMATIONS

```tsx
<div className="animate-fadeIn">Fades in</div>
<div className="animate-slideInUp">Slides up</div>
<div className="animate-slideInDown">Slides down</div>
<div className="animate-float">Floating effect</div>
<div className="animate-float-slow">Slow floating</div>
<div className="animate-pulse-glow">Pulsing glow</div>
<div className="animate-shimmer">Shimmer effect</div>
```

---

## 10. UTILITY CLASSES

### Text Truncation

```tsx
<p className="text-truncate-2">Truncates to 2 lines...</p>
<p className="text-truncate-3">Truncates to 3 lines...</p>
```

### Shadow Effects

```tsx
<div className="shadow-glow">Glowing shadow</div>
<div className="shadow-glow-lg">Large glow</div>
<div className="shadow-glass">Glass shadow</div>
```

---

## COMPLETE PAGE EXAMPLE

```tsx
export default function MyFormPage() {
  return (
    <div className="form-wrapper">
      {' '}
      {/* Centered, max-width container */}
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-gradient-primary mb-2">Create New Item</h1>
        <p className="text-gray-600">Fill in the details below</p>
      </div>
      {/* Form Card */}
      <div className="card card-md animate-slideInUp">
        <form className="space-y-6">
          {/* Input Field */}
          <div>
            <label className="label">Item Name</label>
            <input type="text" className="input" placeholder="Enter name" />
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button type="submit" className="btn btn-primary flex-1">
              Create Item
            </button>
            <button type="button" className="btn btn-secondary flex-1">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

---

## MIGRATION FROM OLD CODE

### Old Pattern (TOO WIDE):

```tsx
<div className="space-y-6">
  <div className="bg-white rounded-lg shadow p-6">
    <form>...</form>
  </div>
</div>
```

### New Pattern (CENTERED & COMPACT):

```tsx
<div className="form-wrapper">
  <div className="card card-md">
    <form>...</form>
  </div>
</div>
```

---

## TAILWIND CLASSES STILL AVAILABLE

You can still use all Tailwind utility classes alongside these custom classes:

- `mx-auto`, `p-4`, `text-center`, etc.
- Combine as needed: `<div className="card card-md hover-lift">`

---

## FILE STRUCTURE

```
app/
  └── globals.css  ← Single source of truth
      ├── Layout System
      ├── Glassmorphism
      ├── Buttons
      ├── Cards
      ├── Inputs
      ├── Badges
      ├── Gradients
      ├── Animations
      └── Utilities
```

**Deleted files** (were not imported, 100% duplicates):

- ❌ `styles/animations.css`
- ❌ `styles/premium.css`

---

## BENEFITS

✅ Single source of truth  
✅ Zero duplication  
✅ Easy to find styles  
✅ Consistent across all pages  
✅ Proper layout system  
✅ Clean and organized  
✅ Well documented
