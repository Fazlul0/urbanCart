-- Update default English footer links to Bangla sticky-banner labels (req 20)
UPDATE site_settings
SET footer_links_json = '[
  {"label":"ফিটনেস এ্যাপয়েন্টমেন্টের সময়সূচি","url":"/contact"},
  {"label":"রেজিস্ট্রেশন ফি ও নবায়ন","url":"/contact"},
  {"label":"ট্যাক্স টোকেন ও রুট পারমিট ফি","url":"/contact"},
  {"label":"সার্ভিস চার্জ ও ডেলিভারি ফি","url":"/contact"},
  {"label":"নিবন্ধিত মোটরযানের ফি","url":"/contact"}
]'
WHERE id = 'default'
  AND (
    footer_links_json LIKE '%"label":"Home"%'
    OR footer_links_json LIKE '%"label":"Products"%'
  );
