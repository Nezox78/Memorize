import * as Speech from 'expo-speech';

let englishVoice: Promise<string | undefined> | null = null;

/**
 * Cherche une voix anglaise installée sur l'appareil. Sans voix explicite, certains
 * téléphones et navigateurs lisent le mot avec la voix de la langue du système (française).
 */
function findEnglishVoice(): Promise<string | undefined> {
  return Speech.getAvailableVoicesAsync()
    .then((voices) => {
      const english = voices.filter((voice) => /^en[-_]/i.test(voice.language) || voice.language === 'en');
      const rank = (voice: Speech.Voice) =>
        (/^en[-_]GB/i.test(voice.language) ? 0 : /^en[-_]US/i.test(voice.language) ? 1 : 2) +
        (voice.quality === Speech.VoiceQuality.Enhanced ? 0 : 0.5);
      return english.sort((a, b) => rank(a) - rank(b))[0]?.identifier;
    })
    .catch(() => undefined);
}

/** Prononce un mot anglais avec une voix anglaise (britannique de préférence). */
export async function speakEnglish(text: string) {
  englishVoice ??= findEnglishVoice();
  let voice = await englishVoice;
  if (!voice) {
    // Les voix se chargent parfois après le premier appel : on réessaie la fois suivante.
    englishVoice = null;
  }
  Speech.stop();
  Speech.speak(text, { language: 'en-GB', voice, rate: 0.9 });
}
