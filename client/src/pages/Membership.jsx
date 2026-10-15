import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import MembershipSection from '../components/membership/MembershipSection';
import { getMembershipSettings } from '../services/api';

const Membership = () => {
  const [title, setTitle] = useState('Membership');
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    getMembershipSettings()
      .then((res) => {
        if (!res.data.settings) setUnavailable(true);
        else setTitle(res.data.settings.title || 'Membership');
      })
      .catch(() => setUnavailable(true));
  }, []);

  if (unavailable) {
    return (
      <div className="pt-6 text-center py-20">
        <p className="text-brand-muted">Membership is unavailable right now.</p>
        <Link to="/" className="btn-primary mt-4 inline-flex">
          Back home
        </Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{title} — Nogor Car</title>
      </Helmet>
      <div className="pt-6 pb-16 w-full min-w-0 overflow-x-hidden">
        <div className="container-uc px-3 sm:px-6 lg:px-8 max-w-4xl w-full min-w-0">
          <MembershipSection />
        </div>
      </div>
    </>
  );
};

export default Membership;
