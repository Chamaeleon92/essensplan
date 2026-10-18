// Ein kurzer Konfetti-Regen – zur Feier einer komplett geplanten Woche.

const FARBEN = ['#5B3FD9', '#FF7A59', '#FFC53D', '#1F9D74', '#8B73FF', '#FF9E8F'];
const ANZAHL = 90;

export function konfetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const buehne = document.createElement('div');
  buehne.className = 'konfetti';
  buehne.setAttribute('aria-hidden', 'true');
  document.body.append(buehne);

  const breite = window.innerWidth;
  const hoehe = window.innerHeight;
  const animationen = [];

  for (let i = 0; i < ANZAHL; i++) {
    const teil = document.createElement('span');
    teil.style.background = FARBEN[i % FARBEN.length];
    teil.style.left = `${Math.random() * breite}px`;
    if (i % 3 === 0) teil.style.borderRadius = '50%';
    buehne.append(teil);

    const seitwaerts = (Math.random() - 0.5) * 160;
    const drehung = (Math.random() - 0.5) * 1080;
    animationen.push(teil.animate([
      { transform: 'translate(0, -20px) rotate(0deg)', opacity: 1 },
      { transform: `translate(${seitwaerts}px, ${hoehe + 40}px) rotate(${drehung}deg)`, opacity: 0.9 },
    ], {
      duration: 1600 + Math.random() * 1400,
      delay: Math.random() * 300,
      easing: 'cubic-bezier(0.2, 0.6, 0.4, 1)',
      fill: 'forwards',
    }).finished);
  }

  Promise.all(animationen).finally(() => buehne.remove());
}
