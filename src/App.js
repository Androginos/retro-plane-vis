import React, { useState, useEffect, useMemo } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { createPublicClient, http, defineChain } from 'viem';
import RetroPlane from "./RetroPlane";

const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');
  body {
    font-family: 'VT323', monospace;
    background: #000;
    color: #00ff00;
    margin: 0;
    padding: 0;
    min-height: 100vh;
    width: 100vw;
    overflow-x: hidden;
  }
`;

const Layout = styled.div`
  display: flex;
  flex-direction: row;
  width: 100vw;
  height: 100vh;
`;

// Panel boyut ve konum ayarları
const PANEL_WIDTH = '400px';
const PANEL_MIN_WIDTH = '320px';
const PANEL_MAX_WIDTH = '320px';
const PANEL_HEIGHT = 'auto'; // İsterseniz örn. '700px' yapabilirsiniz
const PANEL_MARGIN = '20px 0 20px 20px';
const PANEL_PADDING = '20px 5px';

const SidePanel = styled.div`
  width: ${PANEL_WIDTH};
  min-width: ${PANEL_MIN_WIDTH};
  max-width: ${PANEL_MAX_WIDTH};
  height: ${PANEL_HEIGHT};
  background: rgba(0,0,0,0.95);
  border: 3px solid #00ff00;
  border-radius: 16px;
  margin: ${PANEL_MARGIN};
  padding: ${PANEL_PADDING};
  box-shadow: 0 0 24px #00ff00;
  display: flex;
  flex-direction: column;
  gap: 32px;
  align-items: center;
  justify-content: flex-start;
`;

const Title = styled.h1`
  color: #00ff00;
  text-align: center;
  font-size: 2.2rem;
  margin: 0 0 24px 0;
  text-shadow: 0 0 8px #00ff00;
  width: 100%;
`;

const Table = styled.div`
  width: 95%;
  min-width: 200px;
  max-width: 260px;
  height: 200px;
  padding: 20px 16px;
  margin-bottom: 0px;
  background: rgba(0,0,0,0.7);
  border: 2px solid #00ff00;
  border-radius: 10px;
  font-size: 1.2rem;
`;
const TableRow = styled.div`
  display: flex;
  justify-content: space-between;
  border-bottom: 1px dotted #00ff00;
  padding: 6px 0;
  &:last-child { border-bottom: none; }
`;
const TableLabel = styled.span`
  color: #00ff00;
`;
const TableValue = styled.span`
  color: #fff;
`;

const MainArea = styled.div`
  flex: 1;
  height: 100%;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
  position: relative;
  overflow: hidden;
`;

const rpcUrls = [
  process.env.REACT_APP_ALCHEMY_RPC_URL_1,
  process.env.REACT_APP_ALCHEMY_RPC_URL_2,
  process.env.REACT_APP_ALCHEMY_RPC_URL_3,
  process.env.REACT_APP_ALCHEMY_RPC_URL_4,
  process.env.REACT_APP_ALCHEMY_RPC_URL_5,
  process.env.REACT_APP_ALCHEMY_RPC_URL_6,
  process.env.REACT_APP_ALCHEMY_RPC_URL_7,
  process.env.REACT_APP_ALCHEMY_RPC_URL_8,
].filter(Boolean);

const monadAlchemy = defineChain({
  id: 9090,
  name: 'Monad Testnet (Alchemy)',
  network: 'monad-testnet',
  nativeCurrency: {
    name: 'tMND',
    symbol: 'tMND',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: rpcUrls,
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: 'https://explorer.monad.xyz',
    },
  },
});

const client = createPublicClient({
  chain: monadAlchemy,
  transport: http(rpcUrls),
});

const AppContainer = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #000;
`;

const Terminal = styled.div`
  background-color: #000;
  border: 2px solid #00ff00;
  border-radius: 5px;
  padding: 20px;
  margin: 20px;
  box-shadow: 0 0 10px #00ff00;
`;

const DataDisplay = styled.div`
  margin-top: 20px;
  padding: 10px;
  border: 1px solid #00ff00;
  border-radius: 3px;
  position: relative;
`;

const UpdateIndicator = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  color: #00ff00;
  font-size: 0.8em;
  opacity: ${props => props.$isLoading ? 1 : 0};
  transition: opacity 0.3s ease;
