// Ce que la page publiée sur claude.ai ajoute au navigateur, pour que la vérification de types le connaisse.
interface Window {
  claude?: { use(capability: string): Promise<any> };
  webkitAudioContext?: typeof AudioContext;
}
