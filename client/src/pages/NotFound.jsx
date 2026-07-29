import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const NotFound = () => (
  <>
    <Helmet>
      <title>404 — UrbanCart</title>
    </Helmet>
    <div className="pt-28 pb-16 min-h-[70vh] flex items-center justify-center text-center px-4">
      <div>
        <p className="font-display text-8xl text-brand-gold mb-4">404</p>
        <h1 className="font-display text-3xl mb-3">Page Not Found</h1>
        <p className="text-brand-muted mb-8">The page you're looking for doesn't exist.</p>
        <Link to="/" className="btn-primary">
          Back to Home
        </Link>
      </div>
    </div>
  </>
);

export default NotFound;
