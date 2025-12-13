# PR9 - Ad Slots Implementation

## Overview
This PR implements a complete ad slot system for the Kalendarz Polski application with support for static ads and preparation for future AdSense integration.

## Quick Start

### Enable Static Ads
Edit `config.js`:
```javascript
ads: {
  enabled: true,
  provider: 'static',
  static: {
    slots: {
      top: {
        enabled: true,
        link: 'https://your-site.com',
        image: 'https://your-site.com/ad-top.jpg'
      },
      sidebar: {
        enabled: true,
        link: 'https://your-site.com',
        image: 'https://your-site.com/ad-sidebar.jpg'
      },
      bottom: {
        enabled: true,
        link: 'https://your-site.com',
        image: 'https://your-site.com/ad-bottom.jpg'
      }
    }
  }
}
```

### Disable All Ads
```javascript
ads: {
  enabled: false
}
```

### Test the Implementation
Open `test-ads.html` in your browser to test:
- Ads disabled scenario
- Static ads enabled scenario
- Provider "none" scenario
- AdSense stub scenario

## Features

### ✅ Configuration-based
- All ad settings in `config.js`
- No code changes needed to update ads
- Per-slot enable/disable control

### ✅ Security
- URL validation (only http/https allowed)
- Blocks dangerous protocols (javascript:, data:, file:)
- Safe DOM manipulation
- Secure link attributes (noopener noreferrer)

### ✅ Privacy
- Respects user consent
- Ads hidden until consent granted
- Automatic loading after consent

### ✅ Flexible
- Support for multiple ad providers
- Easy to add new providers
- AdSense stub ready for future integration

## Available Ad Providers

### 1. `static`
Simple static ads with link and image:
```javascript
provider: 'static',
static: {
  slots: {
    top: { enabled: true, link: '...', image: '...' }
  }
}
```

### 2. `none`
Hides all ad slots:
```javascript
provider: 'none'
```

### 3. `adsense` (stub)
Prepared for future AdSense integration:
```javascript
provider: 'adsense',
adsense: {
  client: 'ca-pub-XXXXXXXXXXXXXXXX',
  slots: {
    top: 'slot-id-here',
    sidebar: 'slot-id-here',
    bottom: 'slot-id-here'
  }
}
```

## Ad Slots

### Top Ad (`#adTop`)
- Location: Above main content
- Recommended size: 728x90 (leaderboard)
- Visibility: Always visible on desktop

### Sidebar Ad (`#adSidebar`)
- Location: Left sidebar, below statistics
- Recommended size: 300x250 (medium rectangle)
- Visibility: Hidden on mobile

### Bottom Ad (`#adBottom`)
- Location: Below main content
- Recommended size: 728x90 (leaderboard)
- Visibility: Always visible

## Technical Details

### Files Modified
1. **config.js** - Added ads configuration structure
2. **styles.css** - Added .is-hidden class and ad slot styles
3. **app.js** - Added ad initialization and rendering functions
4. **index.html** - Already had ad slot elements (no changes)

### New Functions in app.js

#### `isValidUrl(url)`
Validates URLs for security:
- Accepts only http:// and https://
- Rejects javascript:, data:, file:, etc.

#### `initAdSlots()`
Initializes ad slots:
- Checks if ads are enabled
- Verifies user consent
- Routes to appropriate provider handler

#### `renderStaticAds(adSlots, staticConfig)`
Renders static ads:
- Validates all URLs
- Creates safe DOM elements
- Hides disabled slots

#### `loadAdSense()`
Stub for future AdSense:
- Logs configuration
- Ready for real implementation

## Security Analysis

### CodeQL Results
✅ **0 vulnerabilities found**

### Security Measures
1. **URL Validation**: All URLs validated before use
2. **Protocol Filtering**: Only http/https allowed
3. **Safe DOM**: Using createElement instead of innerHTML
4. **Link Security**: rel="noopener noreferrer" on all links
5. **Input Validation**: Type checking and error handling

## Privacy Compliance

### GDPR/Consent Support
- ✅ Checks consent before loading ads
- ✅ Hides ads until user accepts
- ✅ Respects consent settings
- ✅ Works with existing consent banner

## Testing

### Automated Tests
All 33 validation tests pass:
- ✅ Configuration structure
- ✅ CSS classes
- ✅ JavaScript functions
- ✅ HTML elements
- ✅ Security measures
- ✅ Privacy compliance

### Manual Testing
Use `test-ads.html` for interactive testing:
1. Test ads disabled
2. Test static ads enabled
3. Test provider "none"
4. Test AdSense stub

## Browser Compatibility
- ✅ Modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Mobile responsive
- ✅ No external dependencies

## Performance
- Minimal impact on page load
- No external scripts loaded (for static ads)
- Lazy initialization after consent

## Future Enhancements
Ready for:
- [ ] Real AdSense integration
- [ ] Other ad networks (e.g., Media.net, PropellerAds)
- [ ] A/B testing different ads
- [ ] Ad performance analytics

## Troubleshooting

### Ads not showing?
1. Check `ads.enabled` in config.js
2. Check if consent is granted
3. Check browser console for errors
4. Verify URLs are valid (http/https)

### Invalid URL error?
- URLs must start with http:// or https://
- Check for typos in config.js
- Ensure no special characters in URLs

### Ads hidden on mobile?
- Sidebar ad is hidden on mobile by design
- Check responsive CSS if needed

## Support
For issues or questions:
- Check CHANGELOG-PR9.md for detailed changes
- Review test-ads.html for examples
- Check browser console for error messages

## License
Same as parent project.
