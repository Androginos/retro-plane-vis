import React, { useRef, useEffect, useState, useCallback } from "react";
import styled from 'styled-components';
import SelectedPlanePanel from './SelectedPlanePanel';

// Styled components
const Title = styled.h1`
  color: #00ff00;
  text-align: center;
  text-shadow: 0 0 5px #00ff00;
  font-family: 'VT323', monospace;
  margin: 0;
`;

const Panel = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  padding: 20px;
  border: 2px solid #00ff00;
  border-radius: 10px;
  color: #00ff00;
  font-family: 'VT323', monospace;
  z-index: 10000;
`;

const PanelTitle = styled.div`
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 16px;
  text-align: center;
  text-shadow: 0 0 8px #00ff00;
`;

const PanelRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0, 255, 0, 0.2);
  &:last-child {
    border-bottom: none;
  }
`;

// Görsel yolları
const BG_IMG = '/assets/bg.png';
const PLANE1_IMG = '/assets/planes/plane1.png';
const PLANE1_DAMAGED_IMG = '/assets/planes/plane1_damaged.png';
const PLANE2_IMG = '/assets/planes/plane2.png';
const PLANE2_DAMAGED_IMG = '/assets/planes/plane2_damaged.png';

const TURRET_IMAGES = {
  'contract': '/assets/tx_types/contract_creation_icon.png',
  'transfer': '/assets/tx_types/transfer_icon.png',
  'dex': '/assets/tx_types/dex_swap_icon.png',
  'nft': '/assets/tx_types/nft_mint_icon.png',
  'normal': '/assets/tx_types/other_icon.png'
};

const BULLET_IMAGES = {
  'contract': '/assets/bullets/contract_bullet.png',
  'transfer': '/assets/bullets/transfer_bullet.png',
  'dex': '/assets/bullets/dex_swap_bullet.png',
  'nft': '/assets/bullets/nft_mint_bullet.png',
  'normal': '/assets/bullets/other_bullet.png'
};

const BULLET_COLORS = {
  'contract': '#ff4444',
  'transfer': '#44ff44',
  'dex': '#4444ff',
  'nft': '#ffff44',
  'normal': '#ff44ff'
};

// Ekran boyutları
const SCREEN_WIDTH = 1000;
const SCREEN_HEIGHT = 800;
const GAME_WIDTH = window.innerWidth;
const GAME_HEIGHT = window.innerHeight;

// Oyun sabitleri
const PLANE_WIDTH = 90;
const PLANE_HEIGHT = 60;
const PLANE_SPEED = 1.2; // Piksel/frame
const PLANE_WAVE_AMPLITUDE = 2; // Süzülme dalga yüksekliği
const PLANE_WAVE_FREQ = 0.001; // Süzülme dalga frekansı
const PLANE_SHAKE_AMPLITUDE = 2; // Titreşim
const PLANE_SHAKE_FREQ = 0.04;
const GHOST_PLANE_SPEED = 1.5;
const OVERLOADED_PLANE_SPEED = 1;
const OUT_OF_GAS_PLANE_SPEED = 0.8;
const FALL_SPEED = 3;
const GHOST_FALL_SPEED = 2;
const OVERLOADED_FALL_SPEED = 4;
const OUT_OF_GAS_FALL_SPEED = 3.5;
const BULLET_SPEED = 4.5;
const BULLET_RADIUS = 3;
const EXPLOSION_RADIUS = 20;

// Efekt sabitleri
const EXPLOSION_FRAME_WIDTH = 64;
const EXPLOSION_FRAME_HEIGHT = 64;
const EXPLOSION_FRAMES = 16;
const EXPLOSION_DURATION = 500; // ms
const OUT_OF_GAS_DURATION = 2000;
const OUT_OF_GAS_SCALE = 1.5;
const OUT_OF_GAS_COLOR = '#ff0000';
const FALL_DELAY_MIN = 3000;
const FALL_DELAY_MAX = 8000;
const FALL_DELAY_STEP = 1000;
const GAS_THRESHOLD = 0.85; // Gas kullanım eşiği
const TURRET_WIDTH = 80; // Turret genişliği
const TURRET_HEIGHT = 80; // Turret yüksekliği

