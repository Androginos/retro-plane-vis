import React, { useState, useEffect, useMemo, useRef } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { createPublicClient, http, defineChain } from 'viem';
import RetroPlane from "./RetroPlane";
import SelectedPlanePanel from './SelectedPlanePanel';

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
const PANEL_WIDTH = '290px';
const PANEL_MIN_WIDTH = '290px';
const PANEL_MAX_WIDTH = '290px';
const PANEL_HEIGHT = '885px'; // Explorer panel ile aynı yükseklik
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
  margin-left: 60px;
  padding: 10px 5px 5px 5px;
  box-shadow: 0 0 24px #00ff00;
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  justify-content: flex-start;
  z-index: 30002;
`;

const Title = styled.h1`
  color: #00ff00;
  text-align: center;
  font-size: 2.2rem;
  margin: 0 0 8px 0;
  text-shadow: 0 0 5px #00ff00;
  width: 100%;
`;

const Table = styled.div`
  width: 95%;
  min-width: 160px;
  max-width: 260px;
  height: 150px;
  padding: 10px 10px;
  margin-top: -12px;
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

const CreditsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 10px;
  font-size: 1.1em;
  color: #00ff00;
`;

const CreditLink = styled.a`
  color: #00ff00;
  text-decoration: none;
  cursor: pointer;
  
  &:hover {
    text-shadow: 0 0 5px #00ff00;
  }
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

