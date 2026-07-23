import { createModel, supabase, rowToDoc, keysToSnake } from '../lib/queryModel.js';

/**
 * Mongoose sub-documents support `array.id(someId)` (find a sub-doc by its
 * _id) and `subdoc.deleteOne()` (remove itself from the parent array).
 * navController.js uses both. We attach lightweight, non-enumerable
 * equivalents to a plain children array so that controller code — entirely
 * unmodified — keeps working:
 *   item.children.push({...})
 *   item.children.id(childId)
 *   child.deleteOne()
 *   item.save()   <-- persists the whole children array to nav_children
 */
function hydrateChildrenArray(children) {
  Object.defineProperty(children, 'id', {
    enumerable: false,
    value: function findChildById(id) {
      return this.find((c) => c._id === id) || null;
    },
  });
  for (const child of children) {
    Object.defineProperty(child, 'deleteOne', {
      enumerable: false,
      value: function deleteOne() {
        const idx = children.indexOf(this);
        if (idx !== -1) children.splice(idx, 1);
      },
    });
  }
  return children;
}

async function loadChildren(navItemId) {
  const { data, error } = await supabase
    .from('nav_children')
    .select('*')
    .eq('nav_item_id', navItemId)
    .order('order', { ascending: true });
  if (error) throw new Error(`[Supabase] loading nav_children: ${error.message}`);
  return hydrateChildrenArray((data || []).map(rowToDoc));
}

async function persistChildren(navItemId, children) {
  await supabase.from('nav_children').delete().eq('nav_item_id', navItemId);
  if (!children || children.length === 0) return;
  const rows = children.map((child, i) => {
    const { _id, ...rest } = child;
    const payload = keysToSnake(rest);
    payload.nav_item_id = navItemId;
    payload.order = rest.order ?? i;
    // Preserve existing child IDs (new ones created via .push() have no
    // _id yet, so gen_random_uuid() default takes over on insert).
    if (_id) payload.id = _id;
    return payload;
  });
  const { error } = await supabase.from('nav_children').insert(rows);
  if (error) throw new Error(`[Supabase] persisting nav_children: ${error.message}`);
}

const base = createModel('nav_items', {
  afterFind: async (doc) => {
    doc.children = await loadChildren(doc._id);
    return doc;
  },
});

// Wrap save() so that updating `item.children` (push/assign/deleteOne) and
// calling `item.save()` persists the children array too, not just the
// nav_items row. base.findById/findOne already attach a save() via
// attachSave() in queryModel.js — we override it here specifically for
// nav_items to also sync children.
function attachNavSave(doc) {
  if (!doc) return doc;
  const plainSave = doc.save?.bind(doc);
  Object.defineProperty(doc, 'save', {
    enumerable: false,
    value: async function save() {
      const { children, ...rest } = this;
      if (plainSave) {
        // Persist scalar nav_items fields (order, label, path, enabled, ...)
        Object.assign(this, rest);
        await plainSave();
      }
      await persistChildren(this._id, children);
      this.children = hydrateChildrenArray(children || []);
      return this;
    },
  });
  return doc;
}

const NavItem = {
  ...base,

  find(filter) {
    const q = base.find(filter);
    const originalRun = q._run.bind(q);
    q._run = async () => originalRun();
    return q;
  },

  async findById(id) {
    const doc = await base.findById(id);
    return attachNavSave(doc);
  },

  async findOne(filter) {
    const doc = await base.findOne(filter);
    return attachNavSave(doc);
  },

  async create(data) {
    const { children, ...rest } = data;
    const doc = await base.create(rest);
    if (children && children.length) {
      await persistChildren(doc._id, children);
      doc.children = hydrateChildrenArray(children);
    } else {
      doc.children = hydrateChildrenArray([]);
    }
    return doc;
  },

  async findByIdAndUpdate(id, update, options) {
    const { children, ...rest } = update;
    const doc = await base.findByIdAndUpdate(id, rest, options);
    if (!doc) return doc;
    if (children !== undefined) {
      await persistChildren(id, children);
      doc.children = hydrateChildrenArray(children);
    }
    return doc;
  },

  async findByIdAndDelete(id) {
    // nav_children rows cascade-delete via the FK (on delete cascade).
    return base.findByIdAndDelete(id);
  },

  async insertMany(items) {
    // Used by utils/seed.js to bulk-create default nav items, several of
    // which include an embedded `children` array — handle each the same
    // way create() does so children actually get persisted.
    const results = [];
    for (const item of items) {
      results.push(await NavItem.create(item));
    }
    return results;
  },
};

export default NavItem;
