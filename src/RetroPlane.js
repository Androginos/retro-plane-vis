import React, { useRef, useEffect, useState } from "react";
import styled from 'styled-components';

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
const PLANE_SPEED = 2;
const BULLET_SPEED = 5;
const DAMAGED_PLANE_SPEED = 4;
const PLANE_DISAPPEAR_DELAY = 3000;
const GAS_THRESHOLD = 1000000; // Turret ateş etme eşiği

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

export default function RetroPlane({ blocks, onReturn, txStats, events }) {
  const canvasRef = useRef(null);
  const [planes, setPlanes] = useState([]);
  const bulletsRef = useRef([]);
  const [bullets, setBullets] = useState([]);
  const [turretImgs, setTurretImgs] = useState({});
  const [plane1Img, setPlane1Img] = useState(null);
  const [plane1DamagedImg, setPlane1DamagedImg] = useState(null);
  const [plane2Img, setPlane2Img] = useState(null);
  const [plane2DamagedImg, setPlane2DamagedImg] = useState(null);

  // Blok verilerini güncelleme
  const updatePlaneData = (blockData) => {
    setPlanes(prevPlanes => {
      return prevPlanes.map(plane => {
        if (Number(plane.blockNumber) === Number(blockData.number)) {
          const newCount = blockData.transactions?.length || 0;
          const isDamaged = newCount >= plane.maxTransactions;
          return {
            ...plane,
            transactionCount: newCount,
            timestamp: blockData.timestamp,
            isDamaged: isDamaged || plane.isDamaged
          };
        }
        return plane;
      });
    });
  };

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

  // Yeni uçak oluşturma
  const createPlane = (block) => {
    // Blok numarasına göre yön ve tip belirle
    const isEven = Number(block.number) % 2 === 0;
    const planeType = isEven ? 'plane2' : 'plane1';
    const direction = isEven ? 'left' : 'right';
    const imgObj = isEven ? plane2Img : plane1Img;
    const width = imgObj?.width || 80;
    const height = imgObj?.height || 64;
    const x = direction === 'left' ? GAME_WIDTH - width : 0;
    // Yalnızca üst %40'lık kısımda spawn olsun
    const maxY = GAME_HEIGHT * 0.4 - height;
    const y = 20 + Math.random() * (maxY - 20);
    const newPlane = {
      x,
      y,
      width,
      height,
      isDamaged: false,
      speed: PLANE_SPEED,
      blockNumber: Number(block.number),
      transactionCount: block.transactions?.length || 0,
      maxTransactions: 100,
      timestamp: block.timestamp,
      fallStartTime: null,
      direction,
      planeType
    };
    setPlanes(prev => [...prev, newPlane]);
  };

  // Mermi oluşturma
  const createBullet = (turretType, targetPlane) => {
    console.log('=== Mermi Oluşturma Başladı ===');
    console.log('Parametreler:', { turretType, targetPlane });
    
    const turret = turrets.find(t => t.type === turretType);
    console.log('Bulunan turret:', turret);
    
    if (!turret || !targetPlane) {
      console.log('HATA: Turret veya target plane bulunamadı');
      return;
    }
    // Offset uygula
    const offset = TURRET_BULLET_OFFSETS[turretType] || {x: 0, y: 0};
    const bullet = {
      x: turret.x + offset.x,
      y: turret.y + offset.y,
      width: 32,
      height: 32,
      speed: BULLET_SPEED,
      type: turretType,
      targetPlaneId: targetPlane.blockNumber,
      id: Date.now() + Math.random()
    };
    console.log('Oluşturulan mermi:', bullet);
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
    console.log('=== Blok Verileri Güncellendi ===');
    console.log('Gelen bloklar:', blocks);
    
    if (blocks && blocks.length > 0) {
      const latestBlock = blocks[blocks.length - 1];
      console.log('Son blok:', latestBlock);
      
      if (!planes.some(plane => Number(plane.blockNumber) === Number(latestBlock.number))) {
        console.log('Yeni uçak oluşturuluyor');
        createPlane(latestBlock);
      }
      updatePlaneData(latestBlock);
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
            if (targetPlane) createBullet(turret.type, targetPlane);
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

  // Yeni blok geldiğinde her tx tipinden bir bullet gönder
  useEffect(() => {
    console.log('=== Yeni Blok Efekti Başladı ===');
    console.log('Blocks:', blocks);
    console.log('Planes:', planes);
    
    if (!blocks || blocks.length === 0) {
      console.log('Blok yok, çıkılıyor');
      return;
    }
    
    const latestBlock = blocks[blocks.length - 1];
    console.log('Son blok:', latestBlock);
    
    if (!latestBlock.transactions || latestBlock.transactions.length === 0) {
      console.log('İşlem yok, çıkılıyor');
      return;
    }
    
    // İşlemleri type'a göre grupla
    const typeSet = new Set();
    latestBlock.transactions.forEach(tx => {
      if (!tx.type) return;
      if (!typeSet.has(tx.type)) {
        typeSet.add(tx.type);
        // Sadece bu bloğun uçağına mermi gönder
        const targetPlane = planes.find(p => Number(p.blockNumber) === Number(latestBlock.number));
        if (targetPlane) {
          createBullet(tx.type, targetPlane);
        }
      }
    });
  }, [blocks, planes]);

  // Debug için blocks ve planes'i konsola yazdır
  useEffect(() => {
    console.log("=== State Güncellemesi ===");
    console.log("blocks:", blocks);
    console.log("planes:", planes);
    console.log("bullets:", bullets);
  }, [blocks, planes, bullets]);

  // Son blok bilgisini al
  const latestBlock = blocks && blocks.length > 0 ? blocks[blocks.length - 1] : null;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    const bgImg = new window.Image();
    bgImg.src = BG_GIF;

    const gameLoop = () => {
      ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      // BG'yi çiz (ölçekli ve offsetli)
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
      // Mermileri hareket ettir
      bulletsRef.current = bulletsRef.current.map(bullet => ({
        ...bullet,
        y: bullet.y - bullet.speed
      })).filter(bullet => bullet.y + bullet.height > 0);
      setBullets([...bulletsRef.current]);
      // 1. Mermileri çiz
      bulletsRef.current.forEach(bullet => {
        ctx.save();
        ctx.shadowColor = BULLET_COLORS[bullet.type] || '#fff';
        ctx.shadowBlur = 30;
        ctx.fillStyle = BULLET_COLORS[bullet.type] || '#fff';
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.arc(bullet.x + bullet.width/2, bullet.y + bullet.height/2, bullet.width/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      // 2. Turret'leri çiz
      turrets.forEach(turret => {
        const turretImg = turretImgs[turret.type];
        const x = turret.x;
        const y = turret.y;
        if (turretImg?.img) {
          ctx.drawImage(turretImg.img, x, y, turretImg.width, turretImg.height);
        } else {
          ctx.fillStyle = '#ff0000';
          ctx.fillRect(x, y, 80, 80);
          ctx.fillStyle = '#fff';
          ctx.fillText(turret.type, x, y + 40);
        }
        // Altına tipini yaz
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
      // 3. Uçakları çiz
      planes.forEach(plane => {
        const blockData = blocks.find(b => Number(b.number) === Number(plane.blockNumber));
        if (blockData) {
          plane.transactionCount = blockData.transactions?.length || 0;
        }
        if (plane.direction === 'left') {
          plane.x -= plane.speed;
        } else {
          plane.x += plane.speed;
        }
        let imgObj = null;
        if (plane.planeType === 'plane1') {
          imgObj = plane.isDamaged ? plane1DamagedImg : plane1Img;
        } else {
          imgObj = plane.isDamaged ? plane2DamagedImg : plane2Img;
        }
        if (imgObj?.img) {
          ctx.drawImage(imgObj.img, plane.x, plane.y, imgObj.width, imgObj.height);
        }
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`#${plane.blockNumber}`, plane.x + (imgObj?.width || plane.width)/2, plane.y - 10);
        ctx.fillStyle = '#ff0';
        ctx.font = 'bold 20px monospace';
        ctx.fillText(`TX: ${plane.transactionCount}`, plane.x + (imgObj?.width || plane.width)/2, plane.y + (imgObj?.height || plane.height) + 24);
      });
      animationFrameId = requestAnimationFrame(gameLoop);
    };
    animationFrameId = requestAnimationFrame(gameLoop);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [blocks, plane1Img, plane1DamagedImg, plane2Img, plane2DamagedImg, turrets, planes, turretImgs]);

  return (
    <div style={{ 
      position: 'relative',
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      margin: '0 auto',
      background: '#000', // sade arka plan
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
      {/* Return butonu */}
      <button
        onClick={onReturn}
        style={{
          position: 'fixed',
          top: 24,
          left: 24,
          zIndex: 1000,
          background: '#000',
          color: '#00ff00',
          border: '2px solid #00ff00',
          borderRadius: 8,
          padding: '12px 24px',
          fontFamily: 'VT323, monospace',
          fontSize: 22,
          cursor: 'pointer',
          boxShadow: '0 2px 8px #00ff0080',
          textShadow: '0 0 5px #00ff00',
          transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
          textTransform: 'uppercase',
        }}
        onMouseOver={e => {
          e.currentTarget.style.background = '#111';
          e.currentTarget.style.color = '#fff';
          e.currentTarget.style.boxShadow = '0 0 16px #00ff00';
        }}
        onMouseOut={e => {
          e.currentTarget.style.background = '#000';
          e.currentTarget.style.color = '#00ff00';
          e.currentTarget.style.boxShadow = '0 2px 8px #00ff0080';
        }}
      >
        RETURN
      </button>
      {/* Bilgi kutusu: Return butonunun hemen altında */}
      <div style={{
        color: '#00ff00',
        background: '#111',
        zIndex: 1001,
        position: 'fixed',
        top: 100, // butondan daha aşağıda
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
            Son Blok: #{latestBlock.number} <br />
            TX: {latestBlock.transactions?.length || 0} <br />
            Hash: {String(latestBlock.hash).slice(0, 10)}... <br />
            Zaman: {latestBlock.timestamp ? new Date(Number(latestBlock.timestamp) * 1000).toLocaleString() : ''} <br />
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
    </div>
  );
} 