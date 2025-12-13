# PR9 - Reklamy: sloty + tryb „static" + przygotowanie pod AdSense

## Cel
Gotowe miejsce na reklamę oraz możliwość włączenia stałego banera z config.

## Zmiany

### 1. config.js
Dodano kompleksową konfigurację reklam:

```javascript
ads: {
  enabled: true,                    // Włącz/wyłącz reklamy
  provider: 'static',               // 'static', 'adsense', lub 'none'
  static: {
    slots: {
      top: {
        enabled: true,              // Włącz/wyłącz slot
        link: 'https://example.com',
        image: 'https://via.placeholder.com/728x90?text=Ad+Top'
      },
      sidebar: { ... },
      bottom: { ... }
    }
  },
  adsense: {
    client: '',                     // Dla przyszłej integracji
    slots: { ... }
  }
}
```

### 2. styles.css
- Dodano klasę `.is-hidden` z `display: none !important`
- Dodano style dla obrazów w slotach reklamowych
- Style responsywne dla wszystkich slotów (#adTop, #adSidebar, #adBottom)

### 3. app.js
Dodano nowe funkcje:

#### `isValidUrl(url)`
- Waliduje URL przed użyciem
- Akceptuje tylko protokoły `http:` i `https:`
- Blokuje niebezpieczne protokoły (`javascript:`, `data:`, `file:`, etc.)

#### `initAdSlots()`
- Inicjalizuje sloty reklamowe na podstawie konfiguracji
- Ukrywa sloty gdy `ads.enabled = false`
- Sprawdza zgodę użytkownika (consent) przed załadowaniem reklam
- Kieruje do odpowiedniego handlera w zależności od providera

#### `renderStaticAds(adSlots, staticConfig)`
- Renderuje statyczne reklamy (link + obrazek)
- Waliduje URL przed renderowaniem
- Ukrywa sloty z `enabled: false`
- Tworzy bezpieczne elementy DOM (a + img)

#### `loadAdSense()`
- Funkcja stub dla przyszłej integracji AdSense
- Loguje informacje o konfiguracji
- Przygotowana do rozbudowy o właściwe API AdSense

### 4. test-ads.html
Interaktywna strona testowa z przyciskami do testowania:
- Reklamy wyłączone
- Reklamy statyczne włączone
- Provider "none"
- Stub AdSense

## Bezpieczeństwo i Prywatność

### Bezpieczeństwo
✓ Walidacja URL zapobiega wstrzyknięciu złośliwego kodu
✓ Blokowanie niebezpiecznych protokołów (javascript:, data:, file:)
✓ Bezpieczne tworzenie elementów DOM (createElement zamiast innerHTML)
✓ Atrybuty `rel="noopener noreferrer"` dla linków zewnętrznych

### Prywatność
✓ Sprawdzanie zgody użytkownika przed załadowaniem reklam
✓ Reklamy ukryte dopóki użytkownik nie wyrazi zgody
✓ Automatyczne załadowanie po przyznaniu zgody

## Testy
Wszystkie testy przeszły pomyślnie:
- ✓ Reklamy wyłączone → wszystkie sloty ukryte
- ✓ Reklamy statyczne → pokazują obrazki w włączonych slotach
- ✓ Provider "none" → wszystkie sloty ukryte
- ✓ AdSense stub → funkcja wywoływana poprawnie
- ✓ Walidacja URL → blokuje niebezpieczne URL
- ✓ Sprawdzanie zgody → reklamy ukryte do czasu zgody

## Skanowanie bezpieczeństwa
CodeQL: **0 alertów** - brak podatności

## DoD ✓
- ✓ Statyczna reklama działa z samego config (bez zmian w kodzie)
- ✓ Sloty ukryte gdy ads off
- ✓ Funkcja `loadAdSense()` przygotowana pod przyszłość

## Sposób użycia

### Włączenie statycznych reklam
W `config.js`:
```javascript
ads: {
  enabled: true,
  provider: 'static',
  static: {
    slots: {
      top: {
        enabled: true,
        link: 'https://twoja-strona.com',
        image: 'https://twoja-strona.com/reklama.jpg'
      }
    }
  }
}
```

### Wyłączenie reklam
```javascript
ads: {
  enabled: false
}
```

### Przygotowanie pod AdSense (przyszłość)
```javascript
ads: {
  enabled: true,
  provider: 'adsense',
  adsense: {
    client: 'ca-pub-TWOJID'
  }
}
```

## Pliki zmienione
- `config.js` - dodano konfigurację ads
- `styles.css` - dodano .is-hidden i style dla obrazków
- `app.js` - dodano funkcje initAdSlots, renderStaticAds, loadAdSense, isValidUrl
- `test-ads.html` - utworzono stronę testową

## Backward Compatibility
⚠️ Usunięto pole `adsEnabled` z głównego poziomu config.
Zastąpiono strukturą `ads.enabled`.

Jeśli używałeś:
```javascript
adsEnabled: true
```

Teraz używaj:
```javascript
ads: { enabled: true }
```
