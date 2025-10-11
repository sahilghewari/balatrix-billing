# Balatrix Billing Dashboard - Frontend

> A world-class, professional telecom billing dashboard built with React, Vite, and TailwindCSS.

## 🚀 Project Overview

This is a comprehensive, production-ready frontend dashboard for a telecom billing system with:

- **Modern Tech Stack**: React 18+, Vite, TailwindCSS, Zustand, TanStack Query
- **Enterprise-Grade Design**: Professional UI/UX matching industry leaders  
- **Full Feature Set**: Authentication, Dashboard, Billing, Subscriptions, Usage Analytics
- **Performance Optimized**: Code splitting, lazy loading, optimized bundles
- **Responsive Design**: Mobile-first, works on all devices

## 🚦 Quick Start

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server
npm run dev

# Build for production
npm run build
```

The app will be available at `http://localhost:3000`

## 📁 Project Structure

```
src/
├── components/          # Reusable components
│   ├── ui/             # Base UI components (Button, Input, Card, etc.)
│   ├── layout/         # Layout components (Header, Sidebar, etc.)
│   ├── common/         # Common components (ErrorBoundary, etc.)
│   └── features/       # Feature-specific components
├── pages/              # Page components (Dashboard, Login, etc.)
├── hooks/              # Custom React hooks
├── services/           # API services
├── stores/             # Zustand stores
├── utils/              # Utility functions
├── config/             # Configuration files
└── styles/             # Global styles
```

## 🛠️ Tech Stack

- React 18+ & React Router v6
- Vite for build tooling
- TailwindCSS 4 for styling
- Zustand for state management
- TanStack Query for data fetching
- React Hook Form + Zod for forms
- Axios for API calls
- Lucide React for icons
- Recharts for data visualization

## 🎨 Design System

### UI Components
All components are in `src/components/ui/`:
- `Button` - Multiple variants and sizes
- `Input` - Form inputs with validation
- `Card` - Container component
- `Badge` - Status indicators
- `Modal` - Dialog component
- And many more...

### Import Example
```javascript
import { Button, Input, Card } from '@components/ui';
```

## 📡 API Integration

API services are in `src/services/`:
- `auth.js` - Authentication
- `billing.js` - Billing operations
- `subscription.js` - Subscription management
- `usage.js` - Usage tracking

### Configuration
Set your API base URL in `.env`:
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

## 🔐 Authentication

Uses JWT token-based authentication with automatic token refresh.

```javascript
import { useAuth } from '@hooks/useAuth';

function MyComponent() {
  const { user, login, logout, isAuthenticated } = useAuth();
  // Use authentication
}
```

## 🎯 Key Features

### ✅ Implemented
- Project setup with Vite + React
- Complete design system with UI components
- Authentication system with JWT
- API integration layer
- Responsive layout with Header & Sidebar
- Protected routes
- Error boundary
- Theme system (light/dark mode)
- Basic dashboard page
- Login page

### 🚧 In Progress / TODO
- Dashboard with real-time metrics
- Subscription management pages
- Billing & invoicing interface
- Usage analytics & CDR viewer
- Account settings pages
- Admin panel
- WebSocket real-time updates
- Advanced charts & visualizations
- Complete form implementations

## 🔧 Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Import Aliases

```javascript
@ → src/
@components → src/components  
@pages → src/pages
@hooks → src/hooks
@services → src/services
@utils → src/utils
@config → src/config
```

## 📱 Responsive Breakpoints

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## 🚀 Next Steps

1. **Complete Dashboard**: Add charts, metrics cards, and real-time data
2. **Subscription Pages**: Plan comparison, upgrade flow, add-ons
3. **Billing Pages**: Invoice viewer, payment methods, history
4. **Usage Pages**: CDR table, analytics, export functionality
5. **Real-time**: WebSocket integration for live updates
6. **Testing**: Add comprehensive test coverage

## 🤝 Contributing

Key areas for contribution:
- Feature implementation
- Component documentation
- Performance optimization
- Accessibility improvements
- Test coverage

## 📄 License

Proprietary - Balatrix Billing System

---

**Built with ❤️ for enterprise telecom billing**
