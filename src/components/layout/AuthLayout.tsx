import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Outlet />
    </div>
  );
}
