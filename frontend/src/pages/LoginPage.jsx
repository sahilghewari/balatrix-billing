/**
 * Login Page
 */

import React from 'react';
import { AuthLayout } from '../components/layout';
import { LoginForm } from '../components/auth';

const LoginPage = () => {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
};

export default LoginPage;
