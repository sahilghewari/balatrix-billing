# Quick Start Guide - Balatrix Billing Frontend

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Node.js 18+ installed
- Backend running on http://localhost:3000
- PostgreSQL database with seeders run

### Step 1: Install Dependencies
```bash
cd frontend
npm install
```

### Step 2: Configure Environment
Create `.env` file:
```env
VITE_API_BASE_URL=http://localhost:3000
```

### Step 3: Start Development Server
```bash
npm run dev
```

Frontend will be available at: **http://localhost:5173**

---

## 📖 User Guide

### Create an Account
1. Visit http://localhost:5173/register
2. Fill in username, email, password
3. Click "Create Account"
4. You'll be redirected to dashboard

### Browse Plans
1. Click "View Plans & Get Started" on dashboard
   - Or visit http://localhost:5173/plans directly
2. Toggle between Monthly/Quarterly/Annual billing
3. Compare the 3 plans:
   - **Starter**: ₹349/month - Perfect for small businesses
   - **Professional**: ₹999/month - Most popular
   - **Call Center**: ₹4,999/month - For high-volume operations

### Select a Plan
1. Click "Select Plan" on your preferred plan
   - If not logged in, you'll be redirected to login
2. Use the add-on selector to add extra toll-free numbers and extensions
3. Review the price summary (including GST)
4. Click "Proceed to Payment"

### Complete Purchase
1. Fill in customer information:
   - **Required**: First Name, Phone, City, State
   - **Optional**: Last Name, Company, Address, Postal Code, GST Number
2. Review order summary
3. Click "Pay ₹X,XXX" button
4. Complete payment on Razorpay checkout:
   - **Test Card**: 4111 1111 1111 1111
   - **CVV**: Any 3 digits
   - **Expiry**: Any future date
   - **OTP**: Any code (test mode)
5. After successful payment, you'll be redirected to dashboard

### View Your Subscription
Dashboard will show:
- ✅ Active subscription details
- ✅ Plan limits (TFNs, minutes, extensions)
- ✅ Billing information
- ✅ Plan features
- ✅ Usage statistics

---

## 🧪 Testing Checklist

### Authentication Tests
- [ ] Register new account
- [ ] Login with credentials
- [ ] Logout
- [ ] Protected routes redirect to login
- [ ] Token refresh works
- [ ] Forgot password flow

### Plan Selection Tests
- [ ] View all plans without login
- [ ] Toggle billing cycles (monthly/quarterly/annual)
- [ ] Price updates correctly for each cycle
- [ ] Annual plan shows 20% savings
- [ ] Quarterly plan shows "No setup fee" badge
- [ ] Select plan redirects to login if not authenticated
- [ ] Can't select current plan (disabled)

### Add-on Tests
- [ ] Increase/decrease extra TFNs
- [ ] Increase/decrease extra extensions
- [ ] Add-on pricing changes based on billing cycle:
  - Monthly: Shows OTC charges (₹199/₹99)
  - Quarterly: Shows PAYG rate (₹1/month)
  - Annual: Shows PAYG rate (₹1/month)
- [ ] Maximum 10 of each add-on
- [ ] Subtotal calculates correctly

### Price Calculation Tests
- [ ] Base price updates on billing cycle change
- [ ] Add-ons calculated correctly
- [ ] GST (18%) calculated correctly
- [ ] Total matches backend calculation
- [ ] Price summary shows all line items

### Checkout Tests
- [ ] Customer form pre-fills user data
- [ ] Form validation works (required fields)
- [ ] Phone number validation
- [ ] Order summary matches plan selection
- [ ] Back button returns to plans page

### Payment Tests
- [ ] Razorpay checkout opens
- [ ] Test card payment succeeds
- [ ] Payment cancellation works
- [ ] Failed payment shows error
- [ ] Successful payment redirects to dashboard
- [ ] Subscription activated in database
- [ ] Payment record created

### Dashboard Tests
- [ ] Shows "No subscription" CTA when no plan
- [ ] Shows subscription details after purchase
- [ ] All plan limits displayed correctly
- [ ] Billing dates formatted correctly
- [ ] Features list displayed
- [ ] "Upgrade Plan" button navigates to plans page

### Responsive Design Tests
- [ ] Mobile view (< 768px)
- [ ] Tablet view (768px - 1024px)
- [ ] Desktop view (> 1024px)
- [ ] Plan cards stack on mobile
- [ ] Forms usable on mobile
- [ ] Dashboard cards responsive

### Error Handling Tests
- [ ] Network error shows toast
- [ ] API error shows toast
- [ ] Invalid payment signature shows error
- [ ] Expired token refreshes automatically
- [ ] Loading states show spinner

---

## 🔧 Development Commands

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## 📦 Key Dependencies

```json
{
  "react": "^19.1.1",
  "react-dom": "^19.1.1",
  "react-router-dom": "^7.1.3",
  "axios": "^1.7.9",
  "react-hook-form": "^7.54.2",
  "zod": "^3.24.1",
  "react-hot-toast": "^2.4.1",
  "lucide-react": "^0.468.0",
  "tailwindcss": "^4.1.14"
}
```

---

## 🎨 Component Overview

### Common Components
- **Button**: Primary, secondary, outline variants
- **Input**: Text, email, password with validation
- **Card**: Container with optional title
- **Spinner**: Loading indicator
- **Alert**: Success, error, warning messages

### Plan Components
- **PlanCard**: Individual plan display with pricing
- **AddonSelector**: Interactive add-on selection

### Layout Components
- **MainLayout**: Dashboard wrapper with navigation
- **AuthLayout**: Centered layout for auth pages

### Route Components
- **PrivateRoute**: Requires authentication
- **PublicRoute**: Redirects if authenticated

---

## 🔐 Security Features

1. **JWT Authentication**: Access & refresh tokens
2. **Token Storage**: Secure localStorage
3. **Auto Refresh**: Automatic token renewal
4. **Protected Routes**: Authentication required
5. **Payment Verification**: Signature validation
6. **HTTPS**: Required for production Razorpay

---

## 🐛 Troubleshooting

### Issue: Plans not loading
**Solution**: Check backend is running on port 3000
```bash
cd backend
npm run dev
```

### Issue: Payment fails
**Solution**: 
1. Check Razorpay keys in backend `.env`
2. Ensure using test mode keys
3. Use Razorpay test card: 4111 1111 1111 1111

### Issue: Login doesn't work
**Solution**:
1. Check backend migrations and seeders ran
2. Verify database connection
3. Check JWT secrets in backend `.env`

### Issue: Blank screen
**Solution**:
1. Check browser console for errors
2. Verify `VITE_API_BASE_URL` in frontend `.env`
3. Clear browser cache and localStorage

### Issue: Subscription not showing
**Solution**:
1. Complete payment successfully
2. Check payment verification succeeded
3. Refresh dashboard page
4. Check subscription status in database

---

## 📞 Support

For issues or questions:
1. Check `FRONTEND_COMPLETE.md` for detailed documentation
2. Check `backend/API_ENDPOINTS.md` for API reference
3. Review browser console for errors
4. Check network tab for failed requests

---

## ✅ Success Criteria

Your setup is working correctly if:
- ✅ Can register and login
- ✅ Can view all 3 plans
- ✅ Can select plan and add add-ons
- ✅ Price calculator works in real-time
- ✅ Can complete Razorpay payment
- ✅ Dashboard shows active subscription
- ✅ All statistics display correctly

**Happy coding! 🎉**
