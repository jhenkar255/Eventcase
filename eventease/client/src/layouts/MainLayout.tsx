import { Outlet } from 'react-router-dom';
import { Navbar, Footer } from '../components';

export const MainLayout = () => (
  <div className="flex min-h-screen flex-col">
    <Navbar />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
  </div>
);
