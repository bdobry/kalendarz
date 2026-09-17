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

The workflow rebuilds weekly to refresh the build year, featured years and sitemap. Years 2024 through build year +5 are indexable; other supported years remain usable with `noindex, follow`. The root never redirects to a year. The personal planner supports dates from 2024 onward; historical calendars retain the app's existing holiday model.

See [docs/SEO.md](docs/SEO.md) for keyword targeting, Cloudflare configuration, publication checks and Search Console measurement. Run `node scripts/check-live-seo.mjs` **after** publishing to verify the actual public site. Repository tests do not prove that Cloudflare and GitHub Pages have deployed the new HTML.

## Planer urlopu

`/kalkulator-urlopu/` is now the personal annual planner and its landing page. The existing canonical URL remains. It stores a versioned plan in `localStorage` (`nierobie.personal-plan.v1`): dates across years, annual budgets, planned blood/plasma donations and school overlay preferences. Users can undo the last change and export/import a JSON backup. Calendar calculations assume Monday–Friday work and distinguish paid leave from donation release. No plan data is sent to analytics; the analytics page URL omits query strings/fragments.

Year calendars and strategy cards link into the planner. Strategy dates are passed in the URL fragment, immediately added and saved without overwriting an existing plan. Users can undo the addition; the fragment is consumed to avoid reapplying it on reload.

### School calendar data

- `npm run data:school` fetches official MEN winter announcements and extracts summer dates from MEN PDFs. It validates the data and retains the last valid records when a source fails.
- `npm run data:school:check` performs the same refresh but exits nonzero on network/parser errors, for CI monitoring.
- Every build refreshes data. For a reproducible offline build, use `SCHOOL_DATA_OFFLINE=1 npm run build`.
- The deployment workflow runs weekly on Monday at 04:15 UTC, checks sources in strict mode, commits the verified snapshot on scheduled/manual runs, tests and deploys the result. Its build job needs repository `contents: write`; branch protection must permit the bot commit. A source failure fails the workflow and keeps the previously deployed site.
- `data/schoolBreaks.json` is the committed source of truth. Each winter/summer record carries a MEN source URL and verification date. The build publishes `/data/school-breaks.json`; `utils/schoolBreaks.ts` is the shared accessor for future SEO pages. Unpublished dates are never extrapolated.
- The `pdfjs-dist` dependency runs only in the data sync script, never in the browser bundle.

Scope and decisions: [docs/MOJ-PLAN-NIEROBIENIA.md](docs/MOJ-PLAN-NIEROBIENIA.md).

Donation validation uses the ordinary intervals from Annex 3 of Dz.U. 2025/756 and rolling 12-month limits. Blood donor profiles set a 4/6 donation limit; an unspecified profile uses 4. Calendar clicks, form edits, profile changes and merged imports are validated. Legacy conflicting entries remain visible for repair. See the implementation document for date-only interval rounding and the scope of these checks.
