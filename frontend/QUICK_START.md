# 🚀 QUICK START GUIDE - Balatrix Billing Dashboard

## Development Server is Running!

Your app is now live at: **http://localhost:3000**

---

## ✅ What's Working Right Now

1. **Login Page** - Visit http://localhost:3000 (you'll be redirected to `/login`)
2. **Responsive Design** - Try resizing your browser or opening on mobile
3. **Theme Toggle** - Light/dark mode support (though login page doesn't show toggle yet)
4. **UI Components** - All design system components are ready to use

---

## 🎯 Quick Test

### Test the Login UI

1. Open http://localhost:3000
2. You'll see the login page
3. Try entering an email and password
4. Click "Sign In" (will show error - no backend yet)

### Test Components

You can test components by temporarily adding them to the Dashboard or Login page:

```javascript
import { Button, Card, Badge, Alert } from '@components/ui';

// Add to your component
<div className="p-4 space-y-4">
  <Button variant="primary">Primary Button</Button>
  <Button variant="outline">Outline Button</Button>
  <Badge variant="success">Success</Badge>
  <Alert variant="info">This is an info alert</Alert>
</div>
```

---

## 📝 Next Immediate Tasks

### Option 1: Build Dashboard with Real Data (Recommended)

**File**: `src/pages/dashboard/Dashboard.jsx`

1. Create TanStack Query hooks for data fetching
2. Replace mock data with real API calls
3. Add error and loading states
4. Implement charts with Recharts

**Example**:
```javascript
// src/hooks/useDashboard.js
import { useQuery } from '@tanstack/react-query';
import { api } from '@services/api';

export const useDashboardMetrics = () => {
  return useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: async () => {
      const response = await api.get('/dashboard/metrics');
      return response.data;
    },
  });
};

// Then use in Dashboard.jsx
const { data, isLoading, error } = useDashboardMetrics();
```

### Option 2: Build Subscription Pages

**Files to Create**:
- `src/pages/subscription/Plans.jsx`
- `src/components/features/subscription/PlanComparison.jsx`

### Option 3: Build Billing Pages

**Files to Create**:
- `src/pages/billing/Invoices.jsx`
- `src/components/features/billing/InvoiceTable.jsx`

---

## 🔧 Common Development Tasks

### Adding a New Page

1. **Create page component**:
```javascript
// src/pages/subscription/Plans.jsx
export const Plans = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold">Subscription Plans</h1>
      {/* Your content */}
    </div>
  );
};
```

2. **Add route** in `src/App.jsx`:
```javascript
import Plans from '@pages/subscription/Plans';

// In Routes
<Route
  path="/subscriptions/plans"
  element={
    <ProtectedRoute>
      <Layout>
        <Plans />
      </Layout>
    </ProtectedRoute>
  }
/>
```

3. **Update Sidebar** in `src/components/layout/Sidebar.jsx` (already has the link)

### Adding API Service

1. **Create service function** in appropriate service file:
```javascript
// src/services/subscription.js
export const subscriptionService = {
  getPlans: async () => {
    const response = await api.get('/subscriptions/plans');
    return response.data;
  },
};
```

2. **Create hook** for component use:
```javascript
// src/hooks/useSubscription.js
export const usePlans = () => {
  return useQuery({
    queryKey: ['plans'],
    queryFn: subscriptionService.getPlans,
  });
};
```

3. **Use in component**:
```javascript
const { data: plans, isLoading } = usePlans();
```

### Creating a New Component

1. **Create component file**:
```javascript
// src/components/features/billing/InvoiceCard.jsx
export const InvoiceCard = ({ invoice }) => {
  return (
    <Card>
      <h3>{invoice.number}</h3>
      <p>{formatCurrency(invoice.amount)}</p>
    </Card>
  );
};
```

2. **Import and use**:
```javascript
import { InvoiceCard } from '@components/features/billing/InvoiceCard';
```

---

## 🎨 Using the Design System

### Buttons
```javascript
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// With icons
<Button leftIcon={<Plus className="h-4 w-4" />}>Add New</Button>
<Button rightIcon={<ArrowRight className="h-4 w-4" />}>Next</Button>

// Loading state
<Button loading={isLoading}>Submit</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
```

### Forms
```javascript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input
        label="Email"
        type="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <Input
        label="Password"
        type="password"
        error={errors.password?.message}
        {...register('password')}
      />
      <Button type="submit">Submit</Button>
    </form>
  );
}
```

### Cards & Layout
```javascript
<Card 
  title="My Card"
  subtitle="Card subtitle"
  headerAction={<Button size="sm">Action</Button>}
  footer={<p>Card footer</p>}
>
  Card content goes here
</Card>
```

### Data Display
```javascript
// Badges
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="error">Failed</Badge>

// Avatars
<Avatar src={user.avatar} name={user.name} size="md" />

// Skeletons (loading states)
<Skeleton variant="text" count={3} />
<Skeleton variant="card" />
```

---

## 🔗 Useful Commands

```bash
# Development
npm run dev              # Start dev server

# Production
npm run build           # Build for production
npm run preview         # Preview production build

# Linting
npm run lint            # Run ESLint

# Package Management
npm install <package>   # Install new package
npm update              # Update packages
```

---

## 📚 Quick Reference

### Import Aliases
```javascript
@              → src/
@components    → src/components
@pages         → src/pages
@hooks         → src/hooks
@services      → src/services
@stores        → src/stores
@utils         → src/utils
@config        → src/config
```

### Key Files
```
src/
├── App.jsx                      # Main router
├── config/api.js                # API endpoints
├── services/api.js              # Axios client
├── stores/authStore.js          # Auth state
├── components/ui/index.js       # UI components
└── utils/
    ├── constants.js             # App constants
    ├── formatters.js            # Formatters
    └── errors.js                # Error handlers
```

### Environment Variables
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_SOCKET_URL=http://localhost:8000
```

---

## 🐛 Common Issues & Fixes

### ❌ Import errors with @ aliases
```bash
# Restart dev server
Ctrl+C
npm run dev
```

### ❌ TailwindCSS not working
Check `src/main.jsx` has:
```javascript
import './styles/globals.css'
import './index.css'
```

### ❌ Component not found
Check the import path and alias configuration in `vite.config.js`

### ❌ API calls failing
1. Check `.env` file has correct `VITE_API_BASE_URL`
2. Ensure backend server is running
3. Check browser console for CORS errors

---

## 💡 Development Tips

### Hot Reload
- Save any file to see instant changes
- Vite's HMR is very fast
- If something breaks, reload the page

### Browser DevTools
- Use React DevTools extension
- Use TanStack Query DevTools (add to App.jsx)
- Check Network tab for API calls

### Code Style
- Use Prettier for formatting (optional)
- Follow existing patterns in the codebase
- Keep components small and focused

---

## 🎯 Today's Goals

Pick one and start building:

- [ ] Finish Dashboard with real data
- [ ] Create Subscription Plans page
- [ ] Build Invoice list page
- [ ] Implement CDR table
- [ ] Add user profile page

---

## 🎉 You're All Set!

Your development environment is ready. The foundation is solid. Now it's time to build the features!

**Start with**: Dashboard → then pick any feature you need most

**Remember**: 
- Use the UI components already built
- Follow the patterns in existing code
- Test on mobile regularly
- Have fun building! 🚀

---

**Need help?** Check `PROJECT_SUMMARY.md` for detailed documentation.

**Happy coding! 💻✨**