// Turret boyutunu ve pozisyonunu kolayca ayarlamak için sabitler
const TURRET_SCALE = 0.5;
const TURRET_Y_OFFSET = 500; // Yukarıdan 100px boşluk
const TURRET_X_START = 25; // İlk turret'ın x pozisyonu
const TURRET_X_GAP = 190; // Turretlar arası mesafe

const BG_SCALE = 1.2;
const BG_X_OFFSET = -100;
const BG_Y_OFFSET = -50;

// Her turret tipi için bullet çıkış pozisyonu offsetleri (ince ayar için)
const TURRET_BULLET_OFFSETS = {
  'Transfer': { x: 40, y: 0 },
  'NFT Mint': { x: 40, y: 0 },
  'DEX Swap': { x: 40, y: 0 },
  'Contract Creation': { x: 40, y: 0 },
  'Other': { x: 40, y: 0 }
};

// Mermi boyutları için sabitler
const BULLET_WIDTH = 64; // 32'den 64'e çıkardık
const BULLET_HEIGHT = 128; // 64'ten 128'e çıkardık

// Atari arka plan ayarları
const ATARI_BG_SCALE = 1.1;
const ATARI_BG_X_OFFSET = 10;
const ATARI_BG_Y_OFFSET = 370;

const TURRET_LABEL_Y_OFFSET = 32;

const PanelDetail = styled.div`
  background: rgba(0, 0, 0, 0.5);
  padding: 12px;
  margin: 8px 0;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.4;
`;

// Performans optimizasyonları için yeni sabitler
const RENDER_INTERVAL = 1000 / 60; // 60 FPS
const MAX_PLANES = 10; // Maksimum uçak sayısı
const MAX_BULLETS = 50; // Maksimum mermi sayısı

// Rescue/Refuel animasyonu için sabitler
const RESCUE_ANIMATION_DURATION = 2000;
const RESCUE_EFFECT_COLOR = '#00ff80';
const RESCUE_EFFECT_SIZE = 1.2;

// Uçak süzülme animasyonu için sabitler
const FLOAT_AMPLITUDE = 3;
const FLOAT_SPEED = 0.05;

const FALL_SPEEDS = {
  normal: 1.5,
  ghost: 1.05,
  overloaded: 0.75,
  outOfGas: 1.2
};

// Performans izleme sabitleri
const PERFORMANCE_LOG_INTERVAL = 1000; // Her 1 saniyede bir performans logu
const FPS_SAMPLE_SIZE = 60; // Son 60 frame'in FPS ortalaması
const MEMORY_CHECK_INTERVAL = 5000; // Her 5 saniyede bir memory kontrolü
const ASSET_LOAD_TIMEOUT = 10000; // Asset yükleme timeout süresi (10 sn)

const DEBUG = true;

// Define turret positions
const TURRET_POSITIONS = {
  normal: { x: GAME_WIDTH * 0.2, y: GAME_HEIGHT - TURRET_HEIGHT/2, type: 'normal' },
  transfer: { x: GAME_WIDTH * 0.4, y: GAME_HEIGHT - TURRET_HEIGHT/2, type: 'transfer' },
  contract: { x: GAME_WIDTH * 0.6, y: GAME_HEIGHT - TURRET_HEIGHT/2, type: 'contract' },
  dex: { x: GAME_WIDTH * 0.8, y: GAME_HEIGHT - TURRET_HEIGHT/2, type: 'dex' },
  nft: { x: GAME_WIDTH * 0.9, y: GAME_HEIGHT - TURRET_HEIGHT/2, type: 'nft' }
};

