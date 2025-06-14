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

// RPC havuzu
const RPC_POOL = [
  process.env.RPC_1,
  process.env.RPC_2,
  process.env.RPC_3,
  process.env.RPC_4,
  process.env.RPC_5
].filter(Boolean);

let currentRpcIndex = 0;

// RPC seçici
const getNextRpc = () => {
  currentRpcIndex = (currentRpcIndex + 1) % RPC_POOL.length;
  return RPC_POOL[currentRpcIndex];
};

// Provider oluşturucu
const createProvider = () => {
  return new ethers.JsonRpcProvider(getNextRpc());
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

// Blok polling
const pollBlocks = async () => {
  const provider = createProvider();
  
  try {
    const blockNumber = await provider.getBlockNumber();
    const block = await provider.getBlock(blockNumber, false); // sadece hash'ler gelir
    let transactions = [];

    if (block && block.transactions && block.transactions.length > 0) {
      // Her tx hash için detayları çek
      transactions = await Promise.all(
        block.transactions.map(async (txHash) => {
          try {
            return await provider.getTransaction(txHash);
          } catch (e) {
            return null;
          }
        })
      );
      // null olanları filtrele
      transactions = transactions.filter(Boolean);
    }

    if (block) {
      // Transaction analizi
      const stats = {
        'Transfer': 0,
        'NFT Mint': 0,
        'DEX Swap': 0,
        'Contract Creation': 0,
        'Other': 0
      };

      // Transaction'ları analiz et
      const txsWithType = await Promise.all(transactions.map(async (tx) => {
        const type = await analyzeTransactionType(tx, provider);
        stats[type]++;
        return { ...tx, type };
      }));

      broadcast({
        type: 'block',
        data: {
          block: { ...block, transactions: txsWithType }, // frontend'e type ile gönder
          stats
        }
      });
    }
  } catch (error) {
    console.error('Blok polling hatası:', error);
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

// Sağlık kontrolü endpoint'i
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Sunucuyu başlat
app.listen(process.env.HTTP_PORT, () => {
  console.log(`HTTP sunucusu ${process.env.HTTP_PORT} portunda çalışıyor`);
});

// Polling interval'larını başlat
setInterval(pollBlocks, process.env.BLOCK_POLL_INTERVAL);
//setInterval(pollPendingTxs, process.env.PENDING_TX_POLL_INTERVAL);

console.log(`WebSocket sunucusu ${process.env.WS_PORT} portunda çalışıyor`); 