-- Custom footer navigation links (JSON array of {label, url})
ALTER TABLE site_settings ADD COLUMN footer_links_json TEXT DEFAULT '[]';

UPDATE site_settings
SET footer_links_json = '[
  {"label":"Home","url":"/"},
  {"label":"Products","url":"/products"},
  {"label":"Membership","url":"/membership"},
  {"label":"Contact","url":"/contact"}
]'
WHERE id = 'default'
  AND (footer_links_json IS NULL OR footer_links_json = '' OR footer_links_json = '[]');
