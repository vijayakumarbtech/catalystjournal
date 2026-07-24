import Hero from '../models/Hero.js';

export async function getPublicHeroes(req, res, next) {
  try {
    const heroes = await Hero.find({ isEnabled: true }, { orderBy: { displayOrder: 'asc' } });
    res.json({ success: true, data: heroes });
  } catch (err) {
    next(err);
  }
}

export async function adminListHeroes(req, res, next) {
  try {
    const heroes = await Hero.find({}, { orderBy: { displayOrder: 'asc' } });
    res.json({ success: true, data: heroes });
  } catch (err) {
    next(err);
  }
}

export async function createHero(req, res, next) {
  try {
    const hero = await Hero.create(req.body);
    res.status(201).json({ success: true, data: hero });
  } catch (err) {
    next(err);
  }
}

export async function updateHero(req, res, next) {
  try {
    const hero = await Hero.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!hero) {
      return res.status(404).json({ success: false, message: 'Hero not found' });
    }
    res.json({ success: true, data: hero });
  } catch (err) {
    next(err);
  }
}

export async function deleteHero(req, res, next) {
  try {
    const hero = await Hero.findByIdAndDelete(req.params.id);
    if (!hero) {
      return res.status(404).json({ success: false, message: 'Hero not found' });
    }
    res.json({ success: true, data: hero });
  } catch (err) {
    next(err);
  }
}
