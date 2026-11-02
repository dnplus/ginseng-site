-- The exact opt-in wording a person accepted when it came from another product (the website's wording is fixed per
-- consent_version in this repo, a product's is not).
ALTER TABLE subscribers ADD COLUMN consent_text TEXT;
