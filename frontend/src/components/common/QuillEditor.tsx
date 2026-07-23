import { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

interface QuillEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

// A thin wrapper around Quill's vanilla API (rather than a React wrapper
// package) so content stays as plain HTML — matching what the backend's
// CmsPage.contentHtml field already stores and what the public site
// renders via dangerouslySetInnerHTML.
export default function QuillEditor({ value, onChange, placeholder }: QuillEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current || quillRef.current) return;

    const quill = new Quill(containerRef.current, {
      theme: 'snow',
      placeholder,
      modules: {
        toolbar: [
          [{ header: [2, 3, false] }],
          ['bold', 'italic', 'underline'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link', 'blockquote'],
          ['clean'],
        ],
      },
    });

    if (value) {
      quill.clipboard.dangerouslyPasteHTML(value);
    }

    quill.on('text-change', () => {
      onChangeRef.current(quill.root.innerHTML);
    });

    quillRef.current = quill;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the editor in sync if `value` changes from outside (e.g. switching
  // between CMS pages), without fighting the user's own typing.
  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;
    if (value !== quill.root.innerHTML) {
      quill.clipboard.dangerouslyPasteHTML(value || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="bg-white rounded border border-stone-300 overflow-hidden">
      <div ref={containerRef} style={{ minHeight: '280px' }} />
    </div>
  );
}
