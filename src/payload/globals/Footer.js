export const Footer = {
  slug: 'footer',
  fields: [
    {"name":"navItems","type":"array","label":"Nav Items","fields":[{"name":"link","type":"group","fields":[{"name":"type","type":"select","label":"Type","options":["custom","reference"],"defaultValue":"custom"},{"name":"label","type":"text","label":"Label"},{"name":"url","type":"text","label":"URL"},{"name":"newTab","type":"checkbox","label":"Open in new tab"},{"name":"appearance","type":"select","label":"Appearance","options":["default","outline"]}]}]},
  ]
}
