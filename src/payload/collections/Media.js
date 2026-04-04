export const Media = {
  slug: 'media',
  fields: [
    { name: 'filename', type: 'text', label: 'Filename' },
    { name: 'alt', type: 'text', label: 'Alt Text' },
    { name: 'mimeType', type: 'text', label: 'MIME Type', admin: { readOnly: true } },
    { name: 'filesize', type: 'number', label: 'File Size (bytes)', admin: { readOnly: true } },
    { name: 'width', type: 'number', label: 'Width', admin: { readOnly: true } },
    { name: 'height', type: 'number', label: 'Height', admin: { readOnly: true } },
  ]
}
