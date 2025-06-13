import React, { useRef, useEffect, useState } from "react";

// Asset yolları
const PLANE_IMG = process.env.PUBLIC_URL + "/assets/planes/plane1.png";
const TURRET_IMG = process.env.PUBLIC_URL + "/assets/turrets/transfer_turret.png";
const BULLET_IMG = process.env.PUBLIC_URL + "/assets/bullets/red_bullet.png";
const ATARI_BG = process.env.PUBLIC_URL + "/assets/atari_bg.png";
const RETURN_BTN = process.env.PUBLIC_URL + "/assets/return_button.png";

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

export default function RetroPlane({ blocks, onReturn }) {
  const canvasRef = useRef(null);
  const [planes, setPlanes] = useState([]);
  const [bullets, setBullets] = useState([]);
  const [turrets, setTurrets] = useState([
    { x: 100, y: GAME_HEIGHT - 60, lastShot: 0 },
    { x: 400, y: GAME_HEIGHT - 60, lastShot: 0 },
    { x: 700, y: GAME_HEIGHT - 60, lastShot: 0 }
  ]);

  // Blok verilerini güncelleme
  const updatePlaneData = (blockData) => {
    setPlanes(prevPlanes => {
      return prevPlanes.map(plane => {
        if (plane.blockNumber === blockData.number) {
          const newCount = blockData.transactions?.length || 0;
          const isDamaged = newCount >= plane.maxTransactions;
          
          return {
            ...plane,
            transactionCount: newCount,
            gasUsed: blockData.gasUsed,
            timestamp: blockData.timestamp,
            isDamaged: isDamaged || plane.isDamaged
          };
        }
        return plane;
      });
    });
  };

  // Yeni uçak oluşturma
  const createPlane = (block) => {
    const newPlane = {
      x: Math.random() * (GAME_WIDTH - 80),
      y: -64,
      width: 80,
      height: 64,
      isDamaged: false,
      speed: PLANE_SPEED,
      blockNumber: block.number,
      transactionCount: block.transactions?.length || 0,
      maxTransactions: 100,
      gasUsed: block.gasUsed,
      timestamp: block.timestamp,
      fallStartTime: null
    };
    setPlanes(prev => [...prev, newPlane]);
  };

  // Mermi oluşturma
  const createBullet = (turretX, turretY) => {
    const newBullet = {
      x: turretX + 30,
      y: turretY,
      width: 16,
      height: 32,
      speed: BULLET_SPEED
    };
    setBullets(prev => [...prev, newBullet]);
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
      
      // Yeni blok için uçak oluştur
      if (!planes.some(plane => plane.blockNumber === latestBlock.number)) {
        createPlane(latestBlock);
      }
      
      // Mevcut blok verilerini güncelle
      updatePlaneData(latestBlock);
    }
  }, [blocks]);

  // Turret'lerin ateş etmesini kontrol et
  useEffect(() => {
    const checkTurretFire = () => {
      setTurrets(prevTurrets => {
        return prevTurrets.map(turret => {
          const now = Date.now();
          if (now - turret.lastShot > 1000) { // Her saniye kontrol et
            // Gas kullanımı yüksek olan bloklar için ateş et
            const highGasBlock = planes.find(plane => 
              plane.gasUsed > GAS_THRESHOLD && !plane.isDamaged
            );
            
            if (highGasBlock) {
              createBullet(turret.x, turret.y);
              return { ...turret, lastShot: now };
            }
          }
          return turret;
        });
      });
    };

    const fireInterval = setInterval(checkTurretFire, 1000);
    return () => clearInterval(fireInterval);
  }, [planes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    const gameLoop = (timestamp) => {
      // Canvas'ı temizle
      ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // Arka plan
      const gradient = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
      gradient.addColorStop(0, "#3a7bd5");
      gradient.addColorStop(1, "#00d2ff");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // Uçakları güncelle ve çiz
      setPlanes(prevPlanes => {
        return prevPlanes.filter(plane => {
          // Uçak hareketi
          plane.y += plane.isDamaged ? DAMAGED_PLANE_SPEED : plane.speed;
          
          // Uçak çizimi
          const planeImg = new window.Image();
          planeImg.src = PLANE_IMG;
          ctx.drawImage(planeImg, plane.x, plane.y, plane.width, plane.height);

          // Blok numarası (retro stil)
          ctx.fillStyle = '#00ff00';
          ctx.font = '16px "Press Start 2P", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`#${plane.blockNumber}`, plane.x + plane.width/2, plane.y - 5);

          // Transaction sayacı
          const txProgress = (plane.transactionCount / plane.maxTransactions) * 100;
          ctx.fillStyle = plane.isDamaged ? '#ff0000' : '#00ff00';
          ctx.fillRect(plane.x, plane.y - 20, (plane.width * txProgress) / 100, 5);

          // Transaction sayısı
          ctx.fillStyle = '#ffffff';
          ctx.font = '12px "Press Start 2P", monospace';
          ctx.fillText(`TX: ${plane.transactionCount}`, plane.x + plane.width/2, plane.y - 25);

          // Gas kullanımı
          ctx.fillStyle = '#ffff00';
          ctx.fillText(`Gas: ${Math.floor(plane.gasUsed / 1000)}k`, plane.x + plane.width/2, plane.y - 40);

          // Düşme kontrolü
          if (plane.isDamaged && !plane.fallStartTime) {
            plane.fallStartTime = timestamp;
          }

          // Düşen uçakları belirli süre sonra kaldır
          if (plane.isDamaged && plane.fallStartTime && timestamp - plane.fallStartTime > PLANE_DISAPPEAR_DELAY) {
            return false;
          }

          // Ekrandan çıkan uçakları kaldır
          return plane.y < GAME_HEIGHT;
        });
      });

      // Mermileri güncelle ve çiz
      setBullets(prevBullets => {
        return prevBullets.filter(bullet => {
          // Mermi hareketi
          bullet.y -= bullet.speed;
          
          // Mermi çizimi
          const bulletImg = new window.Image();
          bulletImg.src = BULLET_IMG;
          ctx.drawImage(bulletImg, bullet.x, bullet.y, bullet.width, bullet.height);

          // Çarpışma kontrolü
          planes.forEach(plane => {
            if (checkCollision(bullet, plane)) {
              // Transaction sayısını blok verilerinden güncelle
              const blockData = blocks.find(b => b.number === plane.blockNumber);
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

      // Turret'leri çiz
      turrets.forEach(turret => {
        const turretImg = new window.Image();
        turretImg.src = TURRET_IMG;
        ctx.drawImage(turretImg, turret.x, turret.y, 60, 60);
      });

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [blocks]);

  return (
    <div style={{ 
      position: 'relative',
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      margin: '0 auto',
    }}>
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
      
      {/* Oyun ekranı */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        zIndex: 1,
        background: '#222',
        border: '4px solid #0ff',
        borderRadius: 12,
        boxShadow: '0 4px 32px #000a',
        overflow: 'hidden'
      }}>
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            imageRendering: 'pixelated'
          }}
        />
      </div>
    </div>
  );
} 