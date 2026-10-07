// =====================================================
// audio.js - Synthétiseur audio Web Audio API
// (100% autonome, zéro fichier MP3 externe à charger)
// =====================================================

class SoundManager {
  constructor() {
    this.ctx = null;
    this.muet = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMuet() {
    this.muet = !this.muet;
    return this.muet;
  }

  // Clic rapide pour la roulette
  clicRoulette(frequence = 520) {
    if (this.muet) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(frequence, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(frequence * 1.4, this.ctx.currentTime + 0.035);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.035);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch (_) {}
  }

  // Chime gagnant lorsque le thème est choisi
  gagnantRoulette() {
    if (this.muet) return;
    this.init();
    if (!this.ctx) return;
    try {
      const accords = [523.25, 659.25, 783.99, 1046.50];
      accords.forEach((freq, idx) => {
        const t = this.ctx.currentTime + idx * 0.08;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.16, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.4);
      });
    } catch (_) {}
  }

  // Bip de compte à rebours
  bipCompte(haut = false) {
    if (this.muet) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const freq = haut ? 880 : 440;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + (haut ? 0.22 : 0.09));
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + (haut ? 0.24 : 0.11));
    } catch (_) {}
  }

  // Fanfare joyeuse pour le podium final
  fanfarePodium() {
    if (this.muet) return;
    this.init();
    if (!this.ctx) return;
    try {
      const notes = [
        { f: 392.00, d: 0.14, att: 0.0 },   // Sol4
        { f: 523.25, d: 0.14, att: 0.14 },  // Do5
        { f: 659.25, d: 0.14, att: 0.28 },  // Mi5
        { f: 783.99, d: 0.55, att: 0.42 },  // Sol5 (tenu)
        { f: 659.25, d: 0.14, att: 1.05 },  // Mi5
        { f: 783.99, d: 0.75, att: 1.20 }   // Sol5 (final)
      ];
      notes.forEach((n) => {
        const t = this.ctx.currentTime + n.att;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, t);
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + n.d);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + n.d + 0.04);
      });
    } catch (_) {}
  }

  // Petit son pop joyeux pour les réactions en direct
  popReaction() {
    if (this.muet) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1100, this.ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch (_) {}
  }

  // Son de tirage / reroll de cartes
  sonReroll() {
    if (this.muet) return;
    this.init();
    if (!this.ctx) return;
    try {
      const notes = [440, 554.37, 659.25];
      notes.forEach((freq, idx) => {
        const t = this.ctx.currentTime + idx * 0.06;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.14, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.16);
      });
    } catch (_) {}
  }
}

window.audio = new SoundManager();
