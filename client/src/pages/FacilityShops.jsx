import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, MapPin, Phone } from 'lucide-react';
import {
  getMembershipFacility,
  getMembershipFacilityShops,
  getMyMembershipApplications,
} from '../services/api';
import { useAuth } from '../context/AuthContext';

const normalizeMapUrl = (url) => {
  const raw = String(url || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
};

const FacilityShops = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [facility, setFacility] = useState(null);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (!isAuthenticated) {
          navigate('/login', { state: { from: `/membership/facilities/${id}` } });
          return;
        }
        const appsRes = await getMyMembershipApplications();
        const latest = (appsRes.data.applications || [])[0];
        if (latest?.status !== 'approved') {
          if (!cancelled) setDenied(true);
          return;
        }
        const [facRes, shopsRes] = await Promise.all([
          getMembershipFacility(id),
          getMembershipFacilityShops(id),
        ]);
        if (cancelled) return;
        setFacility(facRes.data.facility);
        setShops(shopsRes.data.shops || []);
      } catch {
        if (!cancelled) setFacility(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (denied) {
    return (
      <div className="pt-10 pb-16 text-center px-4">
        <p className="text-brand-muted mb-5">Member access only.</p>
        <Link to="/" className="text-sm font-medium text-brand-gold hover:underline">
          Back home
        </Link>
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="pt-10 pb-16 text-center px-4">
        <p className="text-brand-muted mb-5">Facility not found.</p>
        <Link to="/" className="text-sm font-medium text-brand-gold hover:underline">
          Back home
        </Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{facility.name} — Partner shops</title>
      </Helmet>
      <div className="pt-8 pb-20">
        <div className="container-uc px-3 sm:px-6 lg:px-8 max-w-2xl w-full min-w-0 overflow-x-hidden">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-black mb-8 transition"
          >
            <ArrowLeft size={15} strokeWidth={1.75} />
            Home
          </Link>

          <header className="mb-10 border-b border-brand-border/60 pb-8">
            <p className="text-[11px] uppercase tracking-[0.2em] text-brand-gold mb-2">
              Partner shops
            </p>
            <h1 className="font-display text-3xl sm:text-4xl text-brand-black tracking-tight">
              {facility.name}
            </h1>
            {facility.description ? (
              <p className="mt-2 text-sm sm:text-base text-brand-muted leading-relaxed max-w-md">
                {facility.description}
              </p>
            ) : null}
          </header>

          {shops.length === 0 ? (
            <p className="text-sm text-brand-muted py-12 text-center border border-dashed border-brand-border rounded-lg">
              No shops listed yet.
            </p>
          ) : (
            <ul className="space-y-10">
              {shops.map((shop) => {
                const mapUrl = normalizeMapUrl(shop.locationLink);
                return (
                  <li key={shop._id} className="pb-10 border-b border-brand-border/60 last:border-0 last:pb-0">
                    <div className="w-full aspect-[16/10] sm:aspect-[2/1] rounded-xl overflow-hidden bg-neutral-100 mb-5">
                      {shop.image ? (
                        <img
                          src={shop.image}
                          alt={shop.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full bg-gradient-to-br from-neutral-100 to-neutral-200"
                          aria-hidden
                        />
                      )}
                    </div>

                    <h2 className="text-xl sm:text-2xl font-semibold text-brand-black tracking-tight text-center sm:text-left">
                      {shop.name}
                    </h2>

                    <dl className="mt-4 space-y-3 text-[15px] sm:text-base text-brand-black/80 max-w-lg mx-auto sm:mx-0">
                      {shop.ownerName ? (
                        <div className="grid grid-cols-1 sm:grid-cols-[11rem_1fr] gap-0.5 sm:gap-3">
                          <dt className="text-brand-muted text-sm sm:text-[15px]">Shop Owner Name</dt>
                          <dd className="font-medium">{shop.ownerName}</dd>
                        </div>
                      ) : null}
                      {shop.ownerMobile ? (
                        <div className="grid grid-cols-1 sm:grid-cols-[11rem_1fr] gap-0.5 sm:gap-3">
                          <dt className="text-brand-muted text-sm sm:text-[15px]">Phone Number</dt>
                          <dd className="font-medium">
                            <a
                              href={`tel:${shop.ownerMobile}`}
                              className="inline-flex items-center gap-2 hover:text-brand-gold transition"
                            >
                              <Phone size={16} strokeWidth={2} className="shrink-0" aria-hidden />
                              {shop.ownerMobile}
                            </a>
                          </dd>
                        </div>
                      ) : null}
                      {shop.secondaryMobile ? (
                        <div className="grid grid-cols-1 sm:grid-cols-[11rem_1fr] gap-0.5 sm:gap-3">
                          <dt className="text-brand-muted text-sm sm:text-[15px]">
                            Alternative Phone number
                          </dt>
                          <dd className="font-medium">
                            <a
                              href={`tel:${shop.secondaryMobile}`}
                              className="inline-flex items-center gap-2 hover:text-brand-gold transition"
                            >
                              <Phone size={16} strokeWidth={2} className="shrink-0" aria-hidden />
                              {shop.secondaryMobile}
                            </a>
                          </dd>
                        </div>
                      ) : null}
                      {shop.location ? (
                        <div className="grid grid-cols-1 sm:grid-cols-[11rem_1fr] gap-0.5 sm:gap-3">
                          <dt className="text-brand-muted text-sm sm:text-[15px]">Area</dt>
                          <dd className="font-medium break-words">{shop.location}</dd>
                        </div>
                      ) : null}
                    </dl>

                    {mapUrl ? (
                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-6 inline-flex items-center gap-3 text-base sm:text-lg font-semibold text-brand-gold hover:text-brand-black transition"
                      >
                        <MapPin size={28} strokeWidth={2} className="shrink-0" />
                        View on Google Map
                      </a>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
};

export default FacilityShops;
