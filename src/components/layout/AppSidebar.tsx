import { BarChart3, LineChart, Settings, Database } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useLanguage } from '@/contexts/LanguageContext';
import { WalletInfo } from '@/components/WalletInfo';
import { HistoryList } from '@/components/HistoryList';
import { Separator } from '@/components/ui/separator';

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { t } = useLanguage();

  const items = [
    { title: t.nav.analyze, url: '/', icon: BarChart3 },
    { title: t.nav.optimize, url: '/optimize', icon: LineChart },
    { title: t.nav.supportService, url: '/support-service', icon: Database },
    { title: t.nav.settings, url: '/settings', icon: Settings },
  ];

  return (
    <Sidebar className={collapsed ? 'w-14' : 'w-64'} collapsible="icon">
      <SidebarContent className="flex flex-col h-full">
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-bold text-primary px-4">
            {!collapsed && t.app.title}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                          isActive
                            ? 'bg-primary text-primary shadow-md'
                            : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      {!collapsed && <span className="font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && <Separator className="my-2" />}

        {/* History Section */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <HistoryList collapsed={collapsed} />
        </div>

        {!collapsed && (
          <div className="mt-auto p-4 border-t">
            <WalletInfo />
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
