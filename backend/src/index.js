/* global BigInt */
import { createPublicClient, http as viemHttp } from 'viem';
import { WebSocketServer } from 'ws';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import http from 'http';
import WebSocket from 'ws';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());

const server = http.createServer(app);
const wss = new WebSocketServer({ 
  server,
  perMessageDeflate: false,
  clientTracking: true
});

const PORT = process.env.PORT || 3001;

// Alchemy RPC URL'leri
const RPC_URLS = [
  process.env.REACT_APP_ALCHEMY_RPC_URL_1,
  process.env.REACT_APP_ALCHEMY_RPC_URL_2,
  process.env.REACT_APP_ALCHEMY_RPC_URL_3,
  process.env.REACT_APP_ALCHEMY_RPC_URL_4,
  process.env.REACT_APP_ALCHEMY_RPC_URL_5,
  process.env.REACT_APP_ALCHEMY_RPC_URL_6,
  process.env.REACT_APP_ALCHEMY_RPC_URL_7,
  process.env.REACT_APP_ALCHEMY_RPC_URL_8,
  process.env.REACT_APP_ALCHEMY_RPC_URL_9,
  process.env.REACT_APP_ALCHEMY_RPC_URL_10
].filter(Boolean); // undefined olanları filtrele

if (RPC_URLS.length === 0) {
  console.error('HATA: Hiçbir RPC URL\'si bulunamadı. Lütfen .env dosyasını kontrol edin.');
  process.exit(1);
}

console.log('Kullanılabilir RPC URL\'leri:', RPC_URLS.length);

let currentRpcIndex = 0;
const getNextRpc = () => {
  currentRpcIndex = (currentRpcIndex + 1) % RPC_URLS.length;
  const rpc = RPC_URLS[currentRpcIndex];
  console.log('Seçilen RPC:', rpc);
  return rpc;
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000;

// .env'den polling aralığı ve blok/saniye değeri
const POLL_INTERVAL = parseInt(process.env.BLOCK_POLL_INTERVAL_MS || '250', 10); // ms
const BLOCKS_PER_SECOND = parseInt(process.env.BLOCKS_PER_SECOND || '2', 10); // monad için 2

// Monad chain tanımlaması
const monadChain = {
  id: 9090,
  name: 'Monad',
  network: 'monad',
  nativeCurrency: {
    name: 'Monad',
    symbol: 'MND',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: RPC_URLS,
    },
    public: {
      http: RPC_URLS,
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: 'https://explorer.monad.xyz',
    },
  },
};

let lastProcessedBlock = { number: 0, hash: '' };
let isPolling = false;
let wsClients = new Set();

// Linter ve ortam uyumu için yardımcı fonksiyon
const toBigInt = (val) => {
  if (typeof val === 'bigint') return val;
  if (typeof val === 'number') return BigInt(val);
  if (typeof val === 'string') {
    if (val.endsWith('n')) return BigInt(val.slice(0, -1));
    return BigInt(val);
  }
  throw new Error('toBigInt: Unsupported type');
};

// Viem client oluştur
const createProvider = () => {
  const rpcUrl = getNextRpc();
  return createPublicClient({
    chain: monadChain,
    transport: viemHttp(rpcUrl)
  });
};

// WebSocket bağlantı yönetimi
wss.on('connection', (ws) => {
  console.log('Yeni WebSocket bağlantısı kuruldu');
  wsClients.add(ws);

  // Ping-pong mekanizması
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    }
  }, 30000);

  ws.on('pong', () => {
    console.log('Pong alındı');
  });

  ws.on('close', () => {
    console.log('WebSocket bağlantısı kapandı');
    clearInterval(pingInterval);
    wsClients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket hatası:', error);
    clearInterval(pingInterval);
    wsClients.delete(ws);
  });
});

// Transaction tipini analiz et
const analyzeTransactionType = (tx) => {
  try {
    if (!tx || !tx.input) return 'unknown';
    
    const input = tx.input.toLowerCase();
    
    if (input.startsWith('0x095ea7b3')) return 'approve';
    if (input.startsWith('0x23b872dd')) return 'transferFrom';
    if (input.startsWith('0x38ed1739')) return 'swap';
    if (input.startsWith('0x7ff36ab5')) return 'swapExactETHForTokens';
    if (input.startsWith('0xfb3bdb41')) return 'swapETHForExactTokens';
    if (input.startsWith('0x4a25d94a')) return 'swapTokensForExactTokens';
    if (input.startsWith('0x8803dbee')) return 'swapExactTokensForTokens';
    if (input.startsWith('0x5c11d795')) return 'swapExactTokensForETH';
    if (input.startsWith('0x18cbafe5')) return 'swapExactTokensForETH';
    
    return 'other';
  } catch (error) {
    console.error('Transaction tipi analiz hatası:', error);
    return 'unknown';
  }
};

