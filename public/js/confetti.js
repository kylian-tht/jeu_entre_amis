// =====================================================
// confetti.js - Moteur de confettis festifs en Canvas pur
// 100% natif, ultra léger, 60 FPS, zéro dépendance
// =====================================================

(function () {
  let canvas = null;
  let ctx = null;
  let animationId = null;
  let particules = [];
  let finAnimation = 0;

  const COULEURS_SOIREE = [
    '#ff2a85', // Rose néon
    '#00f5d4', // Cyan néon
    '#fbbf24', // Or ambré
    '#a855f7', // Violet néon
    '#f43f5e', // Corail vibrant
    '#38bdf8', // Bleu électrique
    '#ffffff', // Éclat blanc
    '#facc15'  // Jaune doré
  ];

  function creerCanvas() {
    if (canvas) return;
    canvas = document.createElement('canvas');
    canvas.id = 'canvas-confettis-soiree';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '99999';
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');

    redimensionner();
    window.addEventListener('resize', redimensionner);
  }

  function redimensionner() {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    if (ctx) ctx.scale(dpr, dpr);
  }

  class Particule {
    constructor(x, y, vx, vy, taille, couleur, type) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.taille = taille;
      this.couleur = couleur;
      this.type = type; // 'rect', 'cercle', 'ruban'
      this.angle = Math.random() * Math.PI * 2;
      this.vitesseRot = (Math.random() - 0.5) * 0.2;
      this.gravite = 0.25 + Math.random() * 0.2;
      this.resistance = 0.985;
      this.oscillation = Math.random() * Math.PI;
      this.vitesseOscillation = 0.05 + Math.random() * 0.05;
      this.opacite = 1;
    }

    update() {
      this.vx *= this.resistance;
      this.vy += this.gravite;
      this.vy *= this.resistance;

      this.x += this.vx + Math.sin(this.oscillation) * 1.5;
      this.y += this.vy;
      this.angle += this.vitesseRot;
      this.oscillation += this.vitesseOscillation;

      // Fondu en bas d'écran
      if (this.y > window.innerHeight - 150) {
        this.opacite = Math.max(0, this.opacite - 0.02);
      }
    }

    dessiner(contexte) {
      if (this.opacite <= 0) return;
      contexte.save();
      contexte.translate(this.x, this.y);
      contexte.rotate(this.angle);
      contexte.globalAlpha = this.opacite;
      contexte.fillStyle = this.couleur;

      if (this.type === 'cercle') {
        contexte.beginPath();
        contexte.arc(0, 0, this.taille / 2, 0, Math.PI * 2);
        contexte.fill();
      } else if (this.type === 'ruban') {
        contexte.fillRect(-this.taille, -this.taille / 4, this.taille * 2, this.taille / 2);
      } else {
        // Rectangle confetti classique
        contexte.fillRect(-this.taille / 2, -this.taille / 2, this.taille, this.taille * 1.5);
      }
      contexte.restore();
    }
  }

  function animer() {
    if (!ctx) return;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (let i = particules.length - 1; i >= 0; i--) {
      const p = particules[i];
      p.update();
      p.dessiner(ctx);

      if (p.y > window.innerHeight + 50 || p.opacite <= 0) {
        particules.splice(i, 1);
      }
    }

    if (Date.now() < finAnimation || particules.length > 0) {
      animationId = requestAnimationFrame(animer);
    } else {
      if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
        canvas = null;
        ctx = null;
      }
      animationId = null;
    }
  }

  function tirerExplosion(x, y, count = 70, vitesse = 12) {
    creerCanvas();
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const v = (Math.random() * 0.7 + 0.3) * vitesse;
      const vx = Math.cos(angle) * v;
      const vy = Math.sin(angle) * v - Math.random() * 6; // Pousse vers le haut
      const taille = Math.random() * 8 + 6;
      const coul = COULEURS_SOIREE[Math.floor(Math.random() * COULEURS_SOIREE.length)];
      const types = ['rect', 'cercle', 'ruban'];
      const type = types[Math.floor(Math.random() * types.length)];
      particules.push(new Particule(x, y, vx, vy, taille, coul, type));
    }
  }

  function tirerGerbesPodium() {
    creerCanvas();
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Gerbe gauche vers le centre-haut
    for (let i = 0; i < 75; i++) {
      const angle = -Math.PI / 4 + (Math.random() - 0.5) * 0.5;
      const v = Math.random() * 16 + 10;
      const vx = Math.cos(angle) * v;
      const vy = Math.sin(angle) * v;
      const taille = Math.random() * 9 + 6;
      const coul = COULEURS_SOIREE[Math.floor(Math.random() * COULEURS_SOIREE.length)];
      particules.push(new Particule(w * 0.15, h * 0.9, vx, vy, taille, coul, 'rect'));
    }

    // Gerbe droite vers le centre-haut
    for (let i = 0; i < 75; i++) {
      const angle = (-3 * Math.PI) / 4 + (Math.random() - 0.5) * 0.5;
      const v = Math.random() * 16 + 10;
      const vx = Math.cos(angle) * v;
      const vy = Math.sin(angle) * v;
      const taille = Math.random() * 9 + 6;
      const coul = COULEURS_SOIREE[Math.floor(Math.random() * COULEURS_SOIREE.length)];
      particules.push(new Particule(w * 0.85, h * 0.9, vx, vy, taille, coul, 'rect'));
    }
  }

  function tirerPluieContinue(dureeMs = 4000) {
    creerCanvas();
    finAnimation = Date.now() + dureeMs;

    const intervalle = setInterval(() => {
      if (Date.now() > finAnimation) {
        clearInterval(intervalle);
        return;
      }
      const w = window.innerWidth;
      for (let i = 0; i < 6; i++) {
        const x = Math.random() * w;
        const vx = (Math.random() - 0.5) * 3;
        const vy = Math.random() * 2 + 1;
        const taille = Math.random() * 8 + 5;
        const coul = COULEURS_SOIREE[Math.floor(Math.random() * COULEURS_SOIREE.length)];
        particules.push(new Particule(x, -20, vx, vy, taille, coul, 'rect'));
      }
    }, 80);

    if (!animationId) {
      animer();
    }
  }

  // API publique exposée sur window
  window.confettis = {
    // Explosion festive centrée (ex: écran téléphone vainqueur)
    explosion: function (x, y) {
      const posX = x !== undefined ? x : window.innerWidth / 2;
      const posY = y !== undefined ? y : window.innerHeight * 0.45;
      tirerExplosion(posX, posY, 90, 15);
      tirerPluieContinue(3500);
      if (!animationId) animer();
    },

    // Spectacle complet podium TV (double gerbe + pluie)
    podiumTV: function () {
      tirerGerbesPodium();
      setTimeout(tirerGerbesPodium, 1200);
      tirerPluieContinue(5000);
      if (!animationId) animer();
    }
  };

  // Raccourci universel
  window.lancerConfettis = function () {
    if (window.confettis) {
      if (document.getElementById('tv-app') || window.location.pathname.includes('tv')) {
        window.confettis.podiumTV();
      } else {
        window.confettis.explosion();
      }
    }
  };
})();
