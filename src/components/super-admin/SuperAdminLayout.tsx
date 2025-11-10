import { ReactNode } from 'react';
import SuperAdminSidebar from './SuperAdminSidebar';
import SuperAdminHeader from './SuperAdminHeader';

interface SuperAdminLayoutProps {
  children: ReactNode;
}

const SuperAdminLayout = ({ children }: SuperAdminLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <SuperAdminSidebar />
      <SuperAdminHeader />

      {/* Main Content */}
      <main className="ml-64 mt-16 p-6">
        {children}
      </main>
    </div>
  );
};

export default SuperAdminLayout;