const BlockRadarLog = ({ rescuedBlocks, onMinimize }) => {
  return (
    <div style={{
      position: 'fixed',
      right: 20,
      top: 18,
      width: 290,
      minWidth: 290,
      maxWidth: 290,
      height: '865px',
      background: 'rgba(0,0,0,0.95)',
      border: '3px solid #00ff00',
      borderRadius: 16,
      color: '#00ff00',
      fontFamily: 'VT323, monospace',
      fontSize: 18,
      boxShadow: '0 0 24px #00ff00',
      zIndex: 30001,
      overflowY: 'auto',
      padding: 18
    }}>
      {/* Minimize butonu */}
      {onMinimize && (
        <button
          onClick={onMinimize}
          style={{
            position: 'absolute', top: 8, right: 12, zIndex: 10,
            background: 'none', border: 'none', color: '#00ff00', fontSize: 22, cursor: 'pointer',
            padding: 0, margin: 0
          }}
          title="Simge durumuna küçült"
        >–</button>
      )}
      <style>{`
        div::-webkit-scrollbar {
          width: 10px;
          background: #111;
          border-radius: 8px;
        }
        div::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #00ff00 60%, #003300 100%);
          border-radius: 8px;
          box-shadow: 0 0 8px #00ff00;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: #00ff00;
        }
        div::-webkit-scrollbar-corner {
          background: #111;
        }
        /* Firefox */
        div {
          scrollbar-width: thin;
          scrollbar-color: #00ff00 #111;
        }
      `}</style>
      <CreditsContainer>
        <CreditLink href="https://x.com/GurhanKutsal" target="_blank" rel="noopener noreferrer">
          Built by Kutsal (X)
        </CreditLink>
        <div>Built for Monad Community</div>
      </CreditsContainer>
      <div style={{fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 8, textShadow: '0 0 8px #00ff00', marginTop: '10px'}}>DAMAGED WINGS RADAR LOG</div>
      <div style={{fontSize: 18, fontWeight: 'bold', marginBottom: 8}}>SUCCEEDED BLOCKS LOG</div>
      {rescuedBlocks.length === 0 && <div style={{color:'#888'}}>Henüz blok yok.</div>}
      {rescuedBlocks
        .slice()
        .sort((a, b) => (Number(b.number) - Number(a.number)))
        .slice(0, 30)
        .map((block, i) => (
          <div key={block.number} style={{marginBottom: 16, borderBottom: '1px solid #00ff00', paddingBottom: 8}}>
            <div style={{fontWeight:'bold', color:'#00ff00', fontSize:20}}>
              Block #{block.number} <span style={{
                color:'#2196f3',
                fontWeight:'bold',
                fontSize:18,
                marginLeft:8,
                textShadow:'0 0 8px #2196f3, 0 0 16px #2196f3'
              }}>{(block.type || 'RESCUED').toUpperCase()}</span>
            </div>
            <div>Tx: <b>{block.transactions?.length ?? 0}</b></div>
            <div>Time: {block.timestamp ? new Date(Number(block.timestamp)*1000).toLocaleTimeString() : '-'}</div>
            <div>
              <a href={`https://testnet.monadexplorer.com/block/${block.number}`} target="_blank" rel="noopener noreferrer" style={{color:'#ffeb3b', textDecoration:'underline', fontWeight:'bold', fontSize:18, textShadow:'0 0 8px #ffeb3b'}}>
                Explorer
              </a>
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
  const [selectedPlane, setSelectedPlane] = useState(null);
  const [showPanels, setShowPanels] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 700);
  const [speed, setSpeed] = useState(1);
  const audioRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.01);
  const hasStartedMusic = useRef(false);
  const [isBlockPanelMinimized, setBlockPanelMinimized] = useState(false);
  const [isLogPanelMinimized, setLogPanelMinimized] = useState(false);
  const isMobileOrTablet = typeof window !== 'undefined' && window.innerWidth < 900;

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

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 700) {
        setShowPanels(false);
        setIsMobile(true);
      } else {
        setShowPanels(true);
        setIsMobile(false);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Kullanıcı tıklayınca veya mute/unmute'a basınca müzik başlat
  useEffect(() => {
    const startMusic = () => {
      if (!hasStartedMusic.current && audioRef.current) {
        audioRef.current.play().catch(() => {});
        hasStartedMusic.current = true;
        window.removeEventListener('click', startMusic);
      }
    };
    window.addEventListener('click', startMusic);
    return () => window.removeEventListener('click', startMusic);
  }, []);

  // useEffect ile ekran boyutuna göre otomatik minimize
  useEffect(() => {
    function handleResize() {
      const isSmall = window.innerWidth < 1400 || window.innerHeight < 900;
      setBlockPanelMinimized(isSmall);
      setLogPanelMinimized(isSmall);
    }
    window.addEventListener('resize', handleResize);
    // İlk yüklemede de kontrol et
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <GlobalStyle />
      <Layout>
        <MainArea>
          {/* Ses dosyası - her zaman DOM'da olmalı */}
          <audio
            ref={audioRef}
            src={process.env.PUBLIC_URL + '/assets/retro_bg_music.mp3'}
            loop
            autoPlay
            style={{ display: 'none' }}
          />
          <RetroPlane 
            blocks={blocks} 
            onReturn={() => setShowRetro(false)} 
            txStats={txStats} 
            events={events} 
            onPlaneExit={handlePlaneExit}
            onPlaneSelect={setSelectedPlane}
            speed={speed}
          />
          {showPanels && !isMobile && !isBlockPanelMinimized && (
            <SidePanel style={{position:'relative'}}>
              {/* Minimize butonu */}
              <button
                onClick={() => setBlockPanelMinimized(true)}
                style={{
                  position: 'absolute', top: 8, right: 12, zIndex: 10,
                  background: 'none', border: 'none', color: '#00ff00', fontSize: 22, cursor: 'pointer',
                  padding: 0, margin: 0
                }}
                title="Simge durumuna küçült"
              >–</button>
              <Title>MONAD RETRO BLOCK EXPLORER</Title>
              <Table style={{marginBottom: '8px', marginTop: '0', padding: '10px 8px', height: 'auto'}}>
                <TableRow><TableLabel>Block Number:</TableLabel><TableValue>{safeBlockData.number}</TableValue></TableRow>
                <TableRow><TableLabel>Timestamp:</TableLabel><TableValue>{safeBlockData.timestamp}</TableValue></TableRow>
                <TableRow><TableLabel>Transaction Count:</TableLabel><TableValue>{safeBlockData.transactionCount}</TableValue></TableRow>
                <TableRow><TableLabel>Gas Used:</TableLabel><TableValue>{safeBlockData.gasUsed}</TableValue></TableRow>
                <TableRow><TableLabel>Gas Limit:</TableLabel><TableValue>{safeBlockData.gasLimit}</TableValue></TableRow>
                <TableRow><TableLabel>Base Fee:</TableLabel><TableValue>{safeBlockData.baseFeePerGas}</TableValue></TableRow>
                <TableRow><TableLabel>Transfer:</TableLabel><TableValue>{txStats['Transfer']}</TableValue></TableRow>
                <TableRow><TableLabel>NFT Mint:</TableLabel><TableValue>{txStats['NFT Mint']}</TableValue></TableRow>
                <TableRow><TableLabel>DEX Swap:</TableLabel><TableValue>{txStats['DEX Swap']}</TableValue></TableRow>
                <TableRow><TableLabel>Contract Creation:</TableLabel><TableValue>{txStats['Contract Creation']}</TableValue></TableRow>
                <TableRow><TableLabel>Other:</TableLabel><TableValue>{txStats['Other']}</TableValue></TableRow>
              </Table>
              <div style={{width:'100%', margin:'-16px 0 0 0', display:'flex', flexDirection:'column', alignItems:'center'}}>
                <label 
                  htmlFor="speedRange" 
                  style={{
                    textShadow: '0 0 5px #00ff00',
                    whiteSpace: 'nowrap',
                    fontFamily: 'VT323, monospace',
                    color: '#00ff00',
                    fontSize: 18,
                    marginBottom: 2
                  }}
                >
                  Speed: {speed.toFixed(2)}x
                </label>
                <input
                  id="speedRange"
                  type="range"
                  min="0.2"
                  max="2"
                  step="0.1"
                  value={speed}
                  onChange={e => setSpeed(parseFloat(e.target.value))}
                  style={{
                    WebkitAppearance: 'none',
                    width: '90%',
                    height: '4px',
                    background: 'rgba(0, 255, 0, 0.3)',
                    outline: 'none',
                    margin: '0',
                    padding: '0',
                  }}
                />
                <style>
                  {`
                    #speedRange::-webkit-slider-thumb {
                      -webkit-appearance: none;
                      appearance: none;
                      width: 12px;
                      height: 12px;
                      background: #00ff00;
                      border-radius: 50%;
                      cursor: pointer;
                      box-shadow: 0 0 5px #00ff00;
                      margin-top: -5px;
                    }
                    #speedRange::-moz-range-thumb {
                      width: 12px;
                      height: 12px;
                      background: #00ff00;
                      border-radius: 50%;
                      cursor: pointer;
                      box-shadow: 0 0 5px #00ff00;
                      border: none;
                    }
                    #speedRange::-webkit-slider-runnable-track {
                      background: linear-gradient(to right, #00ff00 50%, rgba(0, 255, 0, 0.3) 50%);
                      height: 3px;
                      border: none;
                    }
                    #speedRange::-moz-range-track {
                      background: linear-gradient(to right, #00ff00 50%, rgba(0, 255, 0, 0.3) 50%);
                      height: 2px;
                      border: none;
                    }
                  `}
                </style>
              </div>
              <div style={{width:'100%', margin:'6px 0 0 0', display:'flex', flexDirection:'column', alignItems:'center'}}>
                <SelectedPlanePanel selectedPlane={selectedPlane} style={{marginTop: 0, alignSelf: 'center'}} />
              </div>
              {/* Ses kontrolü: mute/unmute ve slider yatay */}
              <div style={{width:'100%', margin:'0 0 0 0', display:'flex', flexDirection:'row', alignItems:'flex-end', justifyContent:'center', gap: 14}}>
                <span style={{
                  fontFamily: 'VT323, monospace',
                  color: '#00ff00',
                  fontSize: 18,
                  marginRight: 6,
                  marginBottom: 20,
                  letterSpacing: 1.5,
                  textShadow: '0 0 4px #00ff00',
                  animation: 'music-blink 1.2s infinite alternate',
                }}>MUSIC</span>
                <button
                  onClick={() => {
                    const newMuteState = !isMuted;
                    setIsMuted(newMuteState);
                    // Ses kontrolü
                    if (audioRef.current) {
                      console.log('AudioRef mevcut, volume ayarlanıyor...');
                      if (newMuteState) {
                        console.log('Mute yapılıyor, volume = 0');
                        audioRef.current.volume = 0;
                      } else {
                        console.log('Unmute yapılıyor, volume =', volume);
                        audioRef.current.volume = volume;
                        // Müzik duraklamışsa başlat
                        if (audioRef.current.paused) {
                          console.log('Müzik durmuş, tekrar başlatılıyor...');
                          audioRef.current.play().catch(() => {});
                        }
                        // Müzik hiç başlamamışsa da başlat
                        if (!hasStartedMusic.current) {
                          console.log('Müzik hiç başlamamış, ilk kez başlatılıyor...');
                          audioRef.current.play().catch(() => {});
                          hasStartedMusic.current = true;
                        }
                      }
                    } else {
                      console.log('AudioRef null!');
                    }
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderRadius: '50%',
                    outline: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    width: 36,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: 0,
                    position: 'relative',
                    top: -12,
                    boxShadow: isMuted
                      ? '0 0 0px #00ff00, 0 0 10px #00ff00 inset'
                      : '0 0 16px #00ff00, 0 0 32px #00ff00 inset',
                    transition: 'box-shadow 0.2s',
                  }}
                  title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
                >
                  <img
                    src={process.env.PUBLIC_URL + (isMuted ? '/assets/mute.png' : '/assets/unmute.png')}
                    alt={isMuted ? 'Mute' : 'Unmute'}
                    style={{
                      width: 32,
                      height: 32,
                      filter: 'drop-shadow(0 0 6px #00ff00)',
                      transition: 'filter 0.2s',
                      pointerEvents: 'none',
                      userSelect: 'none',
                      display: 'block',
                      objectFit: 'contain',
                    }}
                  />
                </button>
                <input
                  id="volumeRange"
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={isMuted ? 0 : volume}
                  onChange={e => {
                    const newVolume = Number(e.target.value);
                    setVolume(newVolume);
                    if (newVolume === 0) setIsMuted(true);
                    else setIsMuted(false);
                    if (audioRef.current) {
                      audioRef.current.volume = newVolume;
                      if (!hasStartedMusic.current) {
                        audioRef.current.play().catch(() => {});
                        hasStartedMusic.current = true;
                      }
                    }
                  }}
                  style={{
                    WebkitAppearance: 'none',
                    appearance: 'none',
                    width: 120,
                    height: 12,
                    background: 'rgba(0, 255, 0, 0.3)',
                    outline: 'none',
                    margin: '0 0 0 8px',
                    marginTop: -8,
                    marginBottom: 24,
                    padding: 0,
                    border: 'none',
                    borderRadius: 0,
                    boxShadow: 'none',
                    display: 'block',
                  }}
                />
              </div>
              {/* Style hack: slider thumb ve track için global stil */}
              <style>{`
                #volumeRange::-webkit-slider-thumb {
                  -webkit-appearance: none;
                  appearance: none;
                  width: 12px;
                  height: 12px;
                  background: #00ff00;
                  border-radius: 50%;
                  cursor: pointer;
                  box-shadow: 0 0 5px #00ff00;
                  margin-top: -5px;
                }
                #volumeRange::-moz-range-thumb {
                  width: 12px;
                  height: 12px;
                  background: #00ff00;
                  border-radius: 50%;
                  cursor: pointer;
                  box-shadow: 0 0 5px #00ff00;
                  border: none;
                }
                #volumeRange::-webkit-slider-runnable-track {
                  background: linear-gradient(to right, #00ff00 ${volume * 100}%, rgba(0, 255, 0, 0.3) ${volume * 100}%);
                  height: 3px;
                  border: none;
                }
                #volumeRange::-moz-range-track {
                  background: linear-gradient(to right, #00ff00 ${volume * 100}%, rgba(0, 255, 0, 0.3) ${volume * 100}%);
                  height: 3px;
                  border: none;
                }
              `}</style>
              <style>{`
                @keyframes music-blink {
                  0%, 100% { opacity: 1; text-shadow: 0 0 4px #00ff00, 0 0 12px #00ff00; }
                  50% { opacity: 0.6; text-shadow: 0 0 16px #00ff00, 0 0 32px #00ff00; }
                }
              `}</style>
            </SidePanel>
          )}
          {!isLogPanelMinimized && (
            <BlockRadarLog rescuedBlocks={logBlocks} onMinimize={() => setLogPanelMinimized(true)} />
          )}
          {isMobile && !isBlockPanelMinimized && (
            <div style={{
              width: '100vw',
              position: 'fixed',
              left: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.95)',
              zIndex: 1001,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              gap: 12,
              padding: '12px 0',
              maxHeight: '180vh',
              overflowY: 'auto',
            }}>
              <SidePanel style={{width: '96vw', margin: '0 auto'}} />
              {showPanels && <SelectedPlanePanel selectedPlane={selectedPlane} style={{width: '96vw', margin: '0 auto'}} />}
            </div>
          )}
          {isMobile && !isLogPanelMinimized && (
            <BlockRadarLog rescuedBlocks={logBlocks} onMinimize={() => setLogPanelMinimized(true)} style={{width: '96vw', margin: '0 auto'}} />
          )}
          {/* Minimize ikonları: canvas sol üst köşesinde, yeni PNG görselleri ile */}
          {(isBlockPanelMinimized || isLogPanelMinimized) && (
            <div style={{
              position: 'fixed', 
              left: 20, 
              top: 20, 
              display: 'flex', 
              flexDirection: 'row', 
              gap: 12, 
              zIndex: 50000,
              alignItems: 'center'
            }}>
              {/* Block Explorer minimize ikonu */}
              {isBlockPanelMinimized && (
                <button
                  onClick={() => setBlockPanelMinimized(false)}
                  style={{
                    width: 60, 
                    height: 60, 
                    background: 'radial-gradient(circle, #00ff00, #00cc00)', 
                    border: '2px solid #00ff00', 
                    borderRadius: 12,
                    boxShadow: '0 0 20px #00ff00, 0 0 40px #00ff00', 
                    cursor: 'pointer',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    padding: 8,
                    animation: 'glow 1.5s infinite alternate'
                  }}
                  title="Block Explorer Panelini Aç"
                >
                  <img 
                    src={process.env.PUBLIC_URL + '/assets/block.png'} 
                    alt="Block" 
                    style={{width: 44, height: 44, filter: 'drop-shadow(0 0 8px #000)'}}
                  />
                </button>
              )}
              
              {/* Log Panel minimize ikonu */}
              {isLogPanelMinimized && (
                <button
                  onClick={() => setLogPanelMinimized(false)}
                  style={{
                    width: 60, 
                    height: 60, 
                    background: 'radial-gradient(circle, #00ff00, #00cc00)', 
                    border: '2px solid #00ff00', 
                    borderRadius: 12,
                    boxShadow: '0 0 20px #00ff00, 0 0 40px #00ff00', 
                    cursor: 'pointer',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    padding: 8,
                    animation: 'glow 1.5s infinite alternate'
                  }}
                  title="Log Panelini Aç"
                >
                  <img 
                    src={process.env.PUBLIC_URL + '/assets/log.png'} 
                    alt="Log" 
                    style={{width: 44, height: 44, filter: 'drop-shadow(0 0 8px #000)'}}
                  />
                </button>
              )}
              {/* Mute/Unmute butonu - sadece paneller minimize olduğunda görünür */}
              {(isBlockPanelMinimized || isLogPanelMinimized) && (
                <button
                  onClick={() => {
                    const newMuteState = !isMuted;
                    setIsMuted(newMuteState);
                    // Ses kontrolü
                    if (audioRef.current) {
                      if (newMuteState) {
                        audioRef.current.volume = 0;
                      } else {
                        audioRef.current.volume = volume;
                        // Müzik duraklamışsa başlat
                        if (audioRef.current.paused) {
                          audioRef.current.play().catch(() => {});
                        }
                        // Müzik hiç başlamamışsa da başlat
                        if (!hasStartedMusic.current) {
                          audioRef.current.play().catch(() => {});
                          hasStartedMusic.current = true;
                        }
                      }
                    }
                  }}
                  style={{
                    width: 60, 
                    height: 60, 
                    background: 'radial-gradient(circle, #00ff00, #00cc00)', 
                    border: '2px solid #00ff00', 
                    borderRadius: 12,
                    boxShadow: '0 0 20px #00ff00, 0 0 40px #00ff00', 
                    cursor: 'pointer',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    padding: 8,
                    animation: 'glow 1.5s infinite alternate'
                  }}
                  title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
                >
                  <img
                    src={process.env.PUBLIC_URL + (isMuted ? '/assets/mute.png' : '/assets/unmute.png')}
                    alt={isMuted ? 'Mute' : 'Unmute'}
                    style={{width: 44, height: 44, filter: 'drop-shadow(0 0 8px #000)'}}
                  />
                </button>
              )}
            </div>
          )}
          
          {/* Glow animasyonu için stil */}
          <style>{`
            @keyframes glow {
              0% { 
                box-shadow: 0 0 20px #00ff00, 0 0 40px #00ff00; 
                background: radial-gradient(circle, #00ff00, #00cc00);
              }
              100% { 
                box-shadow: 0 0 30px #00ff00, 0 0 60px #00ff00, 0 0 80px #00ff00; 
                background: radial-gradient(circle, #33ff33, #00ff00);
              }
            }
            @keyframes blink {
              0% { opacity: 1; }
              100% { opacity: 0.5; }
            }
          `}</style>
        </MainArea>
      </Layout>
    </>
  );
}

export default App; 