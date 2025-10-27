# Waterfall Editor - Clickable Templates Feature

## Overview
The **Common Waterfall Structures** section in the Waterfall Editor is now **fully clickable and functional**! Each template automatically loads pre-configured tier structures with one click.

## How to Use

1. Navigate to **Enterprise Portal** → **🤝 Syndication** → **💧 Waterfall Editor**
2. Scroll down to the **"Common Waterfall Structures"** section
3. Click any template card to instantly load that waterfall structure

## Available Templates

### 1. 📘 **Preferred Return (8%)**
**Click to load 4 pre-configured tiers:**

| Tier | Name | Threshold | Allocation | Beneficiary |
|------|------|-----------|------------|-------------|
| 1 | Return of Capital | 100% | 100% | All Investors |
| 2 | Preferred Return (8%) | 8% | 100% | All Investors |
| 3 | Profit Split (80/20) | 0% | 80% | All Investors |
| 4 | Sponsor Carry (20%) | 0% | 20% | Sponsors |

**Use Case:** Most common syndicate structure. Investors get their capital back first, then 8% preferred return, then profits split 80/20.

---

### 2. 🚀 **Catch-Up (20%)**
**Click to load 5 pre-configured tiers:**

| Tier | Name | Threshold | Allocation | Beneficiary |
|------|------|-----------|------------|-------------|
| 1 | Return of Capital | 100% | 100% | All Investors |
| 2 | LP Preferred Return (8%) | 8% | 100% | All Investors |
| 3 | GP Catch-Up (100%) | 0% | 100% | Sponsors |
| 4 | Final Split (80/20) | 0% | 80% | All Investors |
| 5 | Final Carry (20%) | 0% | 20% | Sponsors |

**Use Case:** After investors receive their preferred return, sponsors receive 100% of the next profits until they "catch up" to a 20% overall carry, then profits split 80/20.

---

### 3. 📊 **Tiered Carry**
**Click to load 6 pre-configured tiers:**

| Tier | Name | Threshold | Allocation | Beneficiary |
|------|------|-----------|------------|-------------|
| 1 | Return of Capital | 100% | 100% | All Investors |
| 2 | Tier 1 (0-8% IRR) | 8% | 100% | All Investors |
| 3 | Tier 2 Investors (8-15% IRR) | 15% | 75% | All Investors |
| 4 | Tier 2 Carry (20%) | 15% | 20% | Sponsors |
| 5 | Tier 3 Investors (15%+ IRR) | 0% | 70% | All Investors |
| 6 | Tier 3 Carry (25%) | 0% | 25% | Sponsors |

**Use Case:** Incentivizes higher performance. Sponsor carry increases from 20% to 25% when returns exceed 15% IRR.

---

### 4. 🌍 **European Waterfall**
**Click to load 4 pre-configured tiers:**

| Tier | Name | Threshold | Allocation | Beneficiary |
|------|------|-----------|------------|-------------|
| 1 | Fund-Level Return of Capital | 100% | 100% | Pro-Rata |
| 2 | Fund-Level Preferred (8%) | 8% | 100% | Pro-Rata |
| 3 | Remaining Profits (80%) | 0% | 80% | Pro-Rata |
| 4 | GP Carry (20%) | 0% | 20% | Sponsors |

**Use Case:** Distributions calculated at the fund level (entire portfolio) rather than deal-by-deal. Common in European private equity funds.

---

## Visual Enhancements

### Before (Non-functional):
- Templates looked clickable but did nothing
- No feedback on hover
- No indication of interactivity

### After (Fully Functional):
✅ **Hover Effects:**
- Border changes from gray to blue
- Background changes to light blue
- Text color changes to blue
- Arrow (→) appears on the right
- "Click to load template" message appears

✅ **Click Confirmation:**
- Alert message: "✅ Loaded 'template name' with X tiers"
- Tiers immediately populate in the editor above
- Total allocation automatically calculated

✅ **Warning Notice:**
- Yellow info box warns that loading a template replaces existing tiers
- Helps prevent accidental data loss

---

## Customization After Loading

After loading a template, you can:

1. **Modify any tier** - Edit names, thresholds, allocations
2. **Add more tiers** - Use the "Add New Tier" form
3. **Remove tiers** - Click "Remove" on any tier
4. **Reorder tiers** - Adjust distribution priority

The templates serve as **starting points** that you can customize to match your specific deal structure.

---

## Technical Details

### Implementation
- **Location**: `client/src/components/enterprise/WaterfallEditor.tsx`
- **Function**: `loadTemplate(templateName: string)`
- **Templates**: 4 pre-configured structures
- **State Management**: React useState for tier management
- **Validation**: Automatic allocation percentage calculation

### Code Structure
```typescript
const loadTemplate = (templateName: string) => {
  // Switch statement handles 4 templates
  // Each template defines complete tier structure
  // setTiers() replaces current tiers
  // Alert confirms successful load
};
```

---

## Best Practices

### When to Use Templates:
✅ Starting a new syndicate with standard terms  
✅ Learning waterfall structures  
✅ Quickly prototyping different distribution models  
✅ Ensuring proper tier sequencing  

### When to Customize:
✅ Unique deal structures  
✅ Non-standard carry percentages  
✅ Multiple preferred return hurdles  
✅ Complex multi-tier distributions  

---

## Summary

The Common Waterfall Structures are now **100% functional and clickable**! They provide:

- ⚡ **Instant setup** - One click loads complete tier structure
- 🎯 **Industry standards** - 4 proven waterfall models
- 🎨 **Professional design** - Clear visual feedback
- ✏️ **Fully editable** - Customize after loading
- 🔒 **Safe operation** - Warning before overwriting existing work

**Try it out:** Enterprise Portal → Syndication → Waterfall Editor → Click any template! 🎉