// Background constants
const BACKGROUND = {
  sky: {
    colors: ['#87CEEB', '#B0E2FF'], // gradient colors
    height: 1.0 // full height
  },
  farMountains: {
    color: '#2B1B42',
    height: 0.7, // 70% of canvas height
    layers: 2
  },
  waterfalls: {
    color: '#B0E2FF',
    width: 40,
    speed: 2,
    count: 3
  },
  frontMountains: {
    color: '#1F1535',
    height: 0.9, // 90% of canvas height
    layers: 2
  },
  vegetation: {
    colors: ['#1B4B1B', '#0F2F0F'],
    size: 20,
    density: 0.1
  }
};

const CANVAS_WIDTH = 1080;  // Buradan ince ayar yapabilirsiniz
const CANVAS_HEIGHT = 900;

// bg.png'nin pozisyonu ve boyutu için değişkenler
const BG_X = 0;      // Soldan boşluk
const BG_Y = 0;      // Yukarıdan boşluk
const BG_WIDTH = CANVAS_WIDTH;   // Görselin genişliği
const BG_HEIGHT = CANVAS_HEIGHT; // Görselin yüksekliği

// Turret bilgileri (pozisyonları kolayca ayarlanabilir)
const TURRETS = [
  {
    name: 'Transfer',
    img: process.env.PUBLIC_URL + '/assets/tx_types/transfer_icon.png',
    x: 20,
    y: CANVAS_HEIGHT - 135,
  },
  {
    name: 'NFT Mint',
    img: process.env.PUBLIC_URL + '/assets/tx_types/nft_mint_icon.png',
    x: 250,
    y: CANVAS_HEIGHT - 135,
  },
  {
    name: 'DEX Swap',
    img: process.env.PUBLIC_URL + '/assets/tx_types/dex_swap_icon.png',
    x: 490,
    y: CANVAS_HEIGHT - 135,
  },
  {
    name: 'Contract',
    img: process.env.PUBLIC_URL + '/assets/tx_types/contract_creation_icon.png',
    x: 730,
    y: CANVAS_HEIGHT - 135,
  },
  {
    name: 'Other',
    img: process.env.PUBLIC_URL + '/assets/tx_types/other_icon.png',
    x: 950,
    y: CANVAS_HEIGHT - 135,
  }
];

const TURRET_SIZE = 100; // 64 * 1.2 = 76.8, yani %20 büyük
const LABEL_OFFSET = 25; // Yazı ile turret arası mesafe biraz daha büyük
const LABEL_FONT_SIZE = 24; // 20 * 1.2 = 24px

// Uçak görselleri
const PLANE_IMAGES = [
  process.env.PUBLIC_URL + '/assets/planes/plane1.png',
  process.env.PUBLIC_URL + '/assets/planes/plane2.png',
];

// Yardımcı: Görsel yükleyici
function loadImage(src) {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.src = src;
    img.onload = () => resolve(img);
  });
}

const BULLET_SIZE_BASE = 16;
const BULLET_SIZE_MAX = 44;
const BULLET_TYPE_MAP = {
  'Transfer': 'Transfer',
  'NFT Mint': 'NFT Mint',
  'DEX Swap': 'DEX Swap',
  'Contract Creation': 'Contract',
  'Contract': 'Contract',
};

const getBulletType = (type) => BULLET_TYPE_MAP[type] || 'Other';

const getTurretByType = (type) => {
  switch (type) {
    case 'Transfer': return TURRETS[0];
    case 'NFT Mint': return TURRETS[1];
    case 'DEX Swap': return TURRETS[2];
    case 'Contract': return TURRETS[3];
    default: return TURRETS[4];
  }
};

