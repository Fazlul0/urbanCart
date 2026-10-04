-- Update stock English membership benefit defaults to Bangla (BenefitCard-compatible).
-- Only replaces the original seed strings; custom admin edits are left alone.
UPDATE membership_settings
SET features_json = '["🚚 **ফ্রি ডেলিভারি**\nসব অর্ডারে বিনামূল্যে ডেলিভারি সুবিধা","🏷️ **সদস্য ছাড়**\nমেম্বারদের জন্য বিশেষ ডিসকাউন্ট ও অফার","🎧 **অগ্রাধিকার সাপোর্ট**\nপ্রাধান্যভিত্তিক কাস্টমার সাপোর্ট","✨ **নতুন পণ্যে আগে সুযোগ**\nনতুন পণ্যে আগেই অ্যাক্সেস"]',
    updated_at = datetime('now')
WHERE id = 'default'
  AND features_json = '["Free delivery on all orders","Member-only discounts","Priority customer support","Early access to new products"]';
