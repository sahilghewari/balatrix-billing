/**
 * Reset Password Page
 */

import React from 'react';
import { AuthLayout } from '../components/layout';
import { ResetPasswordForm } from '../components/auth';

const ResetPasswordPage = () => {
  return (
    <AuthLayout>
      <ResetPasswordForm />
    </AuthLayout>
  );
};

export default ResetPasswordPage;
