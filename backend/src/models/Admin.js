import bcrypt from 'bcryptjs';
import { createModel } from '../lib/queryModel.js';

const base = createModel('admins');

// Mongoose gave every returned document `.comparePassword()` and hid
// `passwordHash` from JSON responses via a toJSON transform. authController
// calls `admin.comparePassword(password)` directly on documents returned by
// findOne/findById, so we attach the same method here, and strip
// passwordHash the same way res.json() would have (JSON.stringify calls
// .toJSON() on any object that defines it).
function attachInstanceHelpers(doc) {
  if (!doc) return doc;
  Object.defineProperty(doc, 'comparePassword', {
    enumerable: false,
    value: function comparePassword(candidate) {
      return bcrypt.compare(candidate, this.passwordHash);
    },
  });
  Object.defineProperty(doc, 'toJSON', {
    enumerable: false,
    value: function toJSON() {
      const { passwordHash, ...rest } = this;
      return rest;
    },
  });
  return doc;
}

const Admin = {
  ...base,
  find(filter) {
    const q = base.find(filter);
    const originalRun = q._run.bind(q);
    q._run = async () => (await originalRun()).map(attachInstanceHelpers);
    return q;
  },
  findOne(filter) {
    const q = base.findOne(filter);
    const originalRun = q._run.bind(q);
    q._run = async () => attachInstanceHelpers(await originalRun());
    return q;
  },
  findById(id) {
    const q = base.findById(id);
    const originalRun = q._run.bind(q);
    q._run = async () => attachInstanceHelpers(await originalRun());
    return q;
  },
  async create(data) {
    return attachInstanceHelpers(await base.create(data));
  },
  hashPassword(plain) {
    return bcrypt.hash(plain, 12);
  },
};

export default Admin;
