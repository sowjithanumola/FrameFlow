export interface SampleImage {
  id: string;
  title: string;
  category: string;
  width: number;
  height: number;
  dataUrl: string;
}

export type ProceduralType = 
  | 'celestial' 
  | 'cityscape' 
  | 'landscape' 
  | 'geometric' 
  | 'solar' 
  | 'cyber_grid' 
  | 'aurora' 
  | 'desert' 
  | 'abyssal' 
  | 'retrowave';

// Generates an attractive, high-resolution procedural image on an offscreen canvas
export function generateProceduralSample(type: ProceduralType): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 800;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const w = canvas.width;
  const h = canvas.height;

  if (type === 'celestial') {
    // Deep space with celestial ring
    const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, 50, w * 0.5, h * 0.5, w * 0.7);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(0.5, '#020617');
    bgGrad.addColorStop(1, '#000000');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 260; i++) {
      const sx = (Math.sin(i * 123.45) * 0.5 + 0.5) * w;
      const sy = (Math.cos(i * 678.91) * 0.5 + 0.5) * h;
      const r = (Math.sin(i * 45) * 0.5 + 0.5) * 1.8 + 0.4;
      ctx.globalAlpha = 0.3 + (i % 5) * 0.15;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Glowing core
    const coreGrad = ctx.createRadialGradient(w * 0.5, h * 0.48, 20, w * 0.5, h * 0.48, 260);
    coreGrad.addColorStop(0, '#38bdf8');
    coreGrad.addColorStop(0.3, '#0284c7');
    coreGrad.addColorStop(0.7, '#0369a1');
    coreGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.48, 260, 0, Math.PI * 2);
    ctx.fill();

    // Dark eclipse sphere
    ctx.fillStyle = '#030712';
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.48, 140, 0, Math.PI * 2);
    ctx.fill();

    // Orbital light rings
    ctx.strokeStyle = '#7dd3fc';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.48, 280, 80, -Math.PI / 12, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.48, 320, 100, -Math.PI / 12, 0, Math.PI * 2);
    ctx.stroke();

  } else if (type === 'cityscape') {
    // Dusk metropolis
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#090d16');
    bgGrad.addColorStop(0.4, '#1e1b4b');
    bgGrad.addColorStop(0.7, '#0f172a');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Glowing horizon grid
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.25;
    const horizonY = h * 0.7;
    for (let x = 0; x <= w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(w * 0.5, horizonY - 40);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = horizonY; y <= h; y += 15) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;

    // Skyline silhouettes
    const buildings = [
      { x: 50, width: 100, height: 380, color: '#090d16' },
      { x: 170, width: 80, height: 460, color: '#0b1120' },
      { x: 270, width: 140, height: 320, color: '#090d16' },
      { x: 430, width: 110, height: 520, color: '#030712' },
      { x: 560, width: 90, height: 410, color: '#0b1120' },
      { x: 670, width: 130, height: 490, color: '#030712' },
      { x: 820, width: 100, height: 350, color: '#090d16' },
      { x: 940, width: 160, height: 440, color: '#0b1120' },
    ];

    buildings.forEach(b => {
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, h - b.height, b.width, b.height);
      ctx.strokeStyle = '#1e293b';
      ctx.strokeRect(b.x, h - b.height, b.width, b.height);

      ctx.fillStyle = '#38bdf8';
      for (let wy = h - b.height + 20; wy < h - 40; wy += 24) {
        for (let wx = b.x + 12; wx < b.x + b.width - 15; wx += 16) {
          if ((wx * wy) % 7 > 2) {
            ctx.globalAlpha = 0.7;
            ctx.fillRect(wx, wy, 6, 10);
          }
        }
      }
      ctx.globalAlpha = 1.0;
    });

  } else if (type === 'landscape') {
    // Misty mountain landscape
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#0c1222');
    sky.addColorStop(0.5, '#1e293b');
    sky.addColorStop(0.8, '#334155');
    sky.addColorStop(1, '#475569');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Sun / Moon disc
    ctx.fillStyle = '#f8fafc';
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(w * 0.75, h * 0.28, 55, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;

    const drawMountain = (peakY: number, color: string, alpha: number) => {
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(0, peakY + 120);
      ctx.lineTo(w * 0.25, peakY);
      ctx.lineTo(w * 0.5, peakY + 80);
      ctx.lineTo(w * 0.7, peakY - 40);
      ctx.lineTo(w, peakY + 90);
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
    };

    drawMountain(340, '#1e293b', 0.6);
    drawMountain(420, '#0f172a', 0.85);
    drawMountain(520, '#020617', 1.0);
    ctx.globalAlpha = 1.0;

    // Pine silhouettes
    ctx.fillStyle = '#020617';
    for (let px = 20; px < w; px += 28) {
      const treeH = 50 + (Math.sin(px * 1.5) * 15);
      const baseY = h - 20;
      ctx.beginPath();
      ctx.moveTo(px, baseY - treeH);
      ctx.lineTo(px - 14, baseY);
      ctx.lineTo(px + 14, baseY);
      ctx.closePath();
      ctx.fill();
    }

  } else if (type === 'geometric') {
    // Bauhaus Modernist Study
    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(w * 0.35, h * 0.45, 180, 0, Math.PI);
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(w * 0.5, h * 0.25, 240, 240);

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(w * 0.2, h * 0.85);
    ctx.lineTo(w * 0.45, h * 0.45);
    ctx.lineTo(w * 0.7, h * 0.85);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#52525b';
    ctx.lineWidth = 4;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(w * 0.65 + i * 22, h * 0.5);
      ctx.lineTo(w * 0.85 + i * 22, h * 0.85);
      ctx.stroke();
    }

  } else if (type === 'solar') {
    // Solar Corona & Flare
    const bg = ctx.createRadialGradient(w * 0.5, h * 0.5, 40, w * 0.5, h * 0.5, w * 0.6);
    bg.addColorStop(0, '#451a03');
    bg.addColorStop(0.4, '#1c1917');
    bg.addColorStop(1, '#0c0a09');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Radiant flares
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 32) {
      const len = 180 + Math.sin(a * 8) * 60;
      ctx.globalAlpha = 0.4 + Math.sin(a * 4) * 0.3;
      ctx.beginPath();
      ctx.moveTo(w * 0.5 + Math.cos(a) * 110, h * 0.5 + Math.sin(a) * 110);
      ctx.lineTo(w * 0.5 + Math.cos(a) * (110 + len), h * 0.5 + Math.sin(a) * (110 + len));
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;

    // Glowing core disc
    const sunGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, 30, w * 0.5, h * 0.5, 120);
    sunGrad.addColorStop(0, '#fef08a');
    sunGrad.addColorStop(0.5, '#f59e0b');
    sunGrad.addColorStop(0.9, '#ea580c');
    sunGrad.addColorStop(1, '#7c2d12');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.5, 120, 0, Math.PI * 2);
    ctx.fill();

  } else if (type === 'cyber_grid') {
    // Digital Perspective Grid
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, w, h);

    const horizonY = h * 0.45;

    // Distant cyber mountains
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    for (let x = 0; x <= w; x += 60) {
      const my = horizonY - 40 - Math.sin(x * 0.02) * 50;
      ctx.lineTo(x, my);
    }
    ctx.lineTo(w, horizonY);
    ctx.closePath();
    ctx.fill();

    // Cyan grid
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.6;
    for (let x = -w * 0.5; x <= w * 1.5; x += 70) {
      ctx.beginPath();
      ctx.moveTo(w * 0.5, horizonY);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = horizonY; y <= h; y += 18) {
      const exp = Math.pow((y - horizonY) / (h - horizonY), 1.6);
      const actualY = horizonY + exp * (h - horizonY);
      ctx.beginPath();
      ctx.moveTo(0, actualY);
      ctx.lineTo(w, actualY);
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;

    // Neon horizon line
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    ctx.lineTo(w, horizonY);
    ctx.stroke();

  } else if (type === 'aurora') {
    // Boreal Aurora
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#020617');
    sky.addColorStop(0.6, '#064e3b');
    sky.addColorStop(1, '#022c22');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Ethereal emerald wave curtains
    for (let l = 0; l < 3; l++) {
      ctx.fillStyle = l === 0 ? '#10b981' : l === 1 ? '#34d399' : '#059669';
      ctx.globalAlpha = 0.35 - l * 0.08;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.2 + l * 40);
      for (let x = 0; x <= w; x += 30) {
        const wave = Math.sin((x + l * 120) * 0.008) * 70 + Math.cos(x * 0.015) * 40;
        ctx.lineTo(x, h * 0.35 + wave + l * 30);
      }
      ctx.lineTo(w, h * 0.65);
      ctx.lineTo(0, h * 0.65);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Dark fjord silhouette
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, h * 0.7);
    ctx.lineTo(w * 0.35, h * 0.62);
    ctx.lineTo(w * 0.5, h * 0.72);
    ctx.lineTo(w * 0.75, h * 0.58);
    ctx.lineTo(w, h * 0.68);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // Water reflection
    ctx.fillStyle = '#042f2e';
    ctx.globalAlpha = 0.5;
    ctx.fillRect(0, h * 0.75, w, h * 0.25);
    ctx.globalAlpha = 1.0;

  } else if (type === 'desert') {
    // Golden Sand Dunes
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#431407');
    sky.addColorStop(0.4, '#9a3412');
    sky.addColorStop(0.7, '#ea580c');
    sky.addColorStop(1, '#fed7aa');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Sun
    ctx.fillStyle = '#fffbeb';
    ctx.beginPath();
    ctx.arc(w * 0.3, h * 0.35, 70, 0, Math.PI * 2);
    ctx.fill();

    // Dunes layers
    const drawDune = (startY: number, color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(0, startY);
      ctx.quadraticCurveTo(w * 0.3, startY - 80, w * 0.6, startY + 40);
      ctx.quadraticCurveTo(w * 0.85, startY + 120, w, startY - 20);
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
    };

    drawDune(480, '#c2410c');
    drawDune(560, '#9a3412');
    drawDune(650, '#7c2d12');

  } else if (type === 'abyssal') {
    // Deep Ocean Abyssal
    const ocean = ctx.createLinearGradient(0, 0, 0, h);
    ocean.addColorStop(0, '#082f49');
    ocean.addColorStop(0.5, '#0c4a6e');
    ocean.addColorStop(1, '#020617');
    ctx.fillStyle = ocean;
    ctx.fillRect(0, 0, w, h);

    // Glowing deep-sea bio orbs
    const orbs = [
      { x: 300, y: 350, r: 40, col: '#38bdf8' },
      { x: 750, y: 280, r: 60, col: '#2dd4bf' },
      { x: 920, y: 520, r: 35, col: '#38bdf8' },
      { x: 480, y: 580, r: 50, col: '#22d3ee' },
    ];

    orbs.forEach(orb => {
      const g = ctx.createRadialGradient(orb.x, orb.y, 5, orb.x, orb.y, orb.r * 2);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.3, orb.col);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.r * 2, 0, Math.PI * 2);
      ctx.fill();

      // Tendril
      ctx.strokeStyle = orb.col;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(orb.x, orb.y);
      ctx.bezierCurveTo(orb.x - 30, orb.y + 90, orb.x + 40, orb.y + 160, orb.x - 10, h);
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    });

  } else {
    // 80s Retrowave Neon Sunset
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#1e1b4b');
    bg.addColorStop(0.5, '#312e81');
    bg.addColorStop(0.7, '#431407');
    bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Giant Striped Sun
    const sunY = h * 0.45;
    const sunR = 140;
    ctx.save();
    ctx.beginPath();
    ctx.arc(w * 0.5, sunY, sunR, 0, Math.PI * 2);
    ctx.clip();

    const sunGrad = ctx.createLinearGradient(w * 0.5, sunY - sunR, w * 0.5, sunY + sunR);
    sunGrad.addColorStop(0, '#fde047');
    sunGrad.addColorStop(0.5, '#f97316');
    sunGrad.addColorStop(1, '#e11d48');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(w * 0.5 - sunR, sunY - sunR, sunR * 2, sunR * 2);

    // Sun horizontal laser cut stripes
    ctx.fillStyle = '#1e1b4b';
    for (let sy = sunY - 20; sy < sunY + sunR; sy += 16) {
      const stripeH = 3 + (sy - (sunY - 20)) * 0.12;
      ctx.fillRect(w * 0.5 - sunR, sy, sunR * 2, stripeH);
    }
    ctx.restore();

    // Horizon grid
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.7;
    for (let x = -w * 0.2; x <= w * 1.2; x += 65) {
      ctx.beginPath();
      ctx.moveTo(w * 0.5, sunY + 60);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = sunY + 60; y <= h; y += 16) {
      const exp = Math.pow((y - (sunY + 60)) / (h - (sunY + 60)), 1.5);
      const rowY = sunY + 60 + exp * (h - (sunY + 60));
      ctx.beginPath();
      ctx.moveTo(0, rowY);
      ctx.lineTo(w, rowY);
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
  }

  return canvas.toDataURL('image/png');
}

