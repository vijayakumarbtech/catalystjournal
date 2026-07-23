import { supabase } from '../config/supabase.js';

/**
 * A multer StorageEngine that uploads files directly to Supabase Storage
 * instead of writing them to local disk. This is a drop-in replacement for
 * multer.diskStorage — it still calls back with a `file` object that has
 * `.filename` and `.path` populated, so any code reading those (e.g. error
 * handlers, logging) keeps working the same shape it always has.
 *
 * The one behavioral difference callers need is `file.publicUrl`, the
 * Supabase Storage public URL — set alongside `.filename` so callers can
 * use whichever they need.
 */
class SupabaseStorageEngine {
  constructor({ bucketFor }) {
    this.bucketFor = bucketFor; // (fieldname) => bucket name string
  }

  _handleFile(req, file, cb) {
    const bucket = this.bucketFor(file.fieldname);
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const objectPath = `${unique}-${safe}`;

    const chunks = [];
    file.stream.on('data', (chunk) => chunks.push(chunk));
    file.stream.on('error', (err) => cb(err));
    file.stream.on('end', async () => {
      try {
        const buffer = Buffer.concat(chunks);
        const { error } = await supabase.storage
          .from(bucket)
          .upload(objectPath, buffer, {
            contentType: file.mimetype,
            upsert: false,
          });
        if (error) return cb(new Error(`Supabase Storage upload failed: ${error.message}`));

        const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(objectPath);

        cb(null, {
          filename: objectPath,
          path: publicUrlData.publicUrl, // full Supabase public URL
          publicUrl: publicUrlData.publicUrl,
          bucket,
          size: buffer.length,
        });
      } catch (err) {
        cb(err);
      }
    });
  }

  _removeFile(req, file, cb) {
    supabase.storage
      .from(file.bucket)
      .remove([file.filename])
      .then(() => cb(null))
      .catch((err) => cb(err));
  }
}

export function supabaseStorage(bucketFor) {
  return new SupabaseStorageEngine({ bucketFor });
}

/**
 * Deletes an object from Supabase Storage given its full public URL
 * (the shape stored in the database, e.g. Article.pdfUrl). Used when
 * replacing/removing a previously-uploaded file. Safe to call with a URL
 * that isn't a Supabase Storage URL (e.g. a legacy /uploads/... path from
 * before this migration) — it's a no-op in that case.
 */
export async function deleteByPublicUrl(publicUrl) {
  if (!publicUrl) return;
  const match = publicUrl.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  if (!match) return;
  const [, bucket, objectPath] = match;
  await supabase.storage.from(bucket).remove([decodeURIComponent(objectPath)]);
}