function drawBullet(ctx, bullet) {
  const size = 30;
  const colorMap = {
    'Transfer': '#7fdbca',
    'NFT Mint': '#b2f296',
    'DEX Swap': '#f0e68c',
    'Contract': '#d58a94',
    'Other': '#c9b7f3'
  };
  const baseColor = colorMap[bullet.type] || '#888888';
  ctx.save();
  ctx.globalAlpha = 1.0;
  ctx.imageSmoothingEnabled = false;
  // Glow/hare efekti: dışa 2 katman
  ctx.fillStyle = hexToRgba(baseColor, 0.18);
  ctx.fillRect(Math.floor(bullet.x) - 8, Math.floor(bullet.y) - 8, size + 16, size + 16);
  ctx.fillStyle = hexToRgba(baseColor, 0.35);
  ctx.fillRect(Math.floor(bullet.x) - 4, Math.floor(bullet.y) - 4, size + 8, size + 8);
  // Ana kare
  ctx.fillStyle = baseColor;
  ctx.fillRect(Math.floor(bullet.x), Math.floor(bullet.y), size, size);
  if (bullet.failed) {
    ctx.fillStyle = '#d13d3d';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('X', Math.floor(bullet.x) + size / 2, Math.floor(bullet.y) + size / 2 + 1);
  }
  ctx.restore();
}

