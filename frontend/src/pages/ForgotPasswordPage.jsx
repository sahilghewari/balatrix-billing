/**
 * Forgot Password Page
 */

import React from 'react';
import { AuthLayout } from '../components/layout';
import { ForgotPasswordForm } from '../components/auth';

const ForgotPasswordPage = () => {
  return (
    <AuthLayout>
      <ForgotPasswordForm />
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
