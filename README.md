## Features

-   **Interactive Year Navigation**: Browse and analyze calendar years from 1991 to 2099.
-   **Holiday Optimization**: Visual indicators for public holidays, weekends, and bridge days.
-   **Bridge Day Detection**: Automatically highlights days you should take off to create extended weekends ("long weekends").
-   **Efficiency Score**: A grading system (Class A, B, C...) that quantifies how favorable a year is for maximizing free time.
-   **Labor Law Support**: Toggle "Odbiór za sobotę" (Saturday holiday redemption) to calculate additional days off due to holidays falling on Saturdays, in accordance with Polish labor law.
-   **Comprehensive Stats**: Detailed breakdown of holidays falling on workdays vs. weekends, effective days off, and lost days.

## Tech Stack

This project is built with modern web technologies:

-   **Framework**: [React 19](https://react.dev/)
-   **Build Tool**: [Vite](https://vitejs.dev/)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)

## Getting Started

### Prerequisites

-   Node.js
-   npm

### Installation

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```

### Local Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the application in your browser.

### Building for Production

Build the assets for deployment:

```bash
npm run build
```

The output will be in the `dist` directory.

## Deployment

The project is configured for deployment to GitHub Pages.
Review `.github/workflows/deploy.yml` for the deployment pipeline configuration.

## Project Structure

-   `src/components`: React components for the UI (MonthView, StatsGrid, HolidayList, etc.).
-   `src/utils`: Logic for date calculations and Polish holiday rules (`dateUtils.ts`).
-   `src/types.ts`: TypeScript interfaces and enums used throughout the application.

## Static rendering and SEO

`npm run build` creates static HTML for the homepage, `/kalkulator-urlopu/`, all supported year directories and a real 404 page. It also generates the sitemap and validates canonical metadata, content and links. The browser hydrates this HTML; no Node server is required in production. Use trailing slashes in canonical links.

```sh
npm run typecheck
npm run test:run
npm run build
npx playwright install chromium
npm run test:e2e
node scripts/serve-static.mjs
```

The static preview runs on `http://127.0.0.1:4173` with real 404 responses. Vite's development preview is not a substitute for testing static-host HTTP status codes. On macOS you can use an installed Chrome for tests with `PLAYWRIGHT_CHROMIUM_EXECUTABLE='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:e2e`.

The workflow rebuilds monthly to refresh the build year, featured years and sitemap. Years 2024 through build year +5 are indexable; other supported years remain usable with `noindex, follow`. The root never redirects to a year. The standalone calculator supports dates from 2024 onward; historical calendars retain the app's existing holiday model.

See [docs/SEO.md](docs/SEO.md) for keyword targeting, Cloudflare configuration, publication checks and Search Console measurement. Run `node scripts/check-live-seo.mjs` **after** publishing to verify the actual public site. Repository tests do not prove that Cloudflare and GitHub Pages have deployed the new HTML.