// Yardımcı fonksiyon: hex renk kodunu rgba'ya çevir
function hexToRgba(hex, alpha) {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(x => x + x).join('');
  }
  const num = parseInt(hex, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

const RetroPlane = ({ blocks = [], onPlaneExit, onPlaneSelect, speed = 1 }) => {
  const canvasRef = useRef(null);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [planeImages, setPlaneImages] = useState([]);
  const [turretImages, setTurretImages] = useState([]);
  const [bgImage, setBgImage] = useState(null);
  const planesRef = useRef([]);
  const bulletsRef = useRef([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 700);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 700);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Görselleri yükle
  useEffect(() => {
    Promise.all([
      loadImage(process.env.PUBLIC_URL + '/assets/bg.png'),
      ...TURRETS.map(t => loadImage(t.img)),
      ...PLANE_IMAGES.map(src => loadImage(src)),
    ]).then(([bg, ...rest]) => {
      setBgImage(bg);
      setTurretImages(rest.slice(0, TURRETS.length));
      setPlaneImages(rest.slice(TURRETS.length));
      setAssetsLoaded(true);
    });
  }, []);

  // Canvas boyutunu ayarla
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;
      // Pixel art için ek ayarlar
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      canvas.style.imageRendering = 'pixelated';
    }
  }, []);

  // Yeni bloklar için plane oluştur
  useEffect(() => {
    if (!assetsLoaded) return;
    const newBlocks = blocks.filter(block => !planesRef.current.some(plane => plane.block.number === block.number));
    if (newBlocks.length > 0) {
      const newPlanes = newBlocks.map(block => {
        const fromLeft = Number(block.number) % 2 === 0;
        const velocityMultiplier = speed;
        return {
          block,
          x: fromLeft ? -100 : CANVAS_WIDTH + 100,
          y: 50 + Math.random() * (CANVAS_HEIGHT * 0.20),
          vx: fromLeft ? (Math.random() * 1.5 + 1) * velocityMultiplier : -(Math.random() * 1.5 + 1) * velocityMultiplier,
          vy: (Math.random() * 0.18 + 0.05) * velocityMultiplier,
          gravity: Math.random() * 0.001 * velocityMultiplier,
          fromLeft,
          width: PLANE_WIDTH,
          height: PLANE_HEIGHT,
          exited: false,
          hitCount: 0,
          succeeded: false,
          targetY: null,
        };
      });
      planesRef.current = [...planesRef.current, ...newPlanes];
    }
  }, [blocks, assetsLoaded, speed]);

  // Yeni bloklar için mermi oluştur
  useEffect(() => {
    if (!assetsLoaded) return;
    blocks.forEach(block => {
      if (!block.transactions) return;
      const plane = planesRef.current.find(p => p.block.number === block.number);
      if (!plane) return;
      // 5 ana tipe göre grupla
      const txTypeCounts = { 'Transfer': 0, 'NFT Mint': 0, 'DEX Swap': 0, 'Contract': 0, 'Other': 0 };
      block.transactions.forEach(tx => {
        const bulletType = getBulletType(tx.type);
        txTypeCounts[bulletType] = (txTypeCounts[bulletType] || 0) + 1;
      });
      Object.entries(txTypeCounts).forEach(([type, count]) => {
        if (count === 0) return;
        const turret = getTurretByType(type);
        // Mermi boyutu: min 16, max 44
        const size = Math.min(BULLET_SIZE_BASE + count * 3, BULLET_SIZE_MAX);
        bulletsRef.current.push({
          type,
          color: BULLET_COLORS[type.toLowerCase()] || '#fff',
          x: turret.x + TURRET_SIZE / 2,
          y: turret.y + TURRET_SIZE / 2,
          targetPlaneNumber: block.number,
          progress: 0,
          speed: 0.012 + Math.random() * 0.008,
          size,
          createdAt: Date.now() + Math.random() * 200
        });
      });
    });
  }, [blocks, assetsLoaded]);

  // Animasyon döngüsü (sadece bir kez başlatılır, assetsLoaded true ise)
  useEffect(() => {
    if (!assetsLoaded) return;
    let animationFrameId;
    function animatePlanes() {
      const canvas = canvasRef.current;
      if (!canvas || !bgImage || planeImages.length < 2 || turretImages.length !== TURRETS.length) {
        animationFrameId = requestAnimationFrame(animatePlanes);
        return;
      }
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bgImage, BG_X, BG_Y, BG_WIDTH, BG_HEIGHT);
      // --- Mermileri önce çiz ---
      let newBullets = [];
      const blockHitTypes = {};
      bulletsRef.current.forEach(bullet => {
        // Hedef uçağı bul
        const plane = planesRef.current.find(p => p.block.number === bullet.targetPlaneNumber);
        if (!plane) return;
        if (plane.succeeded) return;
        // Blok başına tip bazlı grupla
        const blockKey = plane.block.number;
        blockHitTypes[blockKey] = blockHitTypes[blockKey] || new Set();
        if (blockHitTypes[blockKey].has(bullet.type)) return; // Bu tip için zaten bir mermi atıldı
        blockHitTypes[blockKey].add(bullet.type);
        // Hedef koordinat
        const targetX = plane.x + PLANE_WIDTH / 2;
        const targetY = plane.y + PLANE_HEIGHT / 2;
        // Lerp ile hareket
        bullet.progress += bullet.speed * speed;
        if (bullet.progress > 1) bullet.progress = 1;
        bullet.x = bullet.x0 !== undefined ? bullet.x0 : bullet.x;
        bullet.y = bullet.y0 !== undefined ? bullet.y0 : bullet.y;
        if (bullet.x0 === undefined) bullet.x0 = bullet.x;
        if (bullet.y0 === undefined) bullet.y0 = bullet.y;
        bullet.x = bullet.x0 + (targetX - bullet.x0) * bullet.progress;
        bullet.y = bullet.y0 + (targetY - bullet.y0) * bullet.progress;
        // --- Mermiyi çiz ---
        drawBullet(ctx, bullet);
        // Çarpışma kontrolü (merkezler arası mesafe yarıçaptan küçükse)
        const dx = bullet.x - targetX;
        const dy = bullet.y - targetY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (bullet.progress >= 1 || dist < (plane.width/2)) {
          // Hit counter'ı, bu tipin tx sayısı kadar artır
          const block = plane.block;
          let txCount = 0;
          if (block.transactions && Array.isArray(block.transactions)) {
            txCount = block.transactions.filter(tx => getBulletType(tx.type) === bullet.type).length;
          }
          plane.hitCount = (plane.hitCount || 0) + txCount;
          // Eğer hitCount, toplam tx sayısına ulaştıysa succeeded
          if (plane.hitCount >= (plane.block.transactions?.length || 0)) {
            plane.succeeded = true;
            plane.targetY = CANVAS_HEIGHT * (0.5 + Math.random()*0.3);
            plane.vy = 0;
            plane.gravity = 0;
          }
        } else {
          newBullets.push(bullet);
        }
      });
      bulletsRef.current = newBullets;
      // --- Sonra turretler ve yazıları çiz ---
      TURRETS.forEach((turret, i) => {
        ctx.drawImage(
          turretImages[i],
          turret.x,
          turret.y,
          TURRET_SIZE,
          TURRET_SIZE
        );
        // Yazı
        const text = turret.name;
        ctx.font = `${LABEL_FONT_SIZE}px VT323, monospace`;
        ctx.textAlign = 'center';
        const textX = turret.x + TURRET_SIZE / 2;
        const textY = turret.y + TURRET_SIZE + LABEL_OFFSET;
        const textWidth = ctx.measureText(text).width;
        const textHeight = LABEL_FONT_SIZE + 8;

        // Arka plan kutusu (yarı saydam siyah)
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = '#111';
        ctx.fillRect(
          textX - textWidth / 2 - 8,
          textY - LABEL_FONT_SIZE,
          textWidth + 16,
          textHeight
        );
        ctx.globalAlpha = 1;
        ctx.restore();

        // Kontur (stroke)
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#000';
        ctx.strokeText(text, textX, textY);

        // Glow ve ana yazı
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#00ff00';
        ctx.fillText(text, textX, textY);
        ctx.shadowBlur = 0;
      });
      // --- En son uçakları çiz ---
      let updatedPlanes = [];
      planesRef.current.forEach((plane, idx) => {
        const { block, fromLeft } = plane;
        const img = fromLeft ? planeImages[0] : planeImages[1];
        // Succeeded ise düz ve hedefe in
        if (plane.succeeded) {
          // Süzülmeyi bırak, gravity yok, dalga yok
          if (plane.targetY !== null && Math.abs(plane.y - plane.targetY) > 2) {
            // Hedef y'ye in
            plane.y += (plane.targetY - plane.y) * 0.08;
          } else {
            // Düz çıkış
            plane.y = plane.targetY;
            plane.vy = 0;
            plane.gravity = 0;
          }
          // Düz çıkış (x yönü)
          plane.x += plane.vx * 1.5; // daha hızlı çıkabilir
        } else {
          // Fiziksel hareket ve dalga
          plane.x += plane.vx;
          plane.y += plane.vy;
          plane.vy += plane.gravity;
          // Dalga efekti
          plane.y += Math.sin(Date.now() / 400 + plane.x / 120) * 1.2;
        }
        // Y ekseni sınırı ve sekme
        const maxY = CANVAS_HEIGHT * 0.6;
        const minY = 25; // Üst limit eklendi
        if (!plane.succeeded) {
          if (plane.y > maxY) {
            plane.y = maxY;
            plane.vy *= -0.3;
          }
          if (plane.y < minY) { // Üst limit kontrolü
            plane.y = minY;
            plane.vy *= -0.3;
          }
        }
        // Uçak çizimi
        ctx.save();
        if (!fromLeft) {
          ctx.translate(plane.x + PLANE_WIDTH / 2, plane.y + PLANE_HEIGHT / 2);
          ctx.scale(-1, 1);
          // Succeeded ise glow efekti
          if (plane.succeeded) {
            ctx.shadowColor = '#00ff80';
            ctx.shadowBlur = 32;
          }
          ctx.drawImage(img, -PLANE_WIDTH / 2, -PLANE_HEIGHT / 2, PLANE_WIDTH, PLANE_HEIGHT);
        } else {
          // Succeeded ise glow efekti
          if (plane.succeeded) {
            ctx.shadowColor = '#00ff80';
            ctx.shadowBlur = 32;
          }
          ctx.drawImage(img, plane.x, plane.y, PLANE_WIDTH, PLANE_HEIGHT);
        }
        ctx.restore();
        // Üstte blok numarası, tx sayısı ve hit counter
        const label = `#${block.number} | tx: ${block.transactions?.length ?? 0} | hit: ${plane.hitCount ?? 0}`;
        ctx.font = `20px VT323, monospace`;
        ctx.textAlign = 'center';
        const labelX = fromLeft ? plane.x + PLANE_WIDTH / 2 : plane.x + PLANE_WIDTH / 2;
        const labelY = plane.y - 12;
        const labelWidth = ctx.measureText(label).width;
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = '#111';
        ctx.fillRect(labelX - labelWidth / 2 - 8, labelY - 20, labelWidth + 16, 28);
        ctx.globalAlpha = 1;
        ctx.restore();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#000';
        ctx.strokeText(label, labelX, labelY);
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#00ff00';
        ctx.fillText(label, labelX, labelY);
        ctx.shadowBlur = 0;
        // Succeeded ise blok numarasının altında SUCCEEDED yazısı
        if (plane.succeeded) {
          ctx.font = `bold 22px VT323, monospace`;
          ctx.textAlign = 'center';
          ctx.shadowColor = '#FFA500';
          ctx.shadowBlur = 16;
          ctx.fillStyle = '#FFA500';
          ctx.fillText('SUCCEEDED', labelX, labelY + 32);
          ctx.shadowBlur = 0;
        }
        // Altta gas oranı
        const gasUsed = Number(block.gasUsed || 0);
        const gasLimit = Number(block.gasLimit || 1);
        const gasRatio = gasLimit > 0 ? (gasUsed / gasLimit) * 100 : 0;
        const gasLabel = `%${gasRatio.toFixed(1)}`;
        const gasY = plane.y + PLANE_HEIGHT + 28;
        const gasWidth = ctx.measureText(gasLabel).width;
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = '#111';
        ctx.fillRect(labelX - gasWidth / 2 - 8, gasY - 20, gasWidth + 16, 28);
        ctx.globalAlpha = 1;
        ctx.restore();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#000';
        ctx.strokeText(gasLabel, labelX, gasY);
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#00ff00';
        ctx.fillText(gasLabel, labelX, gasY);
        ctx.shadowBlur = 0;

        // Ekrandan çıktıysa sil
        if (
          plane.x > CANVAS_WIDTH + 100 ||
          plane.x < -100 ||
          plane.y > CANVAS_HEIGHT + 100
        ) {
          if (!plane.exited) {
            if (onPlaneExit) onPlaneExit(block);
            plane.exited = true;
          }
        } else {
          updatedPlanes.push(plane);
        }
      });
      planesRef.current = updatedPlanes;
      animationFrameId = requestAnimationFrame(animatePlanes);
    }
    animationFrameId = requestAnimationFrame(animatePlanes);
    return () => cancelAnimationFrame(animationFrameId);
  }, [assetsLoaded, bgImage, planeImages, turretImages, speed]);

  // Canvas'a tıklama ile uçak seçimi
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !assetsLoaded) return;
    function handleClick(e) {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      // Uçaklardan birine tıklandı mı kontrol et
      for (let plane of planesRef.current) {
        if (
          mouseX >= plane.x && mouseX <= plane.x + plane.width &&
          mouseY >= plane.y && mouseY <= plane.y + plane.height
        ) {
          if (onPlaneSelect) onPlaneSelect(plane.block);
          return;
        }
      }
      // Hiçbir uçağa tıklanmadıysa seçimi kaldır
      if (onPlaneSelect) onPlaneSelect(null);
    }
    canvas.addEventListener('click', handleClick);
    return () => canvas.removeEventListener('click', handleClick);
  }, [assetsLoaded, onPlaneSelect]);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          width: isMobile ? '96vw' : `${CANVAS_WIDTH}px`,
          height: isMobile ? '60vw' : `${CANVAS_HEIGHT}px`,
          maxWidth: '98vw',
          maxHeight: '98vh',
          minWidth: '220px',
          minHeight: '120px',
          display: 'block',
          border: '3px solid #00ff00',
          borderRadius: '16px',
          boxShadow: '0 0 24px #00ff00',
          background: '#000',
          marginTop: '20px',
          marginLeft: isMobile ? 'auto' : '40px',
          marginRight: isMobile ? 'auto' : undefined,
        }}
      />
    </>
  );
};

export default RetroPlane; 