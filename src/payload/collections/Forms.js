export const Forms = {
  slug: 'forms',
  fields: [
    { name: 'title', type: 'text', label: 'Title' },
    { name: 'submitButtonLabel', type: 'text', label: 'Submit Button Label' },
    { name: 'confirmationType', type: 'select', label: 'Confirmation Type', options: ['message', 'redirect'] },
    { name: 'confirmationMessage', type: 'richText', label: 'Confirmation Message' },
    { name: 'redirect', type: 'text', label: 'Redirect URL' },
    { name: 'fields', type: 'array', label: 'Fields', fields: [
      { name: 'blockType', type: 'select', label: 'Field Type', options: ['text','textarea','email','number','checkbox','select','country','state'] },
      { name: 'name', type: 'text', label: 'Name' },
      { name: 'label', type: 'text', label: 'Label' },
      { name: 'required', type: 'checkbox', label: 'Required' },
      { name: 'width', type: 'number', label: 'Width %' },
    ] },
  ]
}
