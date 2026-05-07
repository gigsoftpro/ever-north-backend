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