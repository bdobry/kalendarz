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
