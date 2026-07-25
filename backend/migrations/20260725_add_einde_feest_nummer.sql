-- Voeg het eindnummer-veld toe aan bestaande Cloudflare D1 databases.
-- Nodig voor het veld "Artiest + titel" bij "Einde feest" in de vragenlijst.
ALTER TABLE bookings ADD COLUMN einde_feest_nummer TEXT;
