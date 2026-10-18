// Der "Yummiiiieee"-Ton, wenn die ganze Woche geplant ist.
// Wird direkt im Browser erzeugt (Web Audio) – es gibt keine Tondatei.
//
// Ablauf: kleine Fanfare (vier Töne aufwärts), dann ein hoher, gleitender
// "Yummiiiieee"-Pfiff mit Vibrato, dazu sagt die Sprachausgabe "Yummy!".
//
// Hinweis: Am iPhone bleibt die App stumm, wenn der Lautlos-Schalter an ist.

let kontext = null;

function kontextHolen() {
  if (!kontext) {
    const AudioKontext = window.AudioContext || window.webkitAudioContext;
    if (!AudioKontext) return null;
    kontext = new AudioKontext();
  }
  return kontext;
}

// Browser spielen Töne erst ab, nachdem man einmal getippt hat.
// Deshalb schalten wir den Ton bei jeder Berührung frei (falls noch nötig).
export function tonFreischalten() {
  const k = kontextHolen();
  if (k && k.state !== 'running') k.resume();
}

// Ein kurzer Ton mit weichem Ein- und Ausklang
function ton(k, ziel, frequenz, start, dauer, form = 'triangle', lautstaerke = 0.5) {
  const oszillator = k.createOscillator();
  const huelle = k.createGain();
  oszillator.type = form;
  oszillator.frequency.setValueAtTime(frequenz, start);
  huelle.gain.setValueAtTime(0, start);
  huelle.gain.linearRampToValueAtTime(lautstaerke, start + 0.015);
  huelle.gain.exponentialRampToValueAtTime(0.001, start + dauer);
  oszillator.connect(huelle).connect(ziel);
  oszillator.start(start);
  oszillator.stop(start + dauer + 0.05);
}

export function yummi() {
  const k = kontextHolen();
  if (!k) return;
  k.resume();

  const gesamt = k.createGain();
  gesamt.gain.value = 0.35;
  gesamt.connect(k.destination);
  const jetzt = k.currentTime + 0.05;

  // 1. Fanfare: C – E – G – C, der letzte Ton etwas länger
  const fanfare = [523.25, 659.25, 783.99, 1046.5];
  fanfare.forEach((frequenz, i) => {
    ton(k, gesamt, frequenz, jetzt + i * 0.09, i === 3 ? 0.35 : 0.14);
  });

  // 2. "Yummiiiieee": gleitet hoch und ein bisschen wieder runter, mit Vibrato
  const start = jetzt + 0.45;
  const ende = start + 0.9;
  const pfiff = k.createOscillator();
  const huelle = k.createGain();
  pfiff.type = 'sine';
  pfiff.frequency.setValueAtTime(620, start);
  pfiff.frequency.exponentialRampToValueAtTime(1320, start + 0.28);
  pfiff.frequency.exponentialRampToValueAtTime(1050, ende);

  const vibrato = k.createOscillator();
  const vibratoStaerke = k.createGain();
  vibrato.frequency.value = 7;
  vibratoStaerke.gain.value = 30;
  vibrato.connect(vibratoStaerke).connect(pfiff.frequency);

  huelle.gain.setValueAtTime(0, start);
  huelle.gain.linearRampToValueAtTime(0.4, start + 0.06);
  huelle.gain.setValueAtTime(0.4, ende - 0.25);
  huelle.gain.exponentialRampToValueAtTime(0.001, ende);
  pfiff.connect(huelle).connect(gesamt);

  pfiff.start(start);
  vibrato.start(start);
  pfiff.stop(ende + 0.05);
  vibrato.stop(ende + 0.05);

  // 3. Die Sprachausgabe des Geräts sagt "Yummy!" – hoch und gedehnt
  setTimeout(sprechen, 450);
}

function sprechen() {
  if (!('speechSynthesis' in window)) return;
  const satz = new SpeechSynthesisUtterance('Yummy!');
  const stimme = speechSynthesis.getVoices().find((s) => s.lang.startsWith('en'));
  if (stimme) satz.voice = stimme;
  satz.lang = stimme?.lang ?? 'en-US';
  satz.pitch = 1.8;
  satz.rate = 0.75;
  satz.volume = 1;
  speechSynthesis.cancel();
  speechSynthesis.speak(satz);
}
