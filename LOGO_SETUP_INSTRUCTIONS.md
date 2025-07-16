# BuildLedger Logo Setup Instructions

I've updated your BuildLedger application to use the proper logo files. Here's what you need to do to complete the logo integration:

## Files to Replace

Replace the following placeholder files in the `public/` directory with your actual BuildLedger logo images:

### 1. Main Logo Files
- **`public/buildledger-logo.svg`** - Main logo with text (used for banners/headers)
  - Convert your main BuildLedger logo to SVG format
  - Recommended width: 200px, height: 60px
  - Should include both the icon and "BuildLedger" text

- **`public/buildledger-icon.svg`** - Icon only (used in navigation)
  - Convert your BuildLedger icon to SVG format  
  - Size: 32x32px
  - Should be the icon/symbol only, without text

### 2. Favicon and App Icons
- **`public/favicon.ico`** - Browser favicon
  - Convert your icon to ICO format (16x16, 32x32, 48x48px)
  - Use online tools like favicon.io or realfavicongenerator.net

- **`public/apple-touch-icon.png`** - Apple device icon
  - PNG format, 180x180px
  - High resolution version of your icon

- **`public/icon-192.png`** - PWA icon (small)
  - PNG format, 192x192px
  - For Progressive Web App support

- **`public/icon-512.png`** - PWA icon (large)
  - PNG format, 512x512px
  - For Progressive Web App support

### 3. Dashboard Screenshot
- **`public/construction-invoicing-dashboard.png`** - Hero section image
  - Screenshot of your actual dashboard/application
  - Recommended size: 1200x675px (16:9 aspect ratio)
  - Used in the hero section to showcase the app

## Conversion Tools

### For SVG Conversion:
- Adobe Illustrator
- Inkscape (free)
- Online converters: convertio.co, cloudconvert.com

### For ICO Favicon:
- favicon.io
- realfavicongenerator.net
- icoconvert.com

### For PNG Resizing:
- Photoshop
- GIMP (free)
- Online tools: resizeimage.net, iloveimg.com

## What's Already Updated

I've already updated the following components to use your logos:

1. **Header Component** (`src/components/header.tsx`)
   - Now uses `/buildledger-icon.svg` instead of the HardHat icon
   - Displays your logo next to the "BuildLedger" text

2. **Navigation Component** (`src/components/layout/Navbar.tsx`)
   - Also uses `/buildledger-icon.svg` in the dashboard navigation
   - Consistent branding across the app

3. **App Metadata** (`src/app/layout.tsx`)
   - Updated to reference your favicon and app icons
   - Proper icon configuration for different devices

## Color Considerations

Your BuildLedger logos use an orange color scheme (#FF8C00). The current placeholders use this color, but make sure your actual logos:
- Work well on both light and dark backgrounds
- Maintain good contrast for accessibility
- Consider creating dark/light variants if needed

## Testing

After replacing the files:
1. Clear your browser cache
2. Check that logos appear correctly on both light and dark themes
3. Test on mobile devices to ensure icons display properly
4. Verify favicon appears in browser tabs

## Next Steps

1. Replace all placeholder files with your actual BuildLedger images
2. Test the application to ensure logos display correctly
3. Consider creating a favicon.png manifest for PWA support if needed
4. Update any other brand assets throughout the application as needed

The logo integration is now ready - just replace the placeholder files with your actual BuildLedger assets!