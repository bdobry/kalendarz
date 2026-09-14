import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { Site } from './Site';
import { getSeo, resolvePage, type PageData } from './utils/seo';
import './styles.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Could not find root element');
const serialized = document.getElementById('page-data');
const data: PageData = serialized ? JSON.parse(serialized.textContent!) : { path: window.location.pathname, buildYear: new Date().getFullYear() };
const app = <React.StrictMode><Site {...data} /></React.StrictMode>;
if (serialized) hydrateRoot(rootElement, app);
else {
  document.title = getSeo(resolvePage(data.path), data.buildYear).title;
  createRoot(rootElement).render(app);
}
