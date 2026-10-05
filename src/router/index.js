// src/router/index.js – HTML5 History API Router for Areos-AI

class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    this.contentTarget = null;
    this.onRouteChanged = null;

    // Listen to browser Back/Forward navigation
    window.addEventListener('popstate', () => {
      this.handleRoute(window.location.pathname, false);
    });

    // Intercept link clicks with data-link attribute
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[data-link]');
      if (link) {
        e.preventDefault();
        const href = link.getAttribute('href');
        if (href) {
          this.navigate(href);
        }
      }
    });
  }

  // Register a route handler
  register(path, pageComponent) {
    this.routes[path] = pageComponent;
  }

  // Initialize router with target container element
  init(containerId, onRouteChanged) {
    this.contentTarget = document.getElementById(containerId);
    this.onRouteChanged = onRouteChanged;
    
    // Initial route handling
    const initialPath = window.location.pathname;
    this.handleRoute(initialPath, false);
  }

  // Programmatically navigate to a path
  navigate(path) {
    if (window.location.pathname === path) return;
    window.history.pushState(null, null, path);
    this.handleRoute(path, true);
  }

  // Handle current route rendering
  handleRoute(path, isPush = true) {
    // Redirect root to /overview
    if (path === '/' || path === '') {
      window.history.replaceState(null, null, '/overview');
      path = '/overview';
    }

    // Strip trailing slash if present
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
    }

    const pageComponent = this.routes[path] || this.routes['*'];
    this.currentRoute = path;

    const scrollContainer = document.getElementById('pageScrollContainer');
    const isAI = path === '/ai-intelligence';

    // Toggle scroll container padding & overflow for full-screen AI chat
    if (scrollContainer) {
      if (isAI) {
        scrollContainer.className = 'flex-1 overflow-hidden p-0 bg-obsidian-bg relative min-h-0 flex flex-col';
      } else {
        scrollContainer.className = 'flex-1 overflow-y-auto px-4 py-3 bg-obsidian-bg relative min-h-0';
      }
    }

    if (this.contentTarget && pageComponent) {
      // Apply subtle page transition
      this.contentTarget.style.opacity = '0';
      this.contentTarget.style.transform = 'translateY(4px)';
      this.contentTarget.style.transition = 'opacity 120ms ease-out, transform 120ms ease-out';

      setTimeout(() => {
        // Render new page content
        this.contentTarget.innerHTML = pageComponent.render();
        if (pageComponent.mount) {
          pageComponent.mount();
        }

        // Scroll to top on route change
        window.scrollTo(0, 0);
        if (scrollContainer) {
          scrollContainer.scrollTop = 0;
        }

        // Animate in
        this.contentTarget.style.opacity = '1';
        this.contentTarget.style.transform = 'translateY(0)';

        // Trigger callback for layout headers and bottom tabs
        if (this.onRouteChanged) {
          this.onRouteChanged(path);
        }
      }, 120);
    }
  }
}

export const router = new Router();
