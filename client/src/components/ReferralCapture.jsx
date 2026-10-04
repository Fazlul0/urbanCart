import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { captureReferralFromLocation } from '../utils/referral';

/** Runs on every route change to capture/clear stealth referral codes */
const ReferralCapture = () => {
  const location = useLocation();

  useEffect(() => {
    captureReferralFromLocation(location.search);
  }, [location.search, location.pathname]);

  return null;
};

export default ReferralCapture;
