import React from 'react';
import { renderToString } from 'react-dom/server';
import { Site } from './Site';
import { renderSeoHead, resolvePage, safeJson, YEAR_MIN, YEAR_MAX, indexedYears, SITE_URL, yearPath, type PageData } from './utils/seo';
export { getPlanningDate } from './utils/vacationSuggestions';
export { YEAR_MIN, YEAR_MAX, indexedYears, SITE_URL, yearPath };
export function render(data: PageData) {
  return {
    html: renderToString(<React.StrictMode><Site {...data} /></React.StrictMode>),
    head: renderSeoHead(resolvePage(data.path), data.buildYear),
    data: `<script id="page-data" type="application/json">${safeJson(data)}</script>`
  };
}