`;

const TransactionStats = styled.div`
  margin-top: 20px;
  padding: 20px;
  border: 2px solid #00ff00;
  border-radius: 5px;
  background-color: rgba(0, 255, 0, 0.05);
`;

const StatTitle = styled.h3`
  color: #00ff00;
  text-align: center;
  margin-bottom: 20px;
  text-shadow: 0 0 5px #00ff00;
`;

const StatItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 10px 0;
  padding: 10px;
  border-bottom: 1px dashed #00ff00;
  font-size: 1.2em;
  
  &:hover {
    background-color: rgba(0, 255, 0, 0.1);
  }
`;

const StatLabel = styled.span`
  color: #00ff00;
`;

const StatValue = styled.span`
  color: #00ff00;
  font-weight: bold;
`;

const LoadingBox = styled.div`
  background: #1a1a1a;
  border: 2px solid #00ff00;
  border-radius: 5px;
  padding: 20px;
  margin: 20px 0;
  color: #00ff00;
  text-align: center;
`;

const ErrorBox = styled.div`
  background: #1a1a1a;
  border: 2px solid #ff0000;
  border-radius: 5px;
  padding: 20px;
  margin: 20px 0;
  color: #ff0000;
  text-align: center;
`;

const RetroButton = styled.button`
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 1000;
  background: #000;
  color: #00ff00;
  border: 2px solid #00ff00;
  border-radius: 8px;
  padding: 12px 24px;
  font-family: 'VT323', monospace;
  font-size: 22px;
  cursor: pointer;
  box-shadow: 0 2px 8px #00ff0080;
  text-shadow: 0 0 5px #00ff00;
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
  &:hover {
    background: #111;
    color: #fff;
    box-shadow: 0 0 16px #00ff00;
  }
`;

const BlockRadarLog = ({ rescuedBlocks }) => {
  return (
    <div style={{
      position: 'fixed',
      right: 20,
      top: 18,
      width: 340,
      height: 770,
      background: 'rgba(0,0,0,0.95)',
      border: '3px solid #00ff00',
      borderRadius: 16,
      color: '#00ff00',
      fontFamily: 'VT323, monospace',
      fontSize: 18,
      boxShadow: '0 0 24px #00ff00',
      zIndex: 20000,
      overflowY: 'auto',
      padding: 18
    }}>
      <div style={{fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 12, textShadow: '0 0 8px #00ff00'}}>BLOCK RADAR LOG</div>
      <div style={{fontSize: 18, fontWeight: 'bold', marginBottom: 10}}>RESCUED BLOCKS LOG</div>
      {rescuedBlocks.length === 0 && <div style={{color:'#888'}}>Henüz blok yok.</div>}
      {rescuedBlocks.slice(-30).reverse().map((block, i) => (
        <div key={block.number} style={{marginBottom: 16, borderBottom: '1px solid #00ff00', paddingBottom: 8}}>
          <div style={{fontWeight:'bold', color:'#00ff00', fontSize:20}}>
            Block #{block.number} <span style={{color:'#0f0', fontWeight:'normal', fontSize:16}}>RESCUED</span>
          </div>
          <div>Tx: <b>{block.transactions?.length ?? 0}</b></div>
          <div>Time: {block.timestamp ? new Date(Number(block.timestamp)*1000).toLocaleTimeString() : '-'}</div>
          <div>Type: <b>{block.transactions && block.transactions[0]?.type ? block.transactions[0].type : 'Other'}</b></div>
          <div>
            <a href={`https://testnet.monadexplorer.com/block/${block.number}`} target="_blank" rel="noopener noreferrer" style={{color:'#00ff00', textDecoration:'underline'}}>Explorer</a>
          </div>
        </div>
      ))}
    </div>
  );
};

const getRandomPlaneType = () => {
  const types = ['fighter', 'bomber', 'cargo'];
  return types[Math.floor(Math.random() * types.length)];
};

const DEBUG = process.env.NODE_ENV !== 'production';

// Blok tipini belirleyen fonksiyon
const getBlockType = (block) => {
  if (!block) return 'VALIDATED';
  if (Array.isArray(block.transactions) && block.transactions.length === 0 && (block.gasUsed === '0' || block.gasUsed === 0)) {
    return 'GHOST';
  }
  if (Array.isArray(block.transactions) && block.transactions.some(tx => tx.status === 'reverted' || tx.reverted === true)) {
    return 'OVERLOADED';
  }
  return 'VALIDATED';
};

