// src/main.js – Areos-AI Mobile-First App Bootstrapper & Shell Manager

// Phosphor Icons
import '@phosphor-icons/web/regular';
import '@phosphor-icons/web/fill';
import '@phosphor-icons/web/bold';

import { router } from './router/index.js';
import { AppHeader } from './components/AppHeader.js';
import { BottomTabBar } from './components/BottomTabBar.js';
import { MoreSheet } from './components/MoreSheet.js';
import { SearchSheet } from './components/SearchSheet.js';
import { Toast } from './components/Toast.js';

// Import Page Components
import { OverviewPage } from './pages/OverviewPage.js';
import { MarketsPage } from './pages/MarketsPage.js';
import { PortfolioPage } from './pages/PortfolioPage.js';
import { StartupsPage } from './pages/StartupsPage.js';
import { AIIntelligencePage } from './pages/AIIntelligencePage.js';
import { AnalyticsPage } from './pages/AnalyticsPage.js';
import { WatchlistPage } from './pages/WatchlistPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { NotFoundPage } from './pages/NotFoundPage.js';

// Expose globals for component event handlers
window.Toast = Toast;
window.AppHeader = AppHeader;
window.BottomTabBar = BottomTabBar;
window.MoreSheet = MoreSheet;
window.SearchSheet = SearchSheet;
window.router = router;

// App Bootstrapping
window.addEventListener('DOMContentLoaded', () => {
  // Service Worker Handling (Prevent stale UI during development)
  if ('serviceWorker' in navigator) {
    if (import.meta.env.DEV) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
    } else {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.warn('Service worker registration failed:', err);
        });
      });
    }
  }

  // 1. Mount Persistent Mobile App Shell
  const appHeaderContainer = document.getElementById('appHeaderContainer');
  const bottomTabBarContainer = document.getElementById('bottomTabBarContainer');
  const moreSheetContainer = document.getElementById('moreSheetContainer');
  const searchSheetContainer = document.getElementById('searchSheetContainer');
  const toastContainer = document.getElementById('toastContainer');

  const initialPath = window.location.pathname || '/overview';

  if (appHeaderContainer) {
    appHeaderContainer.innerHTML = AppHeader.render(initialPath);
    AppHeader.attachListeners();
  }

  if (bottomTabBarContainer) {
    bottomTabBarContainer.innerHTML = BottomTabBar.render(initialPath);
    BottomTabBar.attachListeners();
  }

  if (moreSheetContainer) {
    moreSheetContainer.innerHTML = MoreSheet.render();
    MoreSheet.mount();
  }

  if (searchSheetContainer) {
    searchSheetContainer.innerHTML = SearchSheet.render();
    SearchSheet.mount();
  }

  if (toastContainer) {
    toastContainer.innerHTML = Toast.render();
  }

  // 2. Register Application Routes
  router.register('/overview', OverviewPage);
  router.register('/markets', MarketsPage);
  router.register('/portfolio', PortfolioPage);
  router.register('/startups', StartupsPage);
  router.register('/ai-intelligence', AIIntelligencePage);
  router.register('/analytics', AnalyticsPage);
  router.register('/watchlist', WatchlistPage);
  router.register('/settings', SettingsPage);
  router.register('*', NotFoundPage);

  // 3. Initialize Router with Callback for Active State Updates
  router.init('pageContent', (activePath) => {
    AppHeader.update(activePath);
    BottomTabBar.update(activePath);
  });

  // 4. Global Keyboard Shortcuts (⌘K & Escape)
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      SearchSheet.open();
    }
    if (e.key === 'Escape') {
      SearchSheet.close();
      MoreSheet.close();
      window.HistoryDrawer?.close();
    }
  });
});
