import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
  ClassicEditor,
  Autoformat,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Subscript,
  Superscript,
  Essentials,
  Heading,
  Image,
  ImageCaption,
  ImageResize,
  ImageStyle,
  ImageToolbar,
  ImageUpload,
  Link,
  List,
  Paragraph,
  Table,
  TableToolbar,
  TableColumnResize,
  TableCellProperties,
  TableProperties,
  Alignment,
  Font,
  MediaEmbed,
  HorizontalLine,
  PageBreak,
  BlockQuote,
  Undo,
  PasteFromOffice,
  SimpleUploadAdapter,
  RemoveFormat
} from 'ckeditor5';
import 'ckeditor5/ckeditor5.css';
import { baseURL } from '@/lib/api';

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: Props) {
  const token = localStorage.getItem('catalyst_admin_token') || '';

  return (
    <div className="rich-text-editor-wrapper">
      <CKEditor
        editor={ClassicEditor}
        data={value}
        onChange={(_event, editor) => {
          onChange(editor.getData());
        }}
        config={{
          licenseKey: 'GPL',
          placeholder: placeholder || 'Write content here...',
          plugins: [
            Essentials, Autoformat, Bold, Italic, Underline, Strikethrough, Subscript, Superscript,
            Heading, Image, ImageCaption, ImageResize, ImageStyle, ImageToolbar, ImageUpload, Link, List, Paragraph,
            Table, TableToolbar, TableColumnResize, TableCellProperties, TableProperties, Alignment, Font,
            MediaEmbed, HorizontalLine, PageBreak, BlockQuote, Undo, PasteFromOffice, SimpleUploadAdapter, RemoveFormat
          ],
          toolbar: [
            'undo', 'redo', '|',
            'heading', '|',
            'fontFamily', 'fontSize', 'fontColor', 'fontBackgroundColor', '|',
            'bold', 'italic', 'underline', 'strikethrough', 'subscript', 'superscript', 'removeFormat', '|',
            'alignment', 'bulletedList', 'numberedList', 'outdent', 'indent', '|',
            'link', 'uploadImage', 'insertTable', 'mediaEmbed', 'blockQuote', 'horizontalLine', 'pageBreak'
          ],
          heading: {
            options: [
              { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
              { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
              { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
              { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
              { model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
              { model: 'heading5', view: 'h5', title: 'Heading 5', class: 'ck-heading_heading5' },
              { model: 'heading6', view: 'h6', title: 'Heading 6', class: 'ck-heading_heading6' }
            ]
          },
          image: {
            toolbar: [
              'imageTextAlternative', 'toggleImageCaption', 'imageStyle:inline',
              'imageStyle:block', 'imageStyle:side'
            ]
          },
          table: {
            contentToolbar: [
              'tableColumn', 'tableRow', 'mergeTableCells',
              'tableCellProperties', 'tableProperties'
            ]
          },
          simpleUpload: {
            uploadUrl: `${baseURL}/admin/pages/image-upload`,
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        }}
      />
    </div>
  );
}