function App() {
  const [blockData, setBlockData] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [lastBlockNumber, setLastBlockNumber] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [txStats, setTxStats] = useState({
    'Transfer': 0,
    'NFT Mint': 0,
    'DEX Swap': 0,
    'Contract Creation': 0,
    'Other': 0
  });
  const [showRetro, setShowRetro] = useState(false);
  const [blocks, setBlocks] = useState([]);
  const [events, setEvents] = useState([]);
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [logBlocks, setLogBlocks] = useState([]);

  // Transaction tipini analiz et (viem ile)
  const analyzeTransactionType = (tx) => {
    if (!tx) return 'Other';
    
    console.log('Analyzing transaction:', tx);
    
    // Contract creation kontrolü
    if (!tx.to) {
      if (tx.input && tx.input.startsWith('0x60806040')) return 'NFT Mint';
      return 'Contract Creation';
    }
    
    // Transfer kontrolü
    if (tx.value > 0n && tx.input === '0x') return 'Transfer';
    
    // DEX Swap kontrolü
    if (tx.input && (
      tx.input.startsWith('0x38ed1739') || // Uniswap V2
      tx.input.startsWith('0x18cbafe5') || // PancakeSwap
      tx.input.startsWith('0x8803dbee') || // SushiSwap
      tx.input.startsWith('0x5c11d795')    // 1inch
    )) return 'DEX Swap';
    
    // Revert kontrolü
    if (tx.status === 'reverted' || tx.type === 'Other') return 'Other';
    
    return 'Other';
  };

  // Blok verilerini güncelle
  const handleNewBlock = (data) => {
    try {
      const parsed = JSON.parse(data);
      // Her zaman gerçek blok objesini kullan
      const blockObjRaw = parsed.data?.block || parsed.block || parsed.data || parsed;
      const statsData = parsed.data?.stats || parsed.stats || null;
      // Block tipini belirle
      const blockType = getBlockType(blockObjRaw);
      const blockObj = { ...blockObjRaw, type: blockType };

      setBlockData(blockObj);

      setBlocks(prevBlocks => {
        if (prevBlocks.some(b => b.number === blockObj.number)) return prevBlocks;
        const newBlocks = [...prevBlocks, blockObj];
        return newBlocks.slice(-100); // Son 100 blokla sınırla
      });

      setLastBlockNumber(blockObj.number);
      setLastUpdate(new Date());
      setIsLoading(false);

      if (statsData) {
        setTxStats(statsData);
      } else if (blockObj.transactions) {
        const newStats = { ...txStats };
        blockObj.transactions.forEach(tx => {
          const txType = analyzeTransactionType(tx);
          newStats[txType] = (newStats[txType] || 0) + 1;
        });
        setTxStats(newStats);
      }

      const newEvent = {
        id: Date.now(),
        type: 'block',
        message: `New block: #${blockObj.number}`,
        timestamp: new Date()
      };
      setEvents(prevEvents => [...prevEvents, newEvent]);

      if (DEBUG) {
        console.log('New block received:', blockObj);
        console.log('blockData (raw):', blockObj);
        console.log('blockData.number:', blockObj.number);
        console.log('blockData.timestamp:', blockObj.timestamp);
        console.log('blockData.gasUsed:', blockObj.gasUsed);
        console.log('blockData.gasLimit:', blockObj.gasLimit);
      }
    } catch (error) {
      if (DEBUG) console.error('Block processing error:', error);
      setError('Error processing block data');
    }
  };

  // WebSocket bağlantısı
  useEffect(() => {
    const connectWebSocket = () => {
      const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:3001';
      console.log('WebSocket URL:', wsUrl);
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connection established');
        setIsConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        console.log('=== WebSocket Raw Data ===');
        console.log('Raw data:', event.data);
        try {
          const parsed = JSON.parse(event.data);
          const blockData = parsed.data?.block || parsed.block || parsed.data || parsed;
          
          console.log('=== Parsed Block Data ===');
          console.log('Block number:', blockData.number);
          console.log('Block timestamp:', blockData.timestamp);
          console.log('Gas used:', blockData.gasUsed);
          console.log('Gas limit:', blockData.gasLimit);
          console.log('Transactions:', blockData.transactions);
          console.log('Transaction count:', blockData.transactions?.length);
          console.log('Transaction types:', blockData.transactions?.map(tx => analyzeTransactionType(tx)));
          
          handleNewBlock(event.data);
        } catch (error) {
          console.error('Error parsing WebSocket data:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('WebSocket connection error');
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed');
        setIsConnected(false);
        setTimeout(connectWebSocket, 1000);
      };

      setWs(ws);
    };

    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  // Performans için memoization
  const memoizedBlockData = useMemo(() => ({
    number: blockData?.number,
    hash: blockData?.hash,
    parentHash: blockData?.parentHash,
    timestamp: blockData?.timestamp,
    transactionCount: blockData?.transactions?.length || 0,
    gasUsed: blockData?.gasUsed,
    gasLimit: blockData?.gasLimit,
    baseFeePerGas: blockData?.baseFeePerGas,
    miner: blockData?.miner
  }), [blockData]);

  // blockData'yı güvenli şekilde normalize et
  const safeBlockData = blockData ? {
    number: blockData.number ?? '-',
    timestamp: blockData.timestamp ? new Date(Number(blockData.timestamp) * 1000).toLocaleString() : '-',
    transactionCount: Array.isArray(blockData.transactions) ? blockData.transactions.length : 0,
    gasUsed: blockData.gasUsed ? blockData.gasUsed.toString() : '-',
    gasLimit: blockData.gasLimit ? blockData.gasLimit.toString() : '-',
    baseFeePerGas: blockData.baseFeePerGas ? blockData.baseFeePerGas.toString() : '-'
  } : {};

  // Uçak ekrandan çıkınca sadece blocks dizisinden çıkar
  const handlePlaneExit = (block) => {
    setBlocks(prevBlocks => prevBlocks.filter(b => b.number !== block.number));
    setLogBlocks(prev => {
      if (prev.some(b => b.number === block.number)) return prev;
      return [...prev, block];
    });
  };

  // blocks dizisinin güncellenmesini ve sıfırlanmadığını kontrol et
  useEffect(() => {
    console.log('App.js blocks.length:', blocks.length);
  }, [blocks]);

  return (
    <>
      <GlobalStyle />
      <Layout>
        <SidePanel>
          <Title>MONAD RETRO BLOCK EXPLORER</Title>
          <Table>
            <TableRow><TableLabel>Block Number:</TableLabel><TableValue>{safeBlockData.number}</TableValue></TableRow>
            <TableRow><TableLabel>Timestamp:</TableLabel><TableValue>{safeBlockData.timestamp}</TableValue></TableRow>
            <TableRow><TableLabel>Transaction Count:</TableLabel><TableValue>{safeBlockData.transactionCount}</TableValue></TableRow>
            <TableRow><TableLabel>Gas Used:</TableLabel><TableValue>{safeBlockData.gasUsed}</TableValue></TableRow>
            <TableRow><TableLabel>Gas Limit:</TableLabel><TableValue>{safeBlockData.gasLimit}</TableValue></TableRow>
            <TableRow><TableLabel>Base Fee:</TableLabel><TableValue>{safeBlockData.baseFeePerGas}</TableValue></TableRow>
          </Table>
          <Table>
            <TableRow><TableLabel>Transfer:</TableLabel><TableValue>{txStats['Transfer']}</TableValue></TableRow>
            <TableRow><TableLabel>NFT Mint:</TableLabel><TableValue>{txStats['NFT Mint']}</TableValue></TableRow>
            <TableRow><TableLabel>DEX Swap:</TableLabel><TableValue>{txStats['DEX Swap']}</TableValue></TableRow>
            <TableRow><TableLabel>Contract Creation:</TableLabel><TableValue>{txStats['Contract Creation']}</TableValue></TableRow>
            <TableRow><TableLabel>Other:</TableLabel><TableValue>{txStats['Other']}</TableValue></TableRow>
          </Table>
        </SidePanel>
        <MainArea>
        <RetroPlane 
          blocks={blocks} 
          onReturn={() => setShowRetro(false)} 
          txStats={txStats} 
          events={events} 
          onPlaneExit={handlePlaneExit}
        />
        <BlockRadarLog rescuedBlocks={logBlocks} />
        </MainArea>
      </Layout>
    </>
  );
}

export default App; 