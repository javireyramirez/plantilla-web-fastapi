// src/router.tsx
import { Navigate, Route, Routes } from 'react-router-dom';

import AdminLayout from '@/components/layout/admin-layout';
import PrivateLayout from '@/components/layout/private-layout';
import PublicLayout from '@/components/layout/public-layout';
import AdminRoute from '@/components/routes/admin-route';
import GuestRoute from '@/components/routes/guest-route';
import ProtectedRoute from '@/components/routes/protected-route';
import ForgotPassword from '@/modules/auth/pages/forgot-password';
import ResetPassword from '@/modules/auth/pages/reset-password';
import SignIn from '@/modules/auth/pages/sign-in';
import SignUp from '@/modules/auth/pages/sign-up';
import VerifyEmail from '@/modules/auth/pages/verify-email';
import CompanyDetail from '@/modules/companies/pages/companies-detail';
import CompaniesView from '@/modules/companies/pages/companies-view';
import AuditView from '@/modules/audit/pages/audit-view';
import AuditDetail from '@/modules/audit/pages/audit-detail';
import Profile from '@/modules/profile/profile-page';
import RoleDetail from '@/modules/roles/pages/roles-detail';
import RolesView from '@/modules/roles/pages/roles-view';
import TeamDetail from '@/modules/teams/pages/teams-detail';
import TeamsView from '@/modules/teams/pages/teams-view';
import UsersDetail from '@/modules/users/pages/users-detail';
import UsersView from '@/modules/users/pages/users-view';
import RecoveryView from '@/modules/trash/pages/recovery-view';
import Admin from '@/pages/Admin';
import Home from '@/pages/Home';

export default function Router() {
  return (
    <Routes>
      {/* Rutas públicas con layout */}
      <Route element={<GuestRoute />}>
        <Route element={<PublicLayout />}>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>
      </Route>

      {/* Con layout pero accesibles para todos */}
      <Route element={<PublicLayout />}>
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
      </Route>

      {/* Rutas privadas */}
      <Route element={<ProtectedRoute />}>
        <Route element={<PrivateLayout />}>
          <Route path="/home" element={<Home />} />

          <Route path="/companies" element={<CompaniesView />} />
          <Route path="/companies/new" element={<CompanyDetail />} />
          <Route path="/companies/edit/:id" element={<CompanyDetail />} />

          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      {/* Rutas administración */}
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Admin />} />

          <Route path="/users" element={<UsersView />} />
          <Route path="/users/new" element={<UsersDetail />} />
          <Route path="/users/edit/:id" element={<UsersDetail />} />

          <Route path="/teams" element={<TeamsView />} />
          <Route path="/teams/new" element={<TeamDetail />} />
          <Route path="/teams/edit/:id" element={<TeamDetail />} />

          <Route path="/roles" element={<RolesView />} />
          <Route path="/roles/new" element={<RoleDetail />} />
          <Route path="/roles/edit/:id" element={<RoleDetail />} />

          <Route path="/audit" element={<AuditView />} />
          <Route path="/audit/:id" element={<AuditDetail />} />

          <Route path="/recovery" element={<RecoveryView />} />
          <Route path="/documents" element={<RecoveryView />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/signin" replace />} />
      <Route path="*" element={<Navigate to="/signin" replace />} />
    </Routes>
  );
}
