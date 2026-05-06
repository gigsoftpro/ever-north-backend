const router  = require('express').Router();
const c       = require('../controllers/contentController');
const { protect } = require('../middleware/auth');

router.get('/site', c.getSiteData);

router.get('/hero',         c.getHero);
router.get('/about',        c.getAbout);
router.get('/services',     c.getServices);
router.get('/cleaning',     c.getCleaningSection);
router.get('/maintenance',  c.getMaintenanceSection);
router.get('/areas',        c.getAreasSection);
router.get('/testimonials', c.getTestimonials);
router.get('/header',       c.getHeader);
router.get('/nav',          c.getNavLinks);
router.get('/footer',       c.getFooter);

router.post('/contact', c.submitContact);

router.use(protect); // everything below requires JWT

router.put('/hero', c.updateHero);

// About
router.put('/about', c.updateAbout);

// Services CRUD
router.post('/services',       c.createService);
router.put('/services/:id',    c.updateService);
router.delete('/services/:id', c.deleteService);

// Cleaning section
router.put('/cleaning/meta',         c.updateCleaningMeta);
router.post('/cleaning/items',       c.createCleaningItem);
router.put('/cleaning/items/:id',    c.updateCleaningItem);
router.delete('/cleaning/items/:id', c.deleteCleaningItem);

// Maintenance section
router.put('/maintenance/meta',          c.updateMaintenanceMeta);
router.post('/maintenance/items',        c.createMaintenanceItem);
router.put('/maintenance/items/:id',     c.updateMaintenanceItem);
router.delete('/maintenance/items/:id',  c.deleteMaintenanceItem);

// Areas CRUD
router.put('/areas/meta',    c.updateAreasMeta);
router.post('/areas',        c.createArea);
router.put('/areas/:id',     c.updateArea);
router.delete('/areas/:id',  c.deleteArea);

// Testimonials CRUD
router.get('/testimonials/all',      c.getAllTestimonials);
router.post('/testimonials',         c.createTestimonial);
router.put('/testimonials/:id',      c.updateTestimonial);
router.delete('/testimonials/:id',   c.deleteTestimonial);

// Header / Nav / Footer
router.put('/header',       c.updateHeader);
router.put('/nav/:id',      c.updateNavLink);
router.put('/footer',       c.updateFooter);

// Contact submissions
router.get('/contact',           c.getContactSubmissions);
router.patch('/contact/:id/read', c.markContactRead);
router.delete('/contact/:id',    c.deleteContactSubmission);

module.exports = router;
