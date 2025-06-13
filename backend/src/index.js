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

// Tüm istemcilere mesaj gönder
const broadcast = (data) => {
  const message = JSON.stringify(data);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

// Blok polling
const pollBlocks = async () => {
  const provider = createProvider();
  
  try {
    const blockNumber = await provider.getBlockNumber();
    const block = await provider.getBlock(blockNumber, true);
    
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
      for (const tx of block.transactions) {
        const type = await analyzeTransactionType(tx, provider);
        stats[type]++;
      }

      broadcast({
        type: 'block',
        data: {
          block,
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
    if (!tx.data || tx.data === '0x') {
      return 'Transfer';
    }

    if (!tx.to) {
      if (tx.data.startsWith('0x60806040')) {
        return 'NFT Mint';
      }
      return 'Contract Creation';
    }

    if (tx.data && (
      tx.data.startsWith('0x38ed1739') || // swapExactTokensForTokens
      tx.data.startsWith('0x18cbafe5') || // swapExactETHForTokens
      tx.data.startsWith('0x8803dbee') || // swapTokensForExactTokens
      tx.data.startsWith('0x5c11d795')    // swapETHForExactTokens
    )) {
      return 'DEX Swap';
    }

    if (tx.data && (
      tx.data.startsWith('0x1249c58b') || // mint(address,uint256)
      tx.data.startsWith('0x40c10f19')    // mint(address,uint256)
    )) {
      return 'NFT Mint';
    }

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