import { ethers } from 'ethers';
import { WebSocketServer } from 'ws';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// RPC URL'lerini kontrol et
const RPC_POOL = [
  process.env.REACT_APP_ALCHEMY_RPC_URL_1,
  process.env.REACT_APP_ALCHEMY_RPC_URL_2,
  process.env.REACT_APP_ALCHEMY_RPC_URL_3,
  process.env.REACT_APP_ALCHEMY_RPC_URL_4,
  process.env.REACT_APP_ALCHEMY_RPC_URL_5,
  process.env.REACT_APP_ALCHEMY_RPC_URL_6,
  process.env.REACT_APP_ALCHEMY_RPC_URL_7,
  process.env.REACT_APP_ALCHEMY_RPC_URL_8
].filter(Boolean);

if (RPC_POOL.length === 0) {
  console.error('HATA: Hiçbir RPC URL\'si bulunamadı. Lütfen .env dosyasını kontrol edin.');
  process.exit(1);
}

console.log('Kullanılabilir RPC URL\'leri:', RPC_POOL);

let currentRpcIndex = 0;

// RPC seçici
const getNextRpc = () => {
  currentRpcIndex = (currentRpcIndex + 1) % RPC_POOL.length;
  const rpc = RPC_POOL[currentRpcIndex];
  console.log('Seçilen RPC:', rpc);
  return rpc;
};

// Provider oluşturucu
const createProvider = () => {
  const rpc = getNextRpc();
  const provider = new ethers.JsonRpcProvider(rpc);
  return provider;
};

// WebSocket sunucusu
const WS_PORT = process.env.WS_PORT || 8080;
const wss = new WebSocketServer({ 
  port: Number(WS_PORT),
  perMessageDeflate: false // Performans için
});

// Bağlı istemcileri takip et
const clients = new Set();

// WebSocket bağlantı yönetimi
wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('Yeni istemci bağlandı');

  ws.on('close', () => {
    clients.delete(ws);
    console.log('İstemci bağlantısı kesildi');
  });
});

// BigInt'leri string'e çeviren replacer fonksiyonu
function replacer(key, value) {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
}

// Tüm istemcilere mesaj gönder
const broadcast = (data) => {
  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(data, replacer));
    }
  });
};

// Performans ayarları
const BLOCK_POLL_INTERVAL = Number(process.env.BLOCK_POLL_INTERVAL) || 500;
const MAX_TRANSACTIONS_PER_BLOCK = Number(process.env.MAX_TRANSACTIONS_PER_BLOCK) || 100;
const WEBSOCKET_RECONNECT_DELAY = Number(process.env.WEBSOCKET_RECONNECT_DELAY) || 1000;
const MAX_RETRIES = Number(process.env.MAX_RETRIES) || 3;
const RATE_LIMIT_WINDOW = Number(process.env.RATE_LIMIT_WINDOW) || 60000;
const RATE_LIMIT_MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;

// Son işlenen blok numarasını takip et
let lastProcessedBlockNumber = 0;

