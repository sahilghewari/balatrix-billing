/**
 * Register Page
 */

import React from 'react';
import { AuthLayout } from '../components/layout';
import { RegisterForm } from '../components/auth';

const RegisterPage = () => {
  return (
    <AuthLayout>
      <RegisterForm />
    </AuthLayout>
  );
};

export default RegisterPage;
