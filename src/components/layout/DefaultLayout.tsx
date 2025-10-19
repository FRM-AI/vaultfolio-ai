import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Navbar } from '@/components/layout/Navbar';

export default function DefaultLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <main className="flex-1 p-6 bg-gradient-to-br from-background to-muted/20">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </main>
          <footer className="border-t border-border py-4 px-6">
            <p className="text-center text-sm text-muted-foreground">
              FRM-AI © 2025 - Phân tích. Đầu tư. Tối ưu hoá.
            </p>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}
