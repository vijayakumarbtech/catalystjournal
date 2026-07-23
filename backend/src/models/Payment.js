import { createModel, supabase, rowToDoc } from '../lib/queryModel.js';

const base = createModel('payments', {
  fullTextColumns: 'fts',
  populateConfig: {
    // .populate('submission') -> replace the submission UUID string with
    // the full Submission document, matching Payment.submission:
    // Submission | string in the frontend types.
    submission: async (doc) => {
      if (!doc.submission) return doc;
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('id', doc.submission)
        .maybeSingle();
      if (error) throw new Error(`[Supabase] populate submission on payments: ${error.message}`);
      if (data) doc.submission = rowToDoc(data);
      return doc;
    },
  },
});

export default base;