// BigInt'leri string'e çeviren yardımcı fonksiyon
const serializeBigInt = (obj) => {
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt);
  }
  if (obj && typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeBigInt(value);
    }
    return result;
  }
  return obj;
};

// Blokları poll et (sadeleştirilmiş)
const pollBlocks = async () => {
  if (isPolling) {
    console.log('Polling zaten devam ediyor, yeni polling başlatılmıyor');
    return;
  }
  isPolling = true;
  const provider = createProvider();
  let retryCount = 0;
  try {
    const latestBlockNumber = await provider.getBlockNumber();
    console.log('Mevcut blok numarası:', latestBlockNumber);
    let fromBlock = Number(lastProcessedBlock.number) + 1;
    let toBlock = Number(latestBlockNumber);
    if (fromBlock > toBlock) {
      console.log('Yeni blok yok, beklemede...');
      isPolling = false;
      return;
    }
    for (let blockNumber = fromBlock; blockNumber <= toBlock; blockNumber++) {
      let block;
      try {
        block = await provider.getBlock({ blockNumber: toBigInt(blockNumber), includeTransactions: true });
      } catch (err) {
        console.error('Blok alınırken hata:', err);
        continue;
      }
      if (!block) {
        console.log('Blok bulunamadı:', blockNumber);
        continue;
      }
      if (block.hash === lastProcessedBlock.hash) {
        console.log('Blok zaten işlendi:', blockNumber);
        continue;
      }
      let transactions = [];
      if (block.transactions && typeof block.transactions[0] === 'object') {
        // Transaction detayları zaten var
        transactions = block.transactions.map(tx => ({
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: tx.value?.toString() || '0',
          input: tx.input,
          type: analyzeTransactionType(tx)
        }));
      } else {
        // Sadece hash varsa, eski yöntemi kullan
        const txHashes = block.transactions || [];
        for (const txHash of txHashes) {
          try {
            const tx = await provider.getTransaction({ hash: txHash });
            if (tx) {
              const txType = analyzeTransactionType(tx);
              transactions.push({
                hash: tx.hash,
                from: tx.from,
                to: tx.to,
                value: tx.value.toString(),
                input: tx.input,
                type: txType
              });
            }
          } catch (txError) {
            console.error('Transaction çekme hatası:', txError);
          }
        }
      }
      const blockData = {
        number: block.number.toString(),
        hash: block.hash,
        timestamp: block.timestamp.toString(),
        transactions: transactions,
        gasUsed: block.gasUsed?.toString() || null,
        gasLimit: block.gasLimit?.toString() || null,
        baseFeePerGas: block.baseFeePerGas?.toString() || null
      };
      let sentCount = 0;
      wsClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          try {
            const serializedData = serializeBigInt(blockData);
            client.send(JSON.stringify(serializedData));
            sentCount++;
          } catch (sendError) {
            console.error('Veri gönderme hatası:', sendError);
            wsClients.delete(client);
          }
        }
      });
      console.log(`Blok #${blockNumber} verisi ${sentCount} client'a gönderildi.`);
      lastProcessedBlock = {
        number: block.number,
        hash: block.hash
      };
    }
  } catch (error) {
    console.error('Blok polling hatası:', error);
  }
  isPolling = false;
};

// Uygulama başlatılırken en güncel blok numarasını al
const initializeLastProcessedBlock = async () => {
  try {
    const provider = createProvider();
    const latestBlockNumber = await provider.getBlockNumber();
    const latestBlock = await provider.getBlock({ blockNumber: latestBlockNumber });
    lastProcessedBlock = {
      number: Number(latestBlockNumber),
      hash: latestBlock?.hash || ''
    };
    console.log('Başlangıçta son blok:', lastProcessedBlock);
  } catch (err) {
    console.error('Başlangıç bloğu alınamadı:', err);
  }
};

// Polling'i başlat
initializeLastProcessedBlock().then(() => {
  setInterval(pollBlocks, POLL_INTERVAL);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    connectedClients: wsClients.size,
    lastProcessedBlock: serializeBigInt(lastProcessedBlock)
  });
});

server.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
}); 