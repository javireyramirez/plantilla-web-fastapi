// src/router.tsx
import { Navigate, Route, Routes } from 'react-router-dom';

import PrivateLayout from '@/components/layout/private-layout';
import PublicLayout from '@/components/layout/public-layout';
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
import StorageView from '@/modules/storage/pages/storage-view';

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

      {/* Rutas privadas unificadas */}
      <Route element={<ProtectedRoute />}>
        <Route element={<PrivateLayout />}>
          {/* Negocio */}
          <Route path="/companies" element={<CompaniesView />} />
          <Route path="/companies/new" element={<CompanyDetail />} />
          <Route path="/companies/edit/:id" element={<CompanyDetail />} />

          {/* Administración: Seguridad */}
          <Route path="/admin/users" element={<UsersView />} />
          <Route path="/admin/users/new" element={<UsersDetail />} />
          <Route path="/admin/users/edit/:id" element={<UsersDetail />} />

          <Route path="/admin/teams" element={<TeamsView />} />
          <Route path="/admin/teams/new" element={<TeamDetail />} />
          <Route path="/admin/teams/edit/:id" element={<TeamDetail />} />

          <Route path="/admin/roles" element={<RolesView />} />
          <Route path="/admin/roles/new" element={<RoleDetail />} />
          <Route path="/admin/roles/edit/:id" element={<RoleDetail />} />

          {/* Administración: Sistema y Archivos */}
          <Route path="/admin/audit" element={<AuditView />} />
          <Route path="/admin/audit/:id" element={<AuditDetail />} />

          <Route path="/admin/recovery" element={<RecoveryView />} />
          <Route path="/admin/documents" element={<RecoveryView />} />

          <Route path="/admin/storage" element={<StorageView />} />

          {/* Redirecciones de retrocompatibilidad */}
          <Route path="/users" element={<Navigate to="/admin/users" replace />} />
          <Route path="/users/*" element={<Navigate to="/admin/users" replace />} />
          <Route path="/teams" element={<Navigate to="/admin/teams" replace />} />
          <Route path="/teams/*" element={<Navigate to="/admin/teams" replace />} />
          <Route path="/roles" element={<Navigate to="/admin/roles" replace />} />
          <Route path="/roles/*" element={<Navigate to="/admin/roles" replace />} />
          <Route path="/audit" element={<Navigate to="/admin/audit" replace />} />
          <Route path="/audit/*" element={<Navigate to="/admin/audit" replace />} />
          <Route path="/recovery" element={<Navigate to="/admin/recovery" replace />} />
          <Route path="/documents" element={<Navigate to="/admin/recovery" replace />} />
          <Route path="/storage" element={<Navigate to="/admin/storage" replace />} />
          <Route path="/storage/*" element={<Navigate to="/admin/storage" replace />} />

          <Route path="/profile" element={<Profile />} />

          {/* Redirecciones de conveniencia */}
          <Route path="/home" element={<Navigate to="/companies" replace />} />
          <Route path="/admin" element={<Navigate to="/admin/users" replace />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/signin" replace />} />
      <Route path="*" element={<Navigate to="/signin" replace />} />
    </Routes>
  );
}

