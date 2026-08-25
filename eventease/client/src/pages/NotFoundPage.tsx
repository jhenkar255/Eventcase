import { Link } from 'react-router-dom';
import { Home, SearchX } from 'lucide-react';
import { Navbar, Footer } from '../components';
import { Button } from '../components/ui';

export const NotFoundPage = () => (
  <div className="flex min-h-screen flex-col bg-slate-50">
    <Navbar />
    <main className="flex flex-1 items-center justify-center px-4 py-20">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary-50">
          <SearchX size={36} className="text-primary-500" />
        </div>
        <p className="text-sm font-bold uppercase tracking-widest text-primary-600">Error 404</p>
        <h1 className="mt-2 text-4xl font-extrabold text-slate-900">Page not found</h1>
        <p className="mx-auto mt-3 max-w-md text-slate-500">
          The page you are looking for does not exist or may have been moved.
        </p>
        <Link to="/" className="mt-8 inline-block">
          <Button size="lg">
            <Home size={18} /> Back to Home
          </Button>
        </Link>
      </div>
    </main>
    <Footer />
  </div>
);
