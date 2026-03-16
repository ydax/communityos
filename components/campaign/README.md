# Campaign Components

Water Warrior campaign components for Davis Jones for Mayor.

## Components

### DonateButton

Water Warrior branded button linking to Anedot donation platform.

**Location**: `DonateButton.js`

**Features**:
- Water Warrior Blue (#0077be) branding
- Opens Anedot page in new tab
- Accessible (keyboard navigation, focus states)
- Responsive hover effects

**Usage**:

```javascript
import DonateButton from '@/components/campaign/DonateButton';

// Standard usage:
<DonateButton />

// Custom URL:
<DonateButton href="https://secure.anedot.com/davis-jones-for-mayor/water-warrior-premium" />

// Full width for mobile:
<DonateButton fullWidth />

// Custom size:
<DonateButton size="medium" />
```

**Props**:
- `href` (string): Anedot donation URL (default: main campaign page)
- `variant` (string): MUI Button variant (default: 'contained')
- `size` (string): MUI Button size (default: 'large')
- `fullWidth` (boolean): Full width button (default: false)
- `className` (string): Additional CSS classes

---

### WaterWarriorQRCode

QR code display component for "Coffee Coalition" meetings and printed materials.

**Location**: `WaterWarriorQRCode.js`

**Features**:
- Water Warrior mascot branding (💧🛡️)
- QR code display (placeholder or custom image)
- "Coffee Coalition" script for in-person meetings
- Compliance disclosure included
- Print-friendly design

**Usage**:

```javascript
import WaterWarriorQRCode from '@/components/campaign/WaterWarriorQRCode';

// Basic QR display:
<WaterWarriorQRCode />

// With custom QR image:
<WaterWarriorQRCode qrCodeImageUrl="/images/donate-qr.png" />

// For printing (no instructions):
<WaterWarriorQRCode showInstructions={false} />
```

**Props**:
- `donateUrl` (string): URL to encode in QR code (default: main campaign page)
- `qrCodeImageUrl` (string): Pre-generated QR code image URL (optional, shows placeholder if not provided)
- `showInstructions` (boolean): Display scan instructions and "Coffee Coalition" script (default: true)

**Generating QR Codes**:

1. Go to [QR Code Generator](https://www.qr-code-generator.com/)
2. Enter Anedot URL: `https://secure.anedot.com/davis-jones-for-mayor/donate`
3. Download high-resolution PNG
4. Save to `/public/images/donate-qr.png`
5. Reference in component: `qrCodeImageUrl="/images/donate-qr.png"`

---

## Compliance Notes

All campaign components follow Texas election law requirements:

- **Disclosure Text**: "Pol. Adv. Pd. for by Davis Jones Campaign" included in all materials
- **$500 Contribution Limit**: Enforced by Anedot platform (hard cap configured)
- **Clean Server Rule**: Campaign components separate from business code
- **Water Warrior Branding**: Consistent with campaign visual identity

See [`docs/campaign/02-compliance-checklist.md`](../../../docs/campaign/02-compliance-checklist.md) for full compliance requirements.

---

## Design System

### Water Warrior Blue

**Primary Color**: `#0077be`  
**Hover State**: `#005a94`  
**Usage**: Buttons, links, primary actions

### Typography

**Font Weight**: Bold (700) for calls-to-action  
**Text Transform**: UPPERCASE for button text  
**Letter Spacing**: 0.5px for readability

### Spacing

**Button Padding**: `theme.spacing(1.5, 4)` = 12px top/bottom, 32px left/right  
**Component Margin**: `theme.spacing(2)` = 16px standard spacing

---

## Related Documentation

- **Anedot Integration Guide**: [`docs/campaign/04-anedot-integration-guide.md`](../../../docs/campaign/04-anedot-integration-guide.md)
- **Campaign Context**: [`docs/campaign/CAMPAIGN_CONTEXT.md`](../../../docs/campaign/CAMPAIGN_CONTEXT.md)
- **Tech Stack**: [`docs/campaign/01-campaign-tech-stack.md`](../../../docs/campaign/01-campaign-tech-stack.md)
- **Messaging Framework**: [`docs/campaign/03-messaging-framework.md`](../../../docs/campaign/03-messaging-framework.md)

---

**Campaign**: Davis Jones for Mayor  
**Brand**: Water Warriors  
**Tech Stack**: Next.js 14 + Material UI v4 + Firebase  
**Principle**: Clean money, transparent fundraising, River first
