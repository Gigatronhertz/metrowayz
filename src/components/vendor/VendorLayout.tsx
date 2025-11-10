import { ReactNode } from 'react';
import VendorSidebar from './VendorSidebar';
import VendorHeader from './VendorHeader';

interface VendorLayoutProps {
  children: ReactNode;
}

const VendorLayout = ({ children }: VendorLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <VendorSidebar />
      <VendorHeader />

      {/* Main Content */}
      <main className="ml-64 mt-16 p-6">
        {children}
      </main>
    </div>
  );
};

export default VendorLayout;
