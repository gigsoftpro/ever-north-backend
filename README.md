# Ever North — Full-Stack CMS

React + Vite frontend with a Node.js / Express / MySQL backend for managing all website content and images.

---

## Quick Start

### 1 — MySQL
```bash
# Make sure MySQL is running, then:
mysql -u root -p < evernorth-backend/sql/schema.sql
```

### 2 — Backend
```bash
cd evernorth-backend
cp .env.example .env          # fill in DB credentials + JWT secret
npm install
node scripts/createAdmin.js   # hashes and saves the admin password
npm run dev                   # starts on http://localhost:5000
```

### 3 — Frontend
```bash
cd evernorth
cp .env.example .env          # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev                   # starts on http://localhost:5173
```

---

## API Reference

Base URL: `http://localhost:5000/api`

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/login` | ✗ | Login → returns JWT token |
| GET  | `/auth/me`    | ✓ | Get current admin info |
| POST | `/auth/change-password` | ✓ | Change password |

**Login example:**
```json
POST /api/auth/login
{ "username": "admin", "password": "Admin@1234" }
```

### Public Content (no auth needed — for frontend)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/content/site`         | All sections in one response |
| GET | `/content/hero`         | Hero section |
| GET | `/content/about`        | About section |
| GET | `/content/services`     | Services list |
| GET | `/content/cleaning`     | Cleaning section |
| GET | `/content/maintenance`  | Maintenance section |
| GET | `/content/areas`        | Areas we cover |
| GET | `/content/testimonials` | Active testimonials |
| GET | `/content/header`       | Header info |
| GET | `/content/nav`          | Navigation links |
| GET | `/content/footer`       | Footer content |
| POST| `/content/contact`      | Submit contact form |

### Admin Content (JWT required)
| Method | Path | Description |
|--------|------|-------------|
| PUT    | `/content/hero`              | Update hero text/images |
| PUT    | `/content/about`             | Update about section |
| POST   | `/content/services`          | Add service card |
| PUT    | `/content/services/:id`      | Edit service card |
| DELETE | `/content/services/:id`      | Remove service card |
| PUT    | `/content/cleaning/meta`     | Edit cleaning section heading |
| POST   | `/content/cleaning/items`    | Add cleaning circle item |
| PUT    | `/content/cleaning/items/:id`| Edit cleaning item |
| DELETE | `/content/cleaning/items/:id`| Remove cleaning item |
| PUT    | `/content/maintenance/meta`  | Edit maintenance heading |
| POST   | `/content/maintenance/items` | Add maintenance item |
| PUT/DELETE | `/content/maintenance/items/:id` | Edit/remove |
| PUT    | `/content/areas/meta`        | Edit areas heading |
| POST   | `/content/areas`             | Add area card |
| PUT/DELETE | `/content/areas/:id`     | Edit/remove area |
| GET    | `/content/testimonials/all`  | All testimonials (incl. inactive) |
| POST   | `/content/testimonials`      | Add testimonial |
| PUT/DELETE | `/content/testimonials/:id` | Edit/remove |
| PUT    | `/content/header`            | Update phone, email, logo |
| PUT    | `/content/nav/:id`           | Update nav link |
| PUT    | `/content/footer`            | Update footer content |
| GET    | `/content/contact`           | List form submissions |
| PATCH  | `/content/contact/:id/read`  | Mark submission as read |
| DELETE | `/content/contact/:id`       | Delete submission |

### Media
| Method | Path | Description |
|--------|------|-------------|
| POST   | `/media`     | Upload image (multipart/form-data, field: `image`) |
| GET    | `/media`     | List uploaded media (`?section=hero&page=1`) |
| DELETE | `/media/:id` | Delete media file |

**Upload image example:**
```js
const form = new FormData();
form.append('image', file);
form.append('section', 'hero');

fetch('/api/media', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: form,
});
```

### Changing an Image (2-step flow)
1. `POST /api/media` → get back `{ media: { id: 42, url: "..." } }`
2. `PUT /api/content/hero` with `{ "bg_image_id": 42 }`

---

## Environment Variables

### Backend (`evernorth-backend/.env`)
```
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=evernorth_cms
JWT_SECRET=very_long_random_string_min_64_chars
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
MAX_FILE_SIZE_MB=10
```

### Frontend (`evernorth/.env`)
```
VITE_API_URL=http://localhost:5000/api
```
"# ever-north-backend" 
