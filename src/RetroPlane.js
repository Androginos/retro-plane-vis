import React, { useRef, useEffect, useState, useCallback } from "react";
import styled from 'styled-components';
import SelectedPlanePanel from './SelectedPlanePanel';

// Asset yolları
const PLANE1_IMG = process.env.PUBLIC_URL + "/assets/planes/plane1.png";
const PLANE1_DAMAGED_IMG = process.env.PUBLIC_URL + "/assets/planes/plane1_damaged.png";
const PLANE2_IMG = process.env.PUBLIC_URL + "/assets/planes/plane2.png";
const PLANE2_DAMAGED_IMG = process.env.PUBLIC_URL + "/assets/planes/plane2_damaged.png";
const TURRET_IMGS = {
  'Transfer': process.env.PUBLIC_URL + "/assets/tx_types/transfer_icon.png",
  'NFT Mint': process.env.PUBLIC_URL + "/assets/tx_types/nft_mint_icon.png",
  'DEX Swap': process.env.PUBLIC_URL + "/assets/tx_types/dex_swap_icon.png",
  'Contract Creation': process.env.PUBLIC_URL + "/assets/tx_types/contract_creation_icon.png",
  'Other': process.env.PUBLIC_URL + "/assets/tx_types/other_icon.png"
};
const BULLET_IMGS = {
  'Transfer': process.env.PUBLIC_URL + "/assets/bullets/transfer_bullet.png",
  'NFT Mint': process.env.PUBLIC_URL + "/assets/bullets/nft_mint_bullet.png",
  'DEX Swap': process.env.PUBLIC_URL + "/assets/bullets/dex_swap_bullet.png",
  'Contract Creation': process.env.PUBLIC_URL + "/assets/bullets/contract_bullet.png",
  'Other': process.env.PUBLIC_URL + "/assets/bullets/other_bullet.png"
};
const ATARI_BG = process.env.PUBLIC_URL + "/assets/atari_bg.png";
const RETURN_BTN = process.env.PUBLIC_URL + "/assets/return_button.png";
const BG_GIF = process.env.PUBLIC_URL + "/assets/bg.png";

// Ekran boyutları
const SCREEN_WIDTH = 1000;
const SCREEN_HEIGHT = 800;
const GAME_WIDTH = 900;
const GAME_HEIGHT = 600;

// Oyun sabitleri
const PLANE_WIDTH = 120;
const PLANE_HEIGHT = 60;
const PLANE_SPEED = 2;
const GHOST_PLANE_SPEED = PLANE_SPEED * 0.5; // Ghost uçaklar daha yavaş
const OVERLOADED_PLANE_SPEED = PLANE_SPEED * 0.3; // Overloaded uçaklar en yavaş
const OUT_OF_GAS_PLANE_SPEED = PLANE_SPEED * 0.4; // Out of gas uçaklar yavaş
const FALL_SPEED = 1.5; // Düşme hızı
const GHOST_FALL_SPEED = FALL_SPEED * 0.7; // Ghost uçaklar daha yavaş düşer
const OVERLOADED_FALL_SPEED = FALL_SPEED * 0.5; // Overloaded uçaklar en yavaş düşer
const OUT_OF_GAS_FALL_SPEED = FALL_SPEED * 0.8; // Out of gas uçaklar biraz daha hızlı düşer
const BULLET_SPEED = 5;
const BULLET_RADIUS = 3;
const EXPLOSION_RADIUS = 20;
const EXPLOSION_DURATION = 500;
const GAS_THRESHOLD = 0.9;
const OUT_OF_GAS_DURATION = 2000;
const OUT_OF_GAS_SCALE = 1.5;
const OUT_OF_GAS_COLOR = '#ff0000';
const FALL_DELAY_MIN = 3000; // Minimum düşme gecikmesi
const FALL_DELAY_MAX = 8000; // Maksimum düşme gecikmesi
const FALL_DELAY_STEP = 1000; // Düşme gecikmesi adımı

// Turret boyutunu ve pozisyonunu kolayca ayarlamak için sabitler
const TURRET_SCALE = 2; // 2 katı büyüklük
const TURRET_Y_OFFSET = 500; // Yukarıdan 100px boşluk
const TURRET_X_START = 25; // İlk turret'ın x pozisyonu
const TURRET_X_GAP = 190; // Turretlar arası mesafe

const BG_SCALE = 1.04; // Orijinal boyut
const BG_X_OFFSET = 0; // X ekseninde kaydırma (pixel cinsinden)
const BG_Y_OFFSET = 0; // BG'yi 50px aşağı kaydır

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

// Mermi renkleri
const BULLET_COLORS = {
  'Transfer': '#00ff00',
  'NFT Mint': '#ff00ff',
  'DEX Swap': '#ffff00',
  'Contract Creation': '#00ffff',
  'Other': '#ff0000'
};

const Title = styled.h1`
  color: #00ff00;
  text-align: center;
  text-shadow: 0 0 5px #00ff00;
  font-family: 'VT323', monospace;
  margin: 0;
`;

// Atari arka plan ayarları
const ATARI_BG_SCALE = 1.1;
const ATARI_BG_X_OFFSET = 10;
const ATARI_BG_Y_OFFSET = 370;

const TURRET_LABEL_Y_OFFSET = 20; // Turret altı yazı mesafesi

const Panel = styled.div`
  position: fixed;
  top: 40px;
  right: 24px;
  width: 340px;
  max-height: 80vh;
  background: #111;
  border: 2px solid #00ff00;
  border-radius: 12px;
  box-shadow: 0 0 24px #00ff00, 0 4px 32px #000a;
  z-index: 30000;
  color: #00ff00;
  font-family: 'VT323', monospace;
  padding: 18px 18px 12px 18px;
  overflow-y: auto;
`;
const PanelTitle = styled.div`
  font-size: 28px;
  font-weight: bold;
  color: #00ff00;
  text-shadow: 0 0 8px #00ff00;
  margin-bottom: 18px;
  letter-spacing: 2px;
`;
const PanelRow = styled.div`
  padding: 10px 0;
  border-bottom: 1px solid #00ff0044;
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: #00330044;
  }
`;
const PanelDetail = styled.div`
  background: #222;
  color: #ffff00;
  border-radius: 8px;
  margin: 8px 0 12px 0;
  padding: 10px 12px;
  font-size: 18px;
  box-shadow: 0 0 8px #00ff0044;
`;

