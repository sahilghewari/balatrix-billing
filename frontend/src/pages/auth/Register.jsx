/**
 * Register Page
 * User registration interface
 */

import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User, Phone } from 'lucide-react';
import { Button, Input, Alert } from '@components/ui';
import { useAuth } from '@hooks/useAuth';
import { ROUTES } from '@utils/constants';
import { showSuccessToast, showErrorToast } from '@utils/errors';

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^\+?[1-9]\d{1,14}$/, 'Please provide a valid phone number (e.g., +919876543210)'),
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{12,}$/, 
      'Password must contain uppercase, lowercase, number, and special character'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const Register = () => {
  const navigate = useNavigate();
  const { register: registerUser, isAuthenticated } = useAuth();
  const [error, setError] = React.useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data) => {
    try {
      setError('');
      const { confirmPassword, ...registrationData } = data;
      await registerUser(registrationData);
      showSuccessToast('Registration successful! Please check your email to verify your account.');
      navigate(ROUTES.LOGIN);
    } catch (err) {
      console.error('Registration error:', err);
      
      // Handle validation errors (422)
      if (err.response?.status === 422 && err.response?.data?.error?.details) {
        const validationErrors = err.response.data.error.details;
        const errorMessages = validationErrors.map(e => `${e.field}: ${e.message}`).join('\n');
        setError(errorMessages);
      } else {
        const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
        setError(errorMessage);
      }
      
      showErrorToast(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Balatrix Billing</h1>
          <h2 className="mt-2 text-xl font-semibold text-gray-700">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{' '}
            <Link to={ROUTES.LOGIN} className="text-primary-600 hover:text-primary-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-lg shadow-md p-8">
          {error && (
            <Alert variant="error" closable onClose={() => setError('')} className="mb-6">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                type="text"
                placeholder="John"
                leftIcon={<User className="h-5 w-5" />}
                error={errors.firstName?.message}
                {...register('firstName')}
              />

              <Input
                label="Last Name"
                type="text"
                placeholder="Doe"
                leftIcon={<User className="h-5 w-5" />}
                error={errors.lastName?.message}
                {...register('lastName')}
              />
            </div>

            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              leftIcon={<Mail className="h-5 w-5" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Phone Number"
              type="tel"
              placeholder="+919876543210"
              leftIcon={<Phone className="h-5 w-5" />}
              error={errors.phoneNumber?.message}
              helperText="Include country code (e.g., +91 for India)"
              {...register('phoneNumber')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock className="h-5 w-5" />}
              error={errors.password?.message}
              helperText="Min 12 chars with uppercase, lowercase, number & special char"
              {...register('password')}
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock className="h-5 w-5" />}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <div className="flex items-start">
              <input
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-0.5"
                required
              />
              <label className="ml-2 text-sm text-gray-700">
                I agree to the{' '}
                <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">
                  Terms of Service
                </a>
                {' '}and{' '}
                <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">
                  Privacy Policy
                </a>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={isSubmitting}
            >
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to={ROUTES.LOGIN} className="text-primary-600 hover:text-primary-700 font-medium">
              Sign in now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
