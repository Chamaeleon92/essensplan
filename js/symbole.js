// Symbole als SVG. Sie übernehmen die Textfarbe (currentColor) und sehen
// auf allen Geräten gleich aus – anders als Emojis.

const svg = (inhalt, { groesse = 22, strich = 2.2, fuellung = 'none' } = {}) => `
  <svg class="symbol" width="${groesse}" height="${groesse}" viewBox="0 0 24 24" fill="${fuellung}"
       stroke="currentColor" stroke-width="${strich}" stroke-linecap="round" stroke-linejoin="round"
       aria-hidden="true">${inhalt}</svg>`;

export const symbol = {
  kalender: (o) => svg('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>', o),
  buch: (o) => svg('<path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/><path d="M9 8h5"/>', o),
  etikett: (o) => svg('<path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>', o),
  wagen: (o) => svg('<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.6 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 7H6"/>', o),
  links: (o) => svg('<path d="M15 18l-6-6 6-6"/>', { strich: 2.6, ...o }),
  rechts: (o) => svg('<path d="M9 18l6-6-6-6"/>', { strich: 2.6, ...o }),
  plus: (o) => svg('<path d="M12 5v14M5 12h14"/>', { strich: 2.8, ...o }),
  wuerfel: (o) => svg('<rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="9" cy="9" r="1.2" fill="currentColor"/><circle cx="15" cy="15" r="1.2" fill="currentColor"/><circle cx="15" cy="9" r="1.2" fill="currentColor"/><circle cx="9" cy="15" r="1.2" fill="currentColor"/>', o),
  uhr: (o) => svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', o),
  stern: (o) => svg('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>', { strich: 1.6, ...o }),
  stift: (o) => svg('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>', o),
  muell: (o) => svg('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>', o),
  schliessen: (o) => svg('<path d="M6 6l12 12M18 6L6 18"/>', { strich: 2.6, ...o }),
  haken: (o) => svg('<path d="M5 12l5 5 9-10"/>', { strich: 2.8, ...o }),
  teller: (o) => svg('<path d="M3 12h18"/><path d="M4 12a8 8 0 0 0 16 0"/><path d="M9 7c0-1.5 1-2 1-3"/><path d="M13 7c0-1.5 1-2 1-3"/>', { strich: 1.8, ...o }),
  kamera: (o) => svg('<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>', o),
  herz: (o) => svg('<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z"/>', { strich: 2, ...o }),
  lupe: (o) => svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>', o),
  kopieren: (o) => svg('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>', o),
};
