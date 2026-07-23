import { createModel } from '../lib/queryModel.js';

// Singleton document (singletonKey: 'main'). getOrCreateSettings() in
// settingsController.js handles the find-or-create logic; this model just
// needs standard find/create/findOneAndUpdate, all provided generically.
// Nested defaults (socials, announcementBar, stats, hero, paymentMethods,
// heroImages) are Postgres column defaults (see settings table in
// 001_schema.sql) so `Settings.create({ singletonKey: 'main' })` — which
// only ever sends that one field — still yields a fully-populated document,
// matching Mongoose's schema-default behavior.
export default createModel('settings');
