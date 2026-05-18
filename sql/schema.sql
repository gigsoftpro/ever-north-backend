-- ============================================================
-- Ever North CMS Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS evernorth_cms
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE evernorth_cms;

-- ------------------------------------------------------------
-- Admin Users
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  username    VARCHAR(100) NOT NULL UNIQUE,
  email       VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role        ENUM('superadmin','editor') DEFAULT 'editor',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- Media Library
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS media (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  filename      VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mimetype      VARCHAR(100) NOT NULL,
  size          INT NOT NULL,
  path          VARCHAR(500) NOT NULL,
  section       VARCHAR(100) DEFAULT 'general',
  uploaded_by   INT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES admins(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- Hero Section
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hero_section (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  title           TEXT NOT NULL,
  highlighted_word VARCHAR(100) DEFAULT 'Ontario',
  cta_text        VARCHAR(100) DEFAULT 'Get Free Consultation',
  bg_image_id     INT,
  overlay_image_id INT,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (bg_image_id) REFERENCES media(id) ON DELETE SET NULL,
  FOREIGN KEY (overlay_image_id) REFERENCES media(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- About Section
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS about_section (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  about_image_id    INT,
  mission_badge     VARCHAR(100) DEFAULT 'Our Mission',
  mission_text_1    TEXT,
  mission_text_2    TEXT,
  about_badge       VARCHAR(100) DEFAULT 'About Us',
  about_text_1      TEXT,
  about_text_2      TEXT,
  about_text_3      TEXT,
  services_label    VARCHAR(100) DEFAULT 'Our Services',
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (about_image_id) REFERENCES media(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- Services Cards
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS services (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  image_id    INT,
  style       ENUM('full-text','image-bottom','image-only') DEFAULT 'full-text',
  sort_order  INT DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (image_id) REFERENCES media(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- Cleaning Services (circular image blocks)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cleaning_services (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  label       VARCHAR(150) NOT NULL,
  image_id    INT,
  sort_order  INT DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (image_id) REFERENCES media(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS cleaning_section_meta (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(200) DEFAULT 'Cleaning Services',
  description TEXT,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- Maintenance Section
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS maintenance_section (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  heading     VARCHAR(200) DEFAULT 'Property Management & Maintenance',
  cta_label   VARCHAR(100) DEFAULT 'More Services',
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS maintenance_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  sort_order  INT DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE
);

-- ------------------------------------------------------------
-- Areas We Cover
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS areas (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  image_id    INT,
  sort_order  INT DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (image_id) REFERENCES media(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS areas_section_meta (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(200) DEFAULT 'Areas We Cover',
  subtitle    TEXT,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- Testimonials
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS testimonials (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(150) NOT NULL,
  quote         TEXT NOT NULL,
  rating        TINYINT DEFAULT 5,
  sort_order    INT DEFAULT 0,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- Header Contact Info
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS header_info (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  phone       VARCHAR(50) DEFAULT '(01) 1234 5678',
  email       VARCHAR(150) DEFAULT 'demo@evernorth.com',
  logo_id     INT,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (logo_id) REFERENCES media(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- Navigation Links
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS nav_links (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  label       VARCHAR(100) NOT NULL,
  href        VARCHAR(255) DEFAULT '#',
  sort_order  INT DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE
);

-- ------------------------------------------------------------
-- Footer Content
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS footer_content (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  logo_id         INT,
  building_img_id INT,
  description     TEXT,
  email           VARCHAR(150),
  phone           VARCHAR(50),
  copyright_text  VARCHAR(255),
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (logo_id) REFERENCES media(id) ON DELETE SET NULL,
  FOREIGN KEY (building_img_id) REFERENCES media(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- Contact Form Submissions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contact_submissions (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  email       VARCHAR(150) NOT NULL,
  phone       VARCHAR(50),
  subject     VARCHAR(200),
  message     TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- SEED DATA — default content
-- ============================================================

INSERT INTO admins (username, email, password_hash, role) VALUES
('admin', 'admin@evernorth.com', '$2b$12$seed_placeholder_replace_on_first_run', 'superadmin');

INSERT INTO hero_section (title, highlighted_word, cta_text) VALUES
('Professional Property Management in', 'Ontario', 'Get Free Consultation');

INSERT INTO about_section (
  mission_badge, mission_text_1, mission_text_2,
  about_badge, about_text_1, about_text_2, about_text_3, services_label
) VALUES (
  'Our Mission',
  'We aim to redefine real estate by delivering sustainable, trusted, and innovative solutions that create lasting value for our clients and communities.',
  'Trusted, and innovative solutions that create lasting value for our clients and communities.',
  'About Us',
  'We aim to redefine real estate by delivering sustainable, trusted, and innovative solutions.',
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod.',
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod.',
  'Our Services'
);

INSERT INTO services (title, description, style, sort_order) VALUES
('Short Term Property Management', 'Maximize your Airbnb and short-term rental income with our full-service management. We handle everything from guest communication to cleaning coordination.', 'full-text', 1),
('Long Term Property Management', NULL, 'image-bottom', 2),
('Airbnb Hosting & Co-Hosting', NULL, 'image-bottom', 3);

INSERT INTO cleaning_section_meta (title, description) VALUES
('Cleaning Services', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.');

INSERT INTO cleaning_services (label, sort_order) VALUES
('Deep Cleaning', 1), ('Regular Maintenance', 2), ('Move-In Cleaning', 3);

INSERT INTO maintenance_section (heading, cta_label) VALUES
('Property Management & Maintenance', 'More Services');

INSERT INTO maintenance_items (title, description, sort_order) VALUES
('Glass Repair', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', 1),
('Lawn Care & Landscaping', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', 2);

INSERT INTO areas_section_meta (title, subtitle) VALUES
('Areas We Cover', 'A selection of the properties we proudly manage across the Greater Toronto Area.');

INSERT INTO areas (name, sort_order) VALUES
('Grand Ben', 1), ('Sauble Beach', 2), ('Lake Huron', 3), ('Lake Huron', 4);

INSERT INTO testimonials (customer_name, quote, rating, sort_order) VALUES
('Customer Name', 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry standard dummy text ever since the 1500s, when an unknown printer took a galley of type.', 5, 1),
('Sarah Johnson', 'Working with Ever North has been an absolute pleasure. They manage our rental properties professionally and always communicate proactively. Our rental income has never been higher.', 5, 2),
('Michael Chen', 'The team at Ever North exceeded every expectation. From tenant screening to maintenance coordination, they handle it all with expertise and care. Highly recommended.', 5, 3);

INSERT INTO header_info (phone, email) VALUES ('(01) 1234 5678', 'demo@evernorth.com');

INSERT INTO nav_links (label, href, sort_order) VALUES
('Home', '/', 1), ('About Us', '/about', 2), ('Services', '/services', 3), ('Contact Us', '/contact', 4);

INSERT INTO footer_content (description, email, phone, copyright_text) VALUES
('Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
'info123@gmail.com', '01234-56789', '© Copyright 2026 Ever North. All Rights Reserved');

CREATE TABLE hero_slides (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  title           VARCHAR(500),
  highlighted_word VARCHAR(255),
  cta_text        VARCHAR(255),
  bg_image_id     INT,
  overlay_image_id INT,
  sort_order      INT DEFAULT 0,
  is_active       TINYINT(1) DEFAULT 1,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optional: migrate your existing hero_section row into a slide
INSERT INTO hero_slides (title, highlighted_word, cta_text, bg_image_id, overlay_image_id, sort_order)
SELECT title, highlighted_word, cta_text, bg_image_id, overlay_image_id, 0
FROM hero_section LIMIT 1;

-- ============================================================
-- schema_renovation.sql  —  run ONCE, safe with existing schema
-- Creates 5 new tables only. No existing tables are touched.
-- ============================================================

-- ─── Renovation page meta (single row) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS renovation_page (
  id               INT PRIMARY KEY DEFAULT 1,

  -- ── Hero ──────────────────────────────────────────────────────────────────
  hero_image_id    INT  NULL,
  hero_title       VARCHAR(255) DEFAULT 'Property Renovation',
  hero_tagline     VARCHAR(255) DEFAULT 'Renovate Smart. Profit More.',
  hero_para_1      TEXT,
  hero_para_2      TEXT,
  hero_para_3      TEXT,
  hero_cta_text    VARCHAR(100) DEFAULT 'Book a Renovation Consultation',
  hero_cta_href    VARCHAR(255) DEFAULT '#consultation',

  -- ── What We Renovate ──────────────────────────────────────────────────────
  renovate_title    VARCHAR(255) DEFAULT 'What We Renovate',
  renovate_subtitle TEXT,

  -- ── Strategic Upgrades ────────────────────────────────────────────────────
  upgrades_title    VARCHAR(255) DEFAULT 'Strategic Upgrades for Every Type of Owner',
  upgrades_subtitle TEXT,
  upgrades_image_id INT NULL,

  -- ── Why EverNorth ──────────────────────────────────────────────────────────
  why_image_id     INT  NULL,
  why_title        VARCHAR(255) DEFAULT 'Why EverNorth for Property Renovation',

  -- ── Done Right section ─────────────────────────────────────────────────────
  done_title       VARCHAR(255) DEFAULT 'A Renovation Done Right Changes Everything',
  done_para_1      TEXT,
  done_para_2      TEXT,
  done_btn1_text   VARCHAR(100) DEFAULT 'Book a Free Consultation',
  done_btn1_href   VARCHAR(255) DEFAULT '#consultation',
  done_btn2_text   VARCHAR(100) DEFAULT 'Explore All Our Services',
  done_btn2_href   VARCHAR(255) DEFAULT '#services',
  done_image_id    INT  NULL,

  -- ── FAQ ────────────────────────────────────────────────────────────────────
  faq_title        VARCHAR(255) DEFAULT 'Frequently Asked Questions',
  faq_image_id     INT  NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (hero_image_id)     REFERENCES media(id) ON DELETE SET NULL,
  FOREIGN KEY (upgrades_image_id) REFERENCES media(id) ON DELETE SET NULL,
  FOREIGN KEY (why_image_id)      REFERENCES media(id) ON DELETE SET NULL,
  FOREIGN KEY (done_image_id)     REFERENCES media(id) ON DELETE SET NULL,
  FOREIGN KEY (faq_image_id)      REFERENCES media(id) ON DELETE SET NULL
);

INSERT IGNORE INTO renovation_page
  (id, hero_title, hero_tagline, hero_para_1, hero_para_2, hero_para_3, hero_cta_text, hero_cta_href,
   renovate_title, renovate_subtitle,
   upgrades_title, upgrades_subtitle,
   why_title,
   done_title, done_para_1, done_para_2, done_btn1_text, done_btn1_href, done_btn2_text, done_btn2_href,
   faq_title)
VALUES (
  1,
  'Property Renovation', 'Renovate Smart. Profit More.',
  'A renovation is not just about making a property look better. It is about making it worth more. The right upgrades in the right places can significantly increase your sale price, attract higher-paying tenants, and set your property apart in a competitive market.',
  'But a poorly planned renovation? That is money poured into the wrong walls.',
  'EverNorth takes the guesswork out of property renovation. We combine investor-focused strategy with premium execution to deliver upgrades that actually move the needle, not just ones that look good on a mood board.',
  'Book a Renovation Consultation', '#consultation',
  'What We Renovate',
  'We handle residential and investment property renovations across Canada, covering everything from focused upgrades to full property transformations.',
  'Strategic Upgrades for Every Type of Owner',
  'Whether you are flipping a property for resale, preparing a rental for new tenants, or upgrading a long-term hold to increase its market value, our renovation approach is tailored to your specific goal.',
  'Why EverNorth for Property Renovation',
  'A Renovation Done Right Changes Everything',
  'The difference between a property that sits on the market and one that sells in days often comes down to how well it has been renovated and presented. The difference between a tenant who stays for years and one who leaves after months often comes down to the quality of finishes they live with every day.',
  'EverNorth renovations are built to make that difference. Strategic, well-executed, and delivered to a standard that holds up long after the last contractor has left.',
  'Book a Free Consultation', '#consultation', 'Explore All Our Services', '#services',
  'Frequently Asked Questions'
);

-- ─── What We Renovate cards ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS renovation_cards (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  emoji       VARCHAR(20)  DEFAULT '🏠',
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  sort_order  INT          DEFAULT 0,
  is_active   TINYINT(1)   DEFAULT 1
);

INSERT IGNORE INTO renovation_cards (id, emoji, title, description, sort_order) VALUES
  (1, '🍳', 'Kitchen Upgrades',                'The kitchen sells the property. We modernize kitchens with updated cabinetry, countertops, fixtures, and finishes that appeal to today''s buyers and tenants without over-capitalizing on the space.', 0),
  (2, '🚿', 'Bathroom Renovations',            'Fresh, clean, and well-finished bathrooms consistently rank among the highest-ROI renovations. We upgrade bathrooms to a standard that feels premium without requiring a luxury budget.', 1),
  (3, '🏠', 'Flooring and Interior Finishes',  'New flooring changes the entire feel of a property. We install and replace hardwood, laminate, tile, and vinyl options that are durable, attractive, and appropriate for the property''s market positioning.', 2),
  (4, '🎨', 'Painting and Wall Finishes',      'A fresh coat of paint is one of the highest-value renovations per dollar spent. We handle full interior and exterior repaints with color selections that appeal broadly to buyers and tenants.', 3),
  (5, '🏗️', 'Basement Finishing and Conversions', 'Unfinished basements are untapped income. We convert and finish basement spaces to add livable square footage, create rental suites, or simply improve the property''s overall value and appeal.', 4),
  (6, '🔨', 'Full Property Renovations',       'For properties that need a complete transformation, we manage the entire process from planning and permits to execution and final finish. One team. One timeline. No juggling multiple contractors.', 5);

-- ─── Owner type cards ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS renovation_owner_types (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  sort_order  INT          DEFAULT 0,
  is_active   TINYINT(1)   DEFAULT 1
);

INSERT IGNORE INTO renovation_owner_types (id, title, description, sort_order) VALUES
  (1, 'For investors preparing to sell',   'We focus on upgrades that maximize sale price and minimize time on market. Every dollar spent is evaluated against the return it generates.', 0),
  (2, 'For landlords and rental owners',   'We prioritize durable, attractive finishes that hold up over time, reduce ongoing maintenance, and justify higher rental rates.', 1),
  (3, 'For NRI and overseas owners',       'We manage the entire renovation remotely on your behalf, with regular photo and video updates, transparent budgeting, and zero need for you to be on-site.', 2),
  (4, 'For luxury property owners',        'We deliver high-specification finishes and premium craftsmanship that match the calibre of the property and the expectations of the market it serves.', 3);

-- ─── Why EverNorth bullet items ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS renovation_why_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  text        VARCHAR(500) NOT NULL,
  sort_order  INT          DEFAULT 0,
  is_active   TINYINT(1)   DEFAULT 1
);

INSERT IGNORE INTO renovation_why_items (id, text, sort_order) VALUES
  (1, 'ROI-focused planning before any work begins',                      0),
  (2, 'Experienced renovation team with close attention to detail',        1),
  (3, 'Transparent budgeting with no hidden costs or surprise bills',      2),
  (4, 'Full project management from start to finish',                      3),
  (5, 'Consistent quality standards across every property we work on',     4),
  (6, 'Remote management available for NRI and overseas owners',           5),
  (7, 'On-time delivery so your property gets back to market faster',      6);

-- ─── FAQ items ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS renovation_faq (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  question    VARCHAR(500) NOT NULL,
  answer      TEXT,
  sort_order  INT          DEFAULT 0,
  is_active   TINYINT(1)   DEFAULT 1
);

INSERT IGNORE INTO renovation_faq (id, question, answer, sort_order) VALUES
  (1, 'How does EverNorth decide which renovations are worth doing?',
      'We start every project by understanding your goal, whether that is maximizing sale price, increasing rental income, or improving long-term asset value. From there, we recommend upgrades based on what will deliver the strongest return for your specific property and market. We will never push renovations that do not make financial sense for you.', 0),
  (2, 'How long does a typical renovation take?',
      'Timelines vary depending on the scope of work. A focused upgrade such as a kitchen or bathroom renovation typically takes two to four weeks. A full property renovation can take six to twelve weeks. We provide a clear timeline before work begins and communicate proactively if anything changes along the way.', 1),
  (3, 'Do you handle permits and approvals?',
      'Yes. For renovations that require permits or local authority approvals, we manage the entire process on your behalf. We know the requirements across Canadian jurisdictions and make sure all work is compliant, documented, and signed off correctly.', 2),
  (4, 'How is the renovation budget managed?',
      'We provide a detailed cost breakdown before any work begins so you know exactly what you are paying for. Throughout the project, we track spending transparently and flag any changes before they happen. There are no surprise invoices at the end, just clear, honest budgeting from start to finish.', 3);