// Blok polling
const pollBlocks = async () => {
  const provider = createProvider();
  let retryCount = 0;
  
  while (retryCount < MAX_RETRIES) {
    try {
      const blockNumber = await provider.getBlockNumber();
      
      // Eğer yeni blok numarası son işlenenden küçük veya eşitse, işleme
      if (blockNumber <= lastProcessedBlockNumber) {
        console.log(`Blok ${blockNumber} zaten işlendi, atlanıyor...`);
        break;
      }

      const block = await provider.getBlock(blockNumber, false);
      
      if (block) {
        // Transaction analizi
        const stats = {
          'Transfer': 0,
          'NFT Mint': 0,
          'DEX Swap': 0,
          'Contract Creation': 0,
          'Other': 0
        };

        // Transaction'ları sınırla
        const limitedTransactions = block.transactions.slice(0, MAX_TRANSACTIONS_PER_BLOCK);

        // Transaction'ları paralel olarak işle
        const txPromises = limitedTransactions.map(async (txHash) => {
          try {
            const tx = await provider.getTransaction(txHash);
            if (tx) {
              const type = await analyzeTransactionType(tx, provider);
              stats[type]++;
              return { hash: tx.hash, type, from: tx.from, to: tx.to, value: tx.value.toString() };
            }
            return null;
          } catch (e) {
            return null;
          }
        });

        // Tüm transaction'ları paralel olarak çek
        const transactions = (await Promise.all(txPromises)).filter(Boolean);

        // WebSocket üzerinden veriyi gönder
        broadcast({
          type: 'block',
          data: {
            block: {
              number: block.number,
              hash: block.hash,
              parentHash: block.parentHash,
              timestamp: block.timestamp,
              gasUsed: block.gasUsed.toString(),
              gasLimit: block.gasLimit.toString(),
              baseFeePerGas: block.baseFeePerGas?.toString(),
              miner: block.miner,
              transactions: transactions
            },
            stats
          }
        });

        // Son işlenen blok numarasını güncelle
        lastProcessedBlockNumber = blockNumber;
        console.log(`Blok ${blockNumber} işlendi`);
        break;
      }
    } catch (error) {
      console.error(`Blok polling hatası (deneme ${retryCount + 1}/${MAX_RETRIES}):`, error);
      retryCount++;
      if (retryCount === MAX_RETRIES) {
        console.error('Maksimum deneme sayısına ulaşıldı');
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};

// Pending transaction polling
/*
const pollPendingTxs = async () => {
  const provider = createProvider();
  
  try {
    const pendingTxs = await provider.send('eth_pendingTransactions', []);
    
    if (pendingTxs.length > 0) {
      broadcast({
        type: 'pendingTxs',
        data: pendingTxs
      });
    }
  } catch (error) {
    console.error('Pending tx polling hatası:', error);
  }
};
*/

// Transaction tipini analiz et
const analyzeTransactionType = async (tx, provider) => {
  try {
    // 1. Sadece değer transferi (ETH transferi)
    if ((!tx.data || tx.data === '0x') && tx.to) {
      return 'Transfer';
    }

    // 2. DEX Swap (yaygın router signature'ları)
    if (tx.data && (
      tx.data.startsWith('0x38ed1739') ||
      tx.data.startsWith('0x18cbafe5') ||
      tx.data.startsWith('0x8803dbee') ||
      tx.data.startsWith('0x5c11d795') ||
      tx.data.startsWith('0x7ff36ab5') ||
      tx.data.startsWith('0x414bf389')
    )) {
      return 'DEX Swap';
    }

    // 3. NFT Mint (yaygın mint fonksiyonları)
    if (tx.data && (
      tx.data.startsWith('0x1249c58b') ||
      tx.data.startsWith('0x40c10f19') ||
      tx.data.startsWith('0xa0712d68') ||
      tx.data.startsWith('0x6a627842')
    )) {
      return 'NFT Mint';
    }

    // 4. Contract Creation (to alanı yok)
    if (!tx.to) {
      return 'Contract Creation';
    }

    // 5. Diğer contract interaction'lar
    if (tx.data && tx.data !== '0x') {
      return 'Other';
    }

    // 6. Fallback
    return 'Other';
  } catch (error) {
    console.error('Transaction analiz hatası:', error);
    return 'Other';
  }
};

// Express sunucusu
const app = express();
app.use(cors());
app.use(express.json());

// WebSocket sunucusunu başlat
wss.on('listening', () => {
  console.log(`WebSocket sunucusu ${WS_PORT} portunda başlatıldı`);
});

// Blok polling'i başlat
setInterval(pollBlocks, BLOCK_POLL_INTERVAL);

// Express sunucusunu başlat
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Express sunucusu ${PORT} portunda başlatıldı`);
}); 