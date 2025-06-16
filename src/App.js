import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { createPublicClient, http, defineChain } from 'viem';
import RetroPlane from "./RetroPlane";

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
  background-color: #000;
  color: #00ff00;
  font-family: 'VT323', monospace;
  min-height: 100vh;
  padding: 20px;
`;

const Terminal = styled.div`
  background-color: #000;
  border: 2px solid #00ff00;
  border-radius: 5px;
  padding: 20px;
  margin: 20px;
  box-shadow: 0 0 10px #00ff00;
`;

const Title = styled.h1`
  color: #00ff00;
  text-align: center;
  text-shadow: 0 0 5px #00ff00;
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

const getRandomPlaneType = () => {
  const types = ['fighter', 'bomber', 'cargo'];
  return types[Math.floor(Math.random() * types.length)];
};

const DEBUG = process.env.NODE_ENV !== 'production';

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

  // Transaction tipini analiz et (viem ile)
  const analyzeTransactionType = (tx) => {
    if (!tx) return 'Other';
    if (!tx.to) {
      if (tx.input && tx.input.startsWith('0x60806040')) return 'NFT Mint';
      return 'Contract Creation';
    }
    if (tx.value > 0n && tx.input === '0x') return 'Transfer';
    if (tx.input && (
      tx.input.startsWith('0x38ed1739') ||
      tx.input.startsWith('0x18cbafe5') ||
      tx.input.startsWith('0x8803dbee') ||
      tx.input.startsWith('0x5c11d795')
    )) return 'DEX Swap';
    return 'Other';
  };

  // Blok verilerini güncelle
  const handleNewBlock = (data) => {
    try {
      const parsed = JSON.parse(data);
      // Her zaman gerçek blok objesini kullan
      const blockObj = parsed.data?.block || parsed.block || parsed.data || parsed;
      const statsData = parsed.data?.stats || parsed.stats || null;

      setBlockData(blockObj);

      setBlocks(prevBlocks => {
        if (prevBlocks.some(b => b.number === blockObj.number)) return prevBlocks;
        const newBlocks = [...prevBlocks, blockObj];
        return newBlocks.length > 100 ? newBlocks.slice(-100) : newBlocks;
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
        handleNewBlock(event.data);
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

  return (
    <AppContainer>
      <RetroButton onClick={() => setShowRetro(!showRetro)}>
        {showRetro ? 'SHOW TERMINAL' : 'LAUNCH RETRO MODE'}
      </RetroButton>

      {showRetro ? (
        <RetroPlane 
          blocks={blocks} 
          onReturn={() => setShowRetro(false)} 
          txStats={txStats} 
          events={events} 
        />
      ) : (
        <>
          <Title>MONAD BLOCK EXPLORER</Title>
          
          {error && <ErrorBox>{error}</ErrorBox>}
          
          {isLoading || !blockData ? (
            <LoadingBox>INITIALIZING BLOCK DATA...</LoadingBox>
          ) : (
            <>
              <Terminal>
                <DataDisplay>
                  <UpdateIndicator $isLoading={isLoading}>
                    Last Update: {lastUpdate.toLocaleTimeString()}
                  </UpdateIndicator>
                  <StatItem>
                    <StatLabel>Block Number:</StatLabel>
                    <StatValue>{safeBlockData.number}</StatValue>
                  </StatItem>
                  <StatItem>
                    <StatLabel>Timestamp:</StatLabel>
                    <StatValue>{safeBlockData.timestamp}</StatValue>
                  </StatItem>
                  <StatItem>
                    <StatLabel>Transaction Count:</StatLabel>
                    <StatValue>{safeBlockData.transactionCount}</StatValue>
                  </StatItem>
                  <StatItem>
                    <StatLabel>Gas Used:</StatLabel>
                    <StatValue>{safeBlockData.gasUsed}</StatValue>
                  </StatItem>
                  <StatItem>
                    <StatLabel>Gas Limit:</StatLabel>
                    <StatValue>{safeBlockData.gasLimit}</StatValue>
                  </StatItem>
                  <StatItem>
                    <StatLabel>Base Fee:</StatLabel>
                    <StatValue>{safeBlockData.baseFeePerGas}</StatValue>
                  </StatItem>
                </DataDisplay>

                <TransactionStats>
                  <StatTitle>TRANSACTION ANALYSIS</StatTitle>
                  {Object.entries(txStats || {}).map(([type, count]) => (
                    <StatItem key={type}>
                      <StatLabel>{type}:</StatLabel>
                      <StatValue>{typeof count === 'number' ? count : 0}</StatValue>
                    </StatItem>
                  ))}
                </TransactionStats>
              </Terminal>
            </>
          )}
        </>
      )}
    </AppContainer>
  );
}

export default App; 