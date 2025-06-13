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

const BG_SCALE = 1.15; // Orijinal boyut
const BG_X_OFFSET = 10; // X ekseninde kaydırma (pixel cinsinden)
const BG_Y_OFFSET = 11; // Y ekseninde kaydırma (pixel cinsinden)

// Her turret tipi için bullet çıkış pozisyonu offsetleri (ince ayar için)
const TURRET_BULLET_OFFSETS = {
  'Transfer': { x: 30, y: 0 },
  'NFT Mint': { x: 30, y: 0 },
  'DEX Swap': { x: 30, y: 0 },
  'Contract Creation': { x: 30, y: 0 },
  'Other': { x: 30, y: 0 }
};

const Title = styled.h1`
  color: #00ff00;
  text-align: center;
  text-shadow: 0 0 5px #00ff00;
  font-family: 'VT323', monospace;
  margin: 0;
`;

export default function RetroPlane({ blocks, onReturn, txStats }) {
  const canvasRef = useRef(null);
  const [planes, setPlanes] = useState([]);
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
    const turret = turrets.find(t => t.type === turretType);
    const offset = TURRET_BULLET_OFFSETS[turretType] || { x: 0, y: 0 };
    const bulletImg = BULLET_IMGS[turretType] || BULLET_IMGS['Other'];
    if (!turret || !targetPlane) return;
    const bullet = {
      x: turret.x + offset.x,
      y: turret.y + offset.y,
      width: 16,
      height: 32,
      speed: BULLET_SPEED,
      type: turretType,
      targetPlaneId: targetPlane.blockNumber,
      imgSrc: bulletImg
    };
    setBullets(prev => [...prev, bullet]);
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
    if (blocks && blocks.length > 0) {
      const latestBlock = blocks[blocks.length - 1];
      if (!planes.some(plane => Number(plane.blockNumber) === Number(latestBlock.number))) {
        createPlane(latestBlock);
      }
      updatePlaneData(latestBlock);
    }
    // eslint-disable-next-line
  }, [blocks]);

  // Turret'lerin ateş etmesini kontrol et
  useEffect(() => {
    const checkTurretFire = () => {
      setTurrets(prevTurrets => {
        return prevTurrets.map(turret => {
          const now = Date.now();
          if (now - turret.lastShot > 1000) {
            const targetPlane = planes.find(p => Number(p.blockNumber) === Number(turret.targetPlaneId));
            if (targetPlane) createBullet(turret.type, targetPlane);
            return { ...turret, lastShot: now };
          }
          return turret;
        });
      });
    };

    const fireInterval = setInterval(checkTurretFire, 1000);
    return () => clearInterval(fireInterval);
  }, [turrets, planes]);

  // Debug için turret pozisyonlarını konsola yazdır
  useEffect(() => {
    console.log("Turret pozisyonları:", turrets);
    console.log("Turret görselleri:", turretImgs);
  }, [turrets, turretImgs]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    const gameLoop = (timestamp) => {
      // Canvas'ı temizle
      ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // Uçakları çiz (state güncellemesi yok)
      planes.forEach(plane => {
        // TX sayısını güncel tut
        const blockData = blocks.find(b => Number(b.number) === Number(plane.blockNumber));
        if (blockData) {
          plane.transactionCount = blockData.transactions?.length || 0;
        }
        // Uçak hareketi
        if (plane.direction === 'left') {
          plane.x -= plane.speed;
        } else {
          plane.x += plane.speed;
        }
        // Uçak görselini seç
        let imgObj = null;
        if (plane.planeType === 'plane1') {
          imgObj = plane.isDamaged ? plane1DamagedImg : plane1Img;
        } else {
          imgObj = plane.isDamaged ? plane2DamagedImg : plane2Img;
        }
        // Uçak çizimi (sadece görsel yüklendiyse)
        if (imgObj?.img) {
          ctx.drawImage(imgObj.img, plane.x, plane.y, imgObj.width, imgObj.height);
        }
        // Blok numarası ve transaction sayısı büyük ve belirgin şekilde
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`#${plane.blockNumber}`, plane.x + (imgObj?.width || plane.width)/2, plane.y - 10);
        ctx.fillStyle = '#ff0';
        ctx.font = 'bold 20px monospace';
        ctx.fillText(`TX: ${plane.transactionCount}`, plane.x + (imgObj?.width || plane.width)/2, plane.y + (imgObj?.height || plane.height) + 24);
      });

      // Mermileri güncelle ve çiz
      setBullets(prevBullets => {
        return prevBullets.filter(bullet => {
          // Mermi hareketi
          bullet.y -= bullet.speed;
          // Bullet çizimi
          const bulletImg = new window.Image();
          bulletImg.src = bullet.imgSrc;
          if (bulletImg.complete) {
            ctx.drawImage(bulletImg, bullet.x, bullet.y, bullet.width, bullet.height);
          } else {
            bulletImg.onload = () => {
              ctx.drawImage(bulletImg, bullet.x, bullet.y, bullet.width, bullet.height);
            };
          }
          // Çarpışma kontrolü
          planes.forEach(plane => {
            if (checkCollision(bullet, plane)) {
              // Transaction sayısını blok verilerinden güncelle
              const blockData = blocks.find(b => Number(b.number) === Number(plane.blockNumber));
              if (blockData) {
                plane.transactionCount = blockData.transactions?.length || 0;
                if (plane.transactionCount >= plane.maxTransactions) {
                  plane.isDamaged = true;
                }
              }
            }
          });
          // Ekrandan çıkan mermileri kaldır
          return bullet.y > 0;
        });
      });

      // Uçakları silme: sadece damaged ve ekran dışına çıkanlar silinsin
      setPlanes(prevPlanes => prevPlanes.filter(plane => {
        if (!plane.isDamaged) return true;
        // Damaged ise ve ekran dışına çıktıysa sil
        if (plane.direction === 'left' && plane.x < -plane.width) return false;
        if (plane.direction === 'right' && plane.x > GAME_WIDTH) return false;
        return true;
      }));

      // Turret'leri çiz
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
      });

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [blocks, plane1Img, plane1DamagedImg, plane2Img, plane2DamagedImg, bullets, turrets, planes, turretImgs]);

  // Debug: blocks ve planes'i konsola yazdır
  useEffect(() => {
    console.log("blocks:", blocks);
    console.log("planes:", planes);
  }, [blocks, planes]);

  // Son blok bilgisini al
  const latestBlock = blocks && blocks.length > 0 ? blocks[blocks.length - 1] : null;

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
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 2
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
        background: 'transparent',
        border: '4px solid #00ff00',
        borderRadius: 12,
        boxShadow: '0 0 24px #00ff00, 0 4px 32px #000a',
        overflow: 'hidden'
      }}>
        {/* Oyun alanı arka planı için orantılı görsel */}
        <img
          src={BG_GIF}
          alt="Background GIF"
          style={{
            position: 'absolute',
            top: `calc(50% + ${BG_Y_OFFSET}px)`,
            left: `calc(50% + ${BG_X_OFFSET}px)`,
            width: `${BG_SCALE * 100}%`,
            height: `${BG_SCALE * 100}%`,
            transform: 'translate(-50%, -50%)',
            objectFit: 'contain',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />
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