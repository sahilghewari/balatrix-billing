/**
 * Account Profile Page
 * User profile management
 */

import { ProfileForm } from '../../../components/forms/ProfileForm2';

export const Profile = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Account Profile
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your personal and business information
        </p>
      </div>

      <ProfileForm />
    </div>
  );
};

export default Profile;