export function getInitialSampleImages(): SampleImage[] {
  return [
    {
      id: 'celestial-core',
      title: 'Celestial Eclipse',
      category: 'Cosmos',
      width: 1200,
      height: 800,
      dataUrl: generateProceduralSample('celestial'),
    },
    {
      id: 'neon-city',
      title: 'Metropolis Skyline',
      category: 'Urban',
      width: 1200,
      height: 800,
      dataUrl: generateProceduralSample('cityscape'),
    },
    {
      id: 'mountain-ridge',
      title: 'Alpine Summit',
      category: 'Nature',
      width: 1200,
      height: 800,
      dataUrl: generateProceduralSample('landscape'),
    },
    {
      id: 'geometric-art',
      title: 'Bauhaus Study',
      category: 'Graphic Art',
      width: 1200,
      height: 800,
      dataUrl: generateProceduralSample('geometric'),
    },
    {
      id: 'solar-flare',
      title: 'Solar Prominence',
      category: 'Cosmos',
      width: 1200,
      height: 800,
      dataUrl: generateProceduralSample('solar'),
    },
    {
      id: 'cyber-grid',
      title: 'Digital Grid',
      category: 'Cyberpunk',
      width: 1200,
      height: 800,
      dataUrl: generateProceduralSample('cyber_grid'),
    },
    {
      id: 'emerald-aurora',
      title: 'Boreal Aurora',
      category: 'Nature',
      width: 1200,
      height: 800,
      dataUrl: generateProceduralSample('aurora'),
    },
    {
      id: 'desert-dunes',
      title: 'Sahara Sunset',
      category: 'Landscape',
      width: 1200,
      height: 800,
      dataUrl: generateProceduralSample('desert'),
    },
    {
      id: 'ocean-depths',
      title: 'Abyssal Biolume',
      category: 'Underwater',
      width: 1200,
      height: 800,
      dataUrl: generateProceduralSample('abyssal'),
    },
    {
      id: 'retrowave-sun',
      title: 'Neon Horizon',
      category: 'Retrowave',
      width: 1200,
      height: 800,
      dataUrl: generateProceduralSample('retrowave'),
    },
  ];
}