// Performans optimizasyonları için yeni sabitler
const RENDER_INTERVAL = 1000 / 60; // 60 FPS
const MAX_PLANES = 10; // Maksimum uçak sayısı
const MAX_BULLETS = 50; // Maksimum mermi sayısı

const DEBUG = process.env.NODE_ENV !== 'production';

const RetroPlane = ({ blocks, onReturn, txStats, events }) => {
  const canvasRef = useRef(null);
  const [planes, setPlanes] = useState([]);
  const bulletsRef = useRef([]);
  const [bullets, setBullets] = useState([]);
  const [turretImgs, setTurretImgs] = useState({});
  const [plane1Img, setPlane1Img] = useState(null);
  const [plane1DamagedImg, setPlane1DamagedImg] = useState(null);
  const [plane2Img, setPlane2Img] = useState(null);
  const [plane2DamagedImg, setPlane2DamagedImg] = useState(null);
  const [selectedWing, setSelectedWing] = useState(null);
  const [damagedWingsLog, setDamagedWingsLog] = useState([]);
  const firedBlockNumbers = useRef(new Set());
  const fallDelayCounter = useRef(0);
  const [selectedPlane, setSelectedPlane] = useState(null);
  const [rescuedPlanes, setRescuedPlanes] = useState([]);
  const RESCUE_ANIMATION_DURATION = 1200;

  // Düşme gecikmesi hesaplama
  const getFallDelay = useCallback(() => {
    fallDelayCounter.current = (fallDelayCounter.current + 1) % 5; // 5 farklı gecikme aralığı
    return FALL_DELAY_MIN + (fallDelayCounter.current * FALL_DELAY_STEP);
  }, []);

  // Blok verilerini güncelleme
  const updatePlaneData = useCallback((blockData) => {
    setPlanes(prevPlanes => {
      return prevPlanes.map(plane => {
        if (Number(plane.blockNumber) === Number(blockData.number)) {
          const newCount = blockData.transactions?.length || 0;
          const gasUsed = blockData.gasUsed || 0;
          const gasLimit = blockData.gasLimit || 1;
          const gasRatio = gasUsed / gasLimit;
          
          // Gas oranı eşiği aşıldığında uçak düşmeye başlar
          const isOutOfGas = gasRatio >= GAS_THRESHOLD;
          
          // Gas limiti dolduğunda timestamp'i kaydet ve düşmeye başla
          const outOfGasTimestamp = isOutOfGas && !plane.outOfGasTimestamp ? Date.now() : plane.outOfGasTimestamp;
          const isFalling = isOutOfGas || plane.isFalling;
          
          return {
            ...plane,
            transactionCount: newCount,
            timestamp: blockData.timestamp,
            isDamaged: isOutOfGas || plane.isDamaged,
            gasUsed,
            gasLimit,
            gasRatio,
            outOfGasTimestamp,
            isFalling,
            fallDelay: isOutOfGas ? getFallDelay() : plane.fallDelay
          };
        }
        return plane;
      });
    });
  }, [getFallDelay]);

  // Yeni blok oluşturma
  const handleNewBlock = useCallback((block) => {
    if (!block) return;

    const isOutOfGas = block.gasUsed / block.gasLimit >= GAS_THRESHOLD;
    const isOverloaded = block.revertRatio > 0.5;
    
    // Düşme gecikmesi belirleme
    const fallDelay = (isOutOfGas || isOverloaded) ? getFallDelay() : 0;

    const x = Math.random() > 0.5 ? -PLANE_WIDTH : GAME_WIDTH;
    const y = Math.random() * (GAME_HEIGHT / 2);
    const direction = x < 0 ? 'right' : 'left';
    const planeType = Math.random() > 0.5 ? 'plane1' : 'plane2';
    const totalCount = Array.isArray(block.transactions) ? block.transactions.length : 0;
    const gasUsed = block.gasUsed || 0;
    const gasLimit = block.gasLimit || 1;
    const gasRatio = gasUsed / gasLimit;
    const revertCount = Array.isArray(block.transactions) ? 
      block.transactions.filter(tx => tx.type === 'Other' || tx.txType === 'revert').length : 0;
    const revertRatio = totalCount > 0 ? revertCount / totalCount : 0;

    const newPlane = {
      x,
      y,
      width: PLANE_WIDTH,
      height: PLANE_HEIGHT,
      isDamaged: false,
      speed: isOverloaded ? PLANE_SPEED * 0.3 : PLANE_SPEED,
      blockNumber: Number(block.number),
      totalTxCount: totalCount,
      type: (block.type === 'ghost' || block.isGhost) ? 'ghost' : 
            (isOverloaded ? 'overloaded' : 
            (isOutOfGas ? 'outOfGas' : 'normal')),
      status: (block.type === 'ghost' || block.isGhost) ? 'ghost' : 
              (isOverloaded ? 'overloaded' : 
              (isOutOfGas ? 'outOfGas' : 'flying')),
      transactionCount: block.transactions?.length || 0,
      maxTransactions: 100,
      timestamp: block.timestamp,
      fallStartTime: null,
      direction,
      planeType,
      hitCount: 0,
      isFalling: false,
      destroyedAt: null,
      gasUsed,
      gasLimit,
      gasRatio,
      outOfGasTimestamp: isOutOfGas ? Date.now() : null,
      revertRatio,
      overloadedStartTime: isOverloaded ? Date.now() : null,
      fallDelay,
    };
    setPlanes(prev => [...prev, newPlane]);
  }, [getFallDelay]);

  // Uçak ve turret görsellerini bir kere yükle
  useEffect(() => {
    // Uçak görselleri
    const loadPlaneImg = (src, setter) => {
      const img = new window.Image();
      img.src = src;
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        const height = 64;
        const width = Math.round(height * aspectRatio);
        setter({ img, width, height });
      };
    };
    loadPlaneImg(PLANE1_IMG, setPlane1Img);
    loadPlaneImg(PLANE1_DAMAGED_IMG, setPlane1DamagedImg);
    loadPlaneImg(PLANE2_IMG, setPlane2Img);
    loadPlaneImg(PLANE2_DAMAGED_IMG, setPlane2DamagedImg);

    // Turret görselleri
    const loadedTurretImgs = {};
    Object.entries(TURRET_IMGS).forEach(([type, src]) => {
      const img = new window.Image();
      img.src = src;
      img.onload = () => {
        const width = img.width * TURRET_SCALE;
        const height = img.height * TURRET_SCALE;
        loadedTurretImgs[type] = { img, width, height };
        setTurretImgs(prev => ({ ...prev, [type]: { img, width, height } }));
        console.log(`${type} turret yüklendi:`, { width, height });
      };
      img.onerror = (err) => {
        console.error(`${type} turret yüklenemedi:`, err);
      };
    });
  }, []);

  // Turret'ların y pozisyonunu orijinal boyuta göre ayarlamak için bir fonksiyon
  const getTurretY = (type) => {
    const turretImg = turretImgs[type];
    if (turretImg) {
      return GAME_HEIGHT - turretImg.height + 70; // 10px boşluk bırak
    }
    return GAME_HEIGHT - 80; // Yedek değer
  };

  // Sadece NFT Mint turret için özel pozisyon ve boyut
  const getTurretX = (type) => {
    if (type === 'NFT Mint' && turretImgs['NFT Mint']) {
      return (GAME_WIDTH - turretImgs['NFT Mint'].width) / 2;
    }
    // Diğer turretlar için mevcut x değerini kullan
    return null;
  };

  // Turret state'ini sabit aralıklarla ve kolay ayarlanabilir şekilde oluştur
  const turretTypes = ['Transfer', 'NFT Mint', 'DEX Swap', 'Contract Creation', 'Other'];
  const [turrets, setTurrets] = useState(
    turretTypes.map((type, i) => ({
      x: TURRET_X_START + i * TURRET_X_GAP,
      y: TURRET_Y_OFFSET,
      lastShot: 0,
      type
    }))
  );

  // Uçakların üst üste gelmesini engelleyen fonksiyon
  function getNonOverlappingY(existingPlanes, width, height) {
    const minY = 20;
    const maxY = GAME_HEIGHT * 0.4 - height;
    const step = 10;
    let tries = 0;
    while (tries < 50) {
      const y = minY + Math.random() * (maxY - minY);
      const overlap = existingPlanes.some(p => Math.abs(p.y - y) < height + 10);
      if (!overlap) return y;
      tries++;
    }
    // Hiç uygun yer bulunamazsa rastgele ver
    return minY + Math.random() * (maxY - minY);
  }

  // Yeni uçak oluşturma (güncellendi)
  const createPlane = (block) => {
    // Blok numarasına göre yön ve tip belirle
    const isEven = Number(block.number) % 2 === 0;
    const planeType = isEven ? 'plane2' : 'plane1';
    const direction = isEven ? 'left' : 'right';
    const imgObj = isEven ? plane2Img : plane1Img;
    const width = imgObj?.width || 80;
    const height = imgObj?.height || 64;
    const x = direction === 'left' ? GAME_WIDTH - width : 0;
    // Üst üste gelmeyi engelle
    const y = getNonOverlappingY(planes, width, height);
    
    // Gas kullanım oranını hesapla
    const gasUsed = block.gasUsed || 0;
    const gasLimit = block.gasLimit || 1;
    const gasRatio = gasUsed / gasLimit;
    
    // Overloaded block kontrolü: revert oranı %50'den fazlaysa
    let revertCount = 0;
    let totalCount = Array.isArray(block.transactions) ? block.transactions.length : 0;
    if (Array.isArray(block.transactions)) {
      revertCount = block.transactions.filter(tx => tx.type === 'Other' || tx.txType === 'revert').length;
    }
    const revertRatio = totalCount > 0 ? revertCount / totalCount : 0;
    const isOverloaded = revertRatio > 0.5;
    
    const newPlane = {
      x,
      y,
      width,
      height,
      isDamaged: false,
      speed: isOverloaded ? PLANE_SPEED * 0.3 : PLANE_SPEED, // Overloaded uçaklar daha yavaş
      blockNumber: Number(block.number),
      totalTxCount: totalCount,
      type: (block.type === 'ghost' || block.isGhost) ? 'ghost' : (isOverloaded ? 'overloaded' : 'normal'),
      status: (block.type === 'ghost' || block.isGhost) ? 'ghost' : (isOverloaded ? 'overloaded' : 'flying'),
      transactionCount: block.transactions?.length || 0,
      maxTransactions: 100,
      timestamp: block.timestamp,
      fallStartTime: null,
      direction,
      planeType,
      hitCount: 0,
      isFalling: false,
      destroyedAt: null,
      gasUsed,
      gasLimit,
      gasRatio,
      outOfGasTimestamp: null,
      revertRatio,
      overloadedStartTime: isOverloaded ? Date.now() : null,
      fallDelay: isOverloaded ? Math.random() * 5000 + 5000 : 0, // 5-10 saniye arası rastgele düşme gecikmesi
    };
    setPlanes(prev => [...prev, newPlane]);
  };

  // Mermi oluşturma (count parametresi eklendi)
  const createBullet = (turretType, targetPlane, count, tx) => {
    const turret = turrets.find(t => t.type === turretType);
    if (!turret || !targetPlane) return;
    const offset = TURRET_BULLET_OFFSETS[turretType] || {x: 0, y: 0};
    // Başlangıç için: tx.type === 'Other' ise revert, değilse success
    const txType = tx?.type === 'Other' ? 'revert' : 'success';
    const color = txType === 'success' ? '#00ff00' : '#ff0000';
    const bullet = {
      x: turret.x + offset.x,
      y: turret.y + offset.y,
      width: 32,
      height: 32,
      speed: BULLET_SPEED,
      type: turretType,
      targetPlaneId: targetPlane.blockNumber,
      id: Date.now() + Math.random(),
      count, // Bu type'dan kaç adet var
      txHash: tx?.hash,
      txType,
      color,
      status: 'flying',
      from: tx?.from,
      to: tx?.to,
      value: tx?.value
    };
    bulletsRef.current = [...bulletsRef.current, bullet];
    setBullets([...bulletsRef.current]);
  };

  // Çarpışma kontrolü
  const checkCollision = (bullet, plane) => {
    return bullet.x < plane.x + plane.width &&
           bullet.x + bullet.width > plane.x &&
           bullet.y < plane.y + plane.height &&
           bullet.y + bullet.height > plane.y;
  };

  // Blok verilerini dinle
  useEffect(() => {
    if (DEBUG) {
      console.log('=== Blok Verileri Güncellendi ===');
      console.log('Gelen bloklar:', blocks);
    }
    if (blocks && blocks.length > 0) {
      const latestBlock = blocks[blocks.length - 1];
      if (DEBUG) {
        console.log('Son blok:', latestBlock);
      }
      if (!planes.some(plane => Number(plane.blockNumber) === Number(latestBlock.number))) {
        if (DEBUG) console.log('Yeni uçak oluşturuluyor');
        createPlane(latestBlock);
      }
      updatePlaneData(latestBlock);
    }
    // blocks dizisini maksimum 100 ile sınırla
    if (blocks.length > 100) {
      blocks.splice(0, blocks.length - 100);
    }
  }, [blocks]);

  // Turret'lerin ateş etmesini kontrol et
  useEffect(() => {
    console.log('Turret ateş etme intervali başlatıldı');
    const checkTurretFire = () => {
      console.log('checkTurretFire çalıştı');
      setTurrets(prevTurrets => {
        return prevTurrets.map(turret => {
          const now = Date.now();
          if (now - turret.lastShot > 1000) {
            const targetPlane = planes.find(p => Number(p.blockNumber) === Number(turret.targetPlaneId));
            console.log('Turret ateş etmeye çalışıyor:', turret, targetPlane);
            if (targetPlane) createBullet(turret.type, targetPlane, 0, null);
            return { ...turret, lastShot: now };
          }
          return turret;
        });
      });
    };
    const fireInterval = setInterval(checkTurretFire, 1000);
    return () => clearInterval(fireInterval);
  }, []);

  // Debug için turret pozisyonlarını konsola yazdır
  useEffect(() => {
    console.log("Turret pozisyonları:", turrets);
    console.log("Turret görselleri:", turretImgs);
  }, [turrets, turretImgs]);

  // Yeni blok geldiğinde her tx için bir bullet gönder (her blok için sadece bir kez)
  useEffect(() => {
    if (!blocks || blocks.length === 0) return;
    const latestBlock = blocks[blocks.length - 1];
    if (!latestBlock.transactions || latestBlock.transactions.length === 0) return;
    // Daha önce ateşlendi mi?
    if (firedBlockNumbers.current.has(latestBlock.number)) return;
    // Hedef uçağı bul (düşmeyen)
    const targetPlane = planes.find(p => Number(p.blockNumber) === Number(latestBlock.number) && !p.isFalling);
    if (!targetPlane) return;
    // Her işlem için bir mermi oluştur
    latestBlock.transactions.forEach(tx => {
      createBullet(tx.type, targetPlane, 1, tx); // Her tx için bir mermi, count=1, tx objesi ile
    });
    firedBlockNumbers.current.add(latestBlock.number);
  }, [blocks, planes]);

  // Debug için blocks ve planes'i konsola yazdır
  useEffect(() => {
    if (DEBUG) {
      console.log('=== State Güncellemesi ===');
      console.log('blocks:', blocks);
      console.log('planes:', planes);
      console.log('bullets:', bullets);
    }
  }, [blocks, planes, bullets]);

  // Son blok bilgisini al
  const latestBlock = blocks && blocks.length > 0 ? blocks[blocks.length - 1] : null;

  // Game loop optimizasyonu
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let lastRenderTime = 0;
    let animationFrameId;

    const bgImg = new window.Image();
    bgImg.src = BG_GIF;

    const gameLoop = (currentTime) => {
      // FPS kontrolü
      if (currentTime - lastRenderTime < RENDER_INTERVAL) {
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
      }
      lastRenderTime = currentTime;

      // Canvas temizleme
      ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // Arka plan çizimi (sadece değiştiğinde)
      if (bgImg.complete) {
        const scaledWidth = GAME_WIDTH * BG_SCALE;
        const scaledHeight = GAME_HEIGHT * BG_SCALE;
        ctx.drawImage(
          bgImg,
          BG_X_OFFSET,
          BG_Y_OFFSET,
          scaledWidth,
          scaledHeight
        );
      }

      // Mermileri optimize et
      if (bulletsRef.current.length > 100) {
        bulletsRef.current = bulletsRef.current.slice(-100);
      }

      // Uçakları optimize et
      if (planes.length > 15) {
        setPlanes(prev => prev.slice(-15));
      }

      // Mermileri hareket ettir (optimize edilmiş)
      bulletsRef.current = bulletsRef.current
        .map(bullet => {
        const targetPlane = planes.find(p => Number(p.blockNumber) === Number(bullet.targetPlaneId));
          if (!targetPlane) return null;

          const bulletCenter = {
            x: bullet.x + bullet.width / 2,
            y: bullet.y + bullet.height / 2
          };
          const planeCenter = {
            x: targetPlane.x + targetPlane.width / 2,
            y: targetPlane.y + targetPlane.height / 2
          };

          const dx = planeCenter.x - bulletCenter.x;
          const dy = planeCenter.y - bulletCenter.y;
          const dist = Math.sqrt(dx*dx + dy*dy);

          if (dist < 25) {
            // Başarılı mermi (success): yeşil patlama efekti
            if (bullet.txType === 'success') {
              // Patlama efekti için kısa süreli bir daire çiz
              const ctx = canvasRef.current.getContext('2d');
              ctx.save();
              ctx.globalAlpha = 0.8;
              ctx.beginPath();
              ctx.arc(bullet.x + bullet.width/2, bullet.y + bullet.height/2, 24, 0, Math.PI * 2);
              ctx.fillStyle = '#00ff00';
              ctx.shadowColor = '#00ff00';
              ctx.shadowBlur = 20;
              ctx.fill();
              ctx.restore();
            }
            // Başarısız mermi (revert): kırmızı sekme efekti
            if (bullet.txType === 'revert') {
              const ctx = canvasRef.current.getContext('2d');
              ctx.save();
              ctx.globalAlpha = 0.8;
              ctx.beginPath();
              ctx.arc(bullet.x + bullet.width/2, bullet.y + bullet.height/2, 18, 0, Math.PI * 2);
              ctx.fillStyle = '#ff0000';
              ctx.shadowColor = '#ff0000';
              ctx.shadowBlur = 16;
              ctx.fill();
              ctx.restore();
            }
            // Bullet status güncelle
            bullet.status = bullet.txType === 'success' ? 'hit' : 'reverted';
            setTimeout(() => {
              // Patlama/sekme efekti kısa süre sonra kaybolsun
              bulletsRef.current = bulletsRef.current.filter(b => b.id !== bullet.id);
              setBullets([...bulletsRef.current]);
            }, 200);
            // Uçak hitCount güncellemesi ve diğer mantıklar aşağıda devam ediyor
            setPlanes(prevPlanes => prevPlanes.map(p => {
              if (p.blockNumber === targetPlane.blockNumber) {
                const newHit = (p.hitCount || 0) + 1;
                // Sadece gas limit aşılmadıysa ve tx kadar vurulduysa damaged yap, ama düşürme
                if (p.transactionCount > 0 && newHit >= p.transactionCount && p.gasUsed <= p.gasLimit && !p.isDamaged) {
                  setTimeout(() => {
                    setPlanes(prev2 => prev2.map(pp => pp.blockNumber === p.blockNumber ? { ...pp, hitCount: newHit, isDamaged: true, isFalling: false } : pp));
                  }, 500);
                  return { ...p, hitCount: newHit };
                }
                return { ...p, hitCount: newHit };
              }
              return p;
            }));
            return null;
          }

          const speed = bullet.speed;
          const vx = (dx / dist) * speed;
          const vy = (dy / dist) * speed;

          return {
            ...bullet,
            x: bullet.x + vx,
            y: bullet.y + vy
          };
        })
        .filter(bullet => 
          bullet && 
          bullet.x > 0 && 
          bullet.x < GAME_WIDTH && 
          bullet.y > 0 && 
          bullet.y < GAME_HEIGHT
        );

      // Mermileri çiz (optimize edilmiş)
      ctx.save();
      bulletsRef.current.forEach(bullet => {
        ctx.shadowColor = bullet.color || '#fff';
        ctx.shadowBlur = 30;
        ctx.fillStyle = bullet.color || '#fff';
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.arc(bullet.x + bullet.width/2, bullet.y + bullet.height/2, bullet.width/2, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      // Turret'leri çiz
      turrets.forEach(turret => {
        const turretImg = turretImgs[turret.type];
        const x = turret.x;
        const y = turret.y;
        
        if (turretImg?.img) {
          ctx.drawImage(turretImg.img, x, y, turretImg.width, turretImg.height);
        } else {
          // Fallback görsel
          ctx.fillStyle = '#ff0000';
          ctx.fillRect(x, y, 80, 80);
          ctx.fillStyle = '#fff';
          ctx.fillText(turret.type, x, y + 40);
        }
        
        // Turret tipini yaz
        ctx.save();
        ctx.font = 'bold 24px VT323, monospace';
        ctx.fillStyle = '#00ff00';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 8;
        ctx.fillText(
          turret.type === 'Contract Creation' ? 'Contract' : turret.type,
          x + (turretImg?.width || 80) / 2,
          y + (turretImg?.height || 80) + 32
        );
        ctx.restore();
      });

      // Uçakları çiz (optimize edilmiş)
      planes.forEach(plane => {
        // Düşme başlatma kontrolü (her frame)
        if (!plane.isFalling && (plane.type === 'outOfGas' || plane.type === 'overloaded')) {
          const startTime = plane.type === 'outOfGas' ? plane.outOfGasTimestamp : plane.overloadedStartTime;
          if (startTime && Date.now() - startTime > plane.fallDelay) {
            plane.isFalling = true;
            plane.fallStartTime = Date.now();
          }
        }

        // Düşen uçaklar için damaged görsel ve titrek/yarı opak efekt
        let imgObj;
        if (plane.isFalling) {
          if (plane.planeType === 'plane1') {
            imgObj = plane1DamagedImg || plane1Img;
          } else {
            imgObj = plane2DamagedImg || plane2Img;
          }
        } else {
          imgObj = plane.planeType === 'plane1' ? plane1Img : plane2Img;
        }

        ctx.save();
        // Düşen uçaklar için opaklık ve titreme
        if (plane.isFalling) {
          ctx.globalAlpha = 0.55;
          const jitterX = Math.sin(Date.now() / 60 + plane.blockNumber) * 2;
          const jitterY = Math.cos(Date.now() / 50 + plane.blockNumber) * 2;
          if (imgObj?.img) {
            ctx.drawImage(
              imgObj.img,
              plane.x + jitterX,
              plane.y + jitterY,
              imgObj.width || plane.width,
              imgObj.height || plane.height
            );
          } else {
            ctx.fillStyle = '#888';
            ctx.fillRect(plane.x + jitterX, plane.y + jitterY, plane.width, plane.height);
          }
        } else {
          ctx.globalAlpha = 1;
          if (imgObj?.img) {
            ctx.drawImage(
              imgObj.img,
              plane.x,
              plane.y,
              imgObj.width || plane.width,
              imgObj.height || plane.height
            );
          } else {
            ctx.fillStyle = '#888';
            ctx.fillRect(plane.x, plane.y, plane.width, plane.height);
          }
        }
        ctx.restore();

        // Uçak tipi etiketi ve blok numarası, tx sayısı
        ctx.save();
        ctx.font = 'bold 18px VT323, monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 4;
        let labelColor = '#fff';
        let typeLabel = '';
        if (plane.type === 'overloaded') {
          labelColor = '#ffcc00';
          typeLabel = 'OVERLOADED';
        } else if (plane.type === 'outOfGas') {
          labelColor = '#ff4444';
          typeLabel = 'OUT OF GAS';
        } else if (plane.type === 'ghost') {
          labelColor = '#00ffff';
          typeLabel = 'GHOST';
        } else {
          labelColor = '#00ff00';
          typeLabel = 'NORMAL';
        }
        ctx.fillStyle = labelColor;
        ctx.globalAlpha = 0.95;
        ctx.fillText(
          `#${plane.blockNumber} | tx: ${plane.transactionCount}`,
          plane.x + (imgObj?.width || plane.width) / 2,
          plane.y - 12
        );
        ctx.font = 'bold 16px VT323, monospace';
        ctx.fillStyle = labelColor;
        ctx.globalAlpha = 0.85;
        ctx.fillText(
          typeLabel,
          plane.x + (imgObj?.width || plane.width) / 2,
          plane.y + 10
        );
        ctx.restore();

        // Uçak tipi için görsel efektler
        if (plane.type === 'overloaded') {
          ctx.save();
          ctx.globalAlpha = 0.08;
          ctx.fillStyle = '#ffcc00';
          ctx.beginPath();
          ctx.arc(
            plane.x + (imgObj?.width || plane.width) / 2,
            plane.y + (imgObj?.height || plane.height) / 2,
            (imgObj?.width || plane.width) * 0.6,
            0, Math.PI * 2
          );
          ctx.fill();
          ctx.restore();
        } else if (plane.type === 'outOfGas') {
          ctx.save();
          ctx.globalAlpha = 0.10;
          ctx.fillStyle = '#ff4444';
          ctx.beginPath();
          ctx.arc(
            plane.x + (imgObj?.width || plane.width) / 2,
            plane.y + (imgObj?.height || plane.height) / 2,
            (imgObj?.width || plane.width) * 0.6,
            0, Math.PI * 2
          );
          ctx.fill();
          ctx.restore();
        } else if (plane.type === 'ghost') {
          ctx.save();
          ctx.globalAlpha = 0.13;
          ctx.fillStyle = '#00ffff';
          ctx.beginPath();
          ctx.arc(
            plane.x + (imgObj?.width || plane.width) / 2,
            plane.y + (imgObj?.height || plane.height) / 2,
            (imgObj?.width || plane.width) * 0.6,
            0, Math.PI * 2
          );
          ctx.fill();
          ctx.restore();
        }

        // Düşme animasyonu ve efektleri
        if (plane.isFalling) {
          const fallSpeed = plane.type === 'ghost' ? GHOST_FALL_SPEED :
                           plane.type === 'overloaded' ? OVERLOADED_FALL_SPEED :
                           plane.type === 'outOfGas' ? OUT_OF_GAS_FALL_SPEED :
                           FALL_SPEED;
          plane.y += fallSpeed;

          // Düşme sırasında alev ve duman efekti (overloaded ve outOfGas için)
          if (plane.type === 'overloaded' || plane.type === 'outOfGas') {
            ctx.save();
            ctx.globalAlpha = 0.5;
            const flameX = plane.x + (imgObj?.width || plane.width) / 2;
            const flameY = plane.y + (imgObj?.height || plane.height);
            const flameSize = 12 + Math.sin(Date.now() / 200) * 2;
            const gradient = ctx.createRadialGradient(
              flameX, flameY, 0,
              flameX, flameY, flameSize
            );
            gradient.addColorStop(0, plane.type === 'overloaded' ? '#ff6600' : '#ff0000');
            gradient.addColorStop(0.5, plane.type === 'overloaded' ? '#ff3300' : '#cc0000');
            gradient.addColorStop(1, 'rgba(255, 51, 0, 0)');
            ctx.beginPath();
            ctx.arc(flameX, flameY, flameSize, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.shadowColor = plane.type === 'overloaded' ? '#ff3300' : '#ff0000';
            ctx.shadowBlur = 8;
            ctx.fill();
            // Duman efekti
            const smokeX = flameX;
            const smokeY = flameY + 4;
            const smokeSize = 7 + Math.sin(Date.now() / 300) * 1.5;
            const smokeGradient = ctx.createRadialGradient(
              smokeX, smokeY, 0,
              smokeX, smokeY, smokeSize
            );
            smokeGradient.addColorStop(0, 'rgba(100, 100, 100, 0.15)');
            smokeGradient.addColorStop(1, 'rgba(100, 100, 100, 0)');
            ctx.beginPath();
            ctx.arc(smokeX, smokeY, smokeSize, 0, Math.PI * 2);
            ctx.fillStyle = smokeGradient;
            ctx.shadowColor = 'rgba(100, 100, 100, 0.2)';
            ctx.shadowBlur = 3;
            ctx.fill();
            ctx.restore();
          }
        } else {
          // Normal uçuş hareketi
          const moveSpeed = plane.type === 'ghost' ? GHOST_PLANE_SPEED :
                           plane.type === 'overloaded' ? OVERLOADED_PLANE_SPEED :
                           plane.type === 'outOfGas' ? OUT_OF_GAS_PLANE_SPEED :
                           PLANE_SPEED;

          if (plane.direction === 'left') {
            plane.x -= moveSpeed;
          } else if (plane.direction === 'right') {
            plane.x += moveSpeed;
          }
        }

        // Ekrandan çıkma kontrolü
        if (plane.x > GAME_WIDTH + PLANE_WIDTH || plane.x < -PLANE_WIDTH) {
          return null;
        }

        // Yere çarpma kontrolü
        if (plane.y > GAME_HEIGHT && !plane.destroyedAt) {
          plane.destroyedAt = Date.now();
        }

        // Gas kullanım göstergesi
        const gasPercent = plane.gasRatio || 0;
        const gasBarWidth = 60;
        const gasBarHeight = 4;
        const gasBarX = plane.x + (plane.width - gasBarWidth) / 2;
        const gasBarY = plane.y + (plane.height || 0) + 10;

        // Gas bar arka planı
        ctx.fillStyle = '#333';
        ctx.fillRect(gasBarX, gasBarY, gasBarWidth, gasBarHeight);

        // Gas bar doluluk
        const fillWidth = gasBarWidth * gasPercent;
        ctx.fillStyle = gasPercent > 0.9 ? '#ff4444' : '#44ff44';
        ctx.fillRect(gasBarX, gasBarY, fillWidth, gasBarHeight);

        // Gas yüzdesi
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.font = 'bold 20px monospace';
        const currentImgObj = plane.planeType === 'plane1' ? plane1Img : plane2Img;
        ctx.fillText(`Gas: ${Math.round(gasPercent * 100)}%`, plane.x + (currentImgObj?.width || plane.width)/2, plane.y + (currentImgObj?.height || plane.height) + 24);

        // Rescue animasyonu
        const now = Date.now();
        const isRescued = (plane) => plane.type === 'rescued' || rescuedPlanes.some(rp => rp.blockNumber === plane.blockNumber && now - rp.ts < RESCUE_ANIMATION_DURATION);
        if (isRescued(plane)) {
          ctx.save();
          ctx.globalAlpha = 0.7;
          ctx.beginPath();
          ctx.arc(
            plane.x + (imgObj?.width || plane.width) / 2,
            plane.y + (imgObj?.height || plane.height) / 2,
            (imgObj?.width || plane.width) * 0.7,
            0, Math.PI * 2
          );
          ctx.fillStyle = 'rgba(0,255,80,0.35)';
          ctx.shadowColor = '#00ff80';
          ctx.shadowBlur = 18;
          ctx.fill();
          ctx.restore();
          // "RESCUED" etiketi
          ctx.save();
          ctx.font = 'bold 20px VT323, monospace';
          ctx.fillStyle = '#00ff80';
          ctx.globalAlpha = 0.95;
          ctx.textAlign = 'center';
          ctx.shadowColor = '#00ff80';
          ctx.shadowBlur = 10;
          ctx.fillText('RESCUED', plane.x + (imgObj?.width || plane.width) / 2, plane.y + 10);
          ctx.restore();
        }
      });

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [blocks, plane1Img, plane1DamagedImg, plane2Img, plane2DamagedImg, turrets, planes, turretImgs, rescuedPlanes]);

  // Düşen uçakları 2 saniye sonra sil
  useEffect(() => {
    if (!planes.some(p => p.destroyedAt)) return;
    const interval = setInterval(() => {
      setPlanes(prev => prev.filter(p => !p.destroyedAt || Date.now() - p.destroyedAt < 2000));
    }, 500);
    return () => clearInterval(interval);
  }, [planes]);

  // Damaged wings paneli için logu güncelle
  useEffect(() => {
    // Yeni damaged olan uçakları loga ekle
    setDamagedWingsLog(prev => {
      const newOnes = planes.filter(p => p.isFalling && !prev.some(d => d.blockNumber === p.blockNumber));
      if (newOnes.length === 0) return prev;
      // Son 10 damaged wing'i tut
      const updated = [...newOnes.map(p => ({
        blockNumber: p.blockNumber,
        hitCount: p.hitCount,
        transactionCount: p.transactionCount,
        destroyedAt: p.destroyedAt,
      })), ...prev].slice(0, 10);
      return updated;
    });
  }, [planes]);

  // Damaged wings (düşen uçaklar)
  const damagedWings = damagedWingsLog;

  // Canvas'ta tıklama ile uçak seçimi
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      // En üstteki uçağı seç (z-index yoksa son eklenen)
      for (let i = planes.length - 1; i >= 0; i--) {
        const plane = planes[i];
        const imgObj = plane.planeType === 'plane1' ? plane1Img : plane2Img;
        const w = imgObj?.width || plane.width;
        const h = imgObj?.height || plane.height;
        if (
          mouseX >= plane.x && mouseX <= plane.x + w &&
          mouseY >= plane.y && mouseY <= plane.y + h
        ) {
          setSelectedPlane(plane);
          return;
        }
      }
      setSelectedPlane(null);
    };
    canvas.addEventListener('click', handleClick);
    return () => canvas.removeEventListener('click', handleClick);
  }, [planes, plane1Img, plane2Img]);

  // Rescue butonu fonksiyonu
  const handleRescue = (plane) => {
    setPlanes(prev => prev.map(p =>
      p.blockNumber === plane.blockNumber
        ? { ...p, type: 'rescued', status: 'rescued', isFalling: false }
        : p
    ));
    setRescuedPlanes(prev => [...prev, { blockNumber: plane.blockNumber, ts: Date.now() }]);
    setSelectedPlane(plane => plane ? { ...plane, type: 'rescued', status: 'rescued', isFalling: false } : plane);
  };

  return (
    <div style={{ 
      position: 'relative',
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      margin: '0 auto',
      background: '#000',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        zIndex: 10000
      }}>
        <Title>MONAD RETRO BLOCK TRACKER</Title>
      </div>
      {/* Bilgi kutusu: Return butonunun hemen altında */}
      <div style={{
        color: '#00ff00',
        background: '#111',
        zIndex: 1001,
        position: 'fixed',
        top: 115, // 100'den 140'a çekildi
        left: 24,
        padding: 12,
        borderRadius: 8,
        fontSize: 22,
        border: '2px solid #00ff00',
        opacity: 0.95,
        minWidth: 240,
        fontFamily: 'VT323, monospace',
        boxShadow: '0 2px 8px #00ff00',
        fontWeight: 'bold',
      }}>
        blocks.length: {blocks.length} <br />
        planes.length: {planes.length} <br />
        {latestBlock && (
          <>
            Last Block: #{latestBlock.number} <br />
            TX: {latestBlock.transactions?.length || 0} <br />
            Hash: {String(latestBlock.hash).slice(0, 10)}... <br />
            Time: {latestBlock.timestamp ? new Date(Number(latestBlock.timestamp) * 1000).toLocaleString() : ''} <br />
          </>
        )}
        {txStats && (
          <div style={{ marginTop: 8 }}>
            <b>ANALYSIS OF TRANSACTION TYPES:</b><br />
            {Object.entries(txStats).map(([type, count]) => (
              <span key={type}>{type}: {count}<br /></span>
            ))}
          </div>
        )}
      </div>
      
      {/* Atari arka plan */}
      <img 
        src={ATARI_BG} 
        alt="Atari Background"
        style={{
          position: 'absolute',
          top: ATARI_BG_Y_OFFSET,
          left: ATARI_BG_X_OFFSET,
          width: `${GAME_WIDTH * ATARI_BG_SCALE}px`,
          height: `${GAME_HEIGHT * ATARI_BG_SCALE}px`,
          zIndex: 10001, // EN ÜSTTE
          pointerEvents: 'none',
          display: 'none',
        }}
      />
      
      {/* Oyun ekranı */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        zIndex: 2,
        background: '#000000', // Siyah arka plan
        border: '4px solid #00ff00',
        borderRadius: 12,
        boxShadow: '0 0 24px #00ff00, 0 4px 32px #000a',
        overflow: 'visible'
      }}>
        {/* Turret yazıları */}
        {turrets.map((turret, i) => {
          const turretImg = turretImgs[turret.type];
          const x = turret.x;
          const y = turret.y;
          const width = turretImg?.width || 80;
          const height = turretImg?.height || 80;
          return (
            <div
              key={turret.type}
              style={{
                position: 'absolute',
                left: x + width / 2,
                top: y + height + TURRET_LABEL_Y_OFFSET,
                transform: 'translate(-50%, 0)',
                zIndex: 20000,
                fontFamily: 'VT323, monospace',
                fontSize: 24,
                color: '#00ff00',
                fontWeight: 'bold',
                textShadow: '0 0 8px #00ff00, 0 0 16px #00ff00',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                userSelect: 'none',
              }}
            >
              {turret.type === 'Contract Creation' ? 'Contract' : turret.type}
            </div>
          );
        })}
        {/* Arka plan görüntüsünü kaldırdık */}
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            imageRendering: 'pixelated',
            background: 'transparent',
            position: 'relative',
            zIndex: 2
          }}
        />
      </div>

      {/* Sağ panel: Damaged Wings Log */}
      <Panel style={{ top: 115 }}>
        <PanelTitle>DAMAGED WINGS LOG</PanelTitle>
        {damagedWings.length === 0 && <div style={{color:'#888'}}>No wings downed yet.</div>}
        {damagedWings.map(plane => (
          <React.Fragment key={plane.blockNumber}>
            <PanelRow onClick={() => setSelectedWing(selectedWing === plane.blockNumber ? null : plane.blockNumber)}>
              <b>Wing #{plane.blockNumber}</b> — <span style={{color:'#ff0000'}}>DAMAGED</span><br/>
              Hits Taken: <span style={{color:'#ffff00'}}>{plane.hitCount}/{plane.transactionCount}</span><br/>
              Destroyed: <span style={{color:'#0ff'}}>{plane.destroyedAt ? new Date(plane.destroyedAt).toLocaleString() : '-'}</span>
            </PanelRow>
            {selectedWing === plane.blockNumber && (
              <PanelDetail>
                <b>Mission Debrief:</b><br/>
                {blocks.find(b => Number(b.number) === Number(plane.blockNumber))?.transactions?.map((tx, i) => (
                  <div key={tx.hash} style={{marginBottom:4}}>
                    <span style={{color:'#0ff'}}>Hash:</span> 
                    <a href={`https://testnet.monadexplorer.com/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" style={{color:'#00ff00', textDecoration:'underline', fontFamily:'monospace'}}>
                      {tx.hash.slice(0,10)}...{tx.hash.slice(-6)}
                    </a>
                    <span style={{color:'#ff0', marginLeft:8}}>[{tx.type || 'Other'}]</span><br/>
                    <span style={{color:'#ff0'}}>Timestamp:</span> {blocks.find(b => Number(b.number) === Number(plane.blockNumber))?.timestamp ? new Date(Number(blocks.find(b => Number(b.number) === Number(plane.blockNumber))?.timestamp)*1000).toLocaleString() : '-'}
                  </div>
                ))}
              </PanelDetail>
            )}
          </React.Fragment>
        ))}
      </Panel>

      {/* Sol üstte, bilgi panelinin hemen altında seçili uçak paneli */}
      <SelectedPlanePanel selectedPlane={selectedPlane} handleRescue={handleRescue} />
    </div>
  );
}

export default RetroPlane; 