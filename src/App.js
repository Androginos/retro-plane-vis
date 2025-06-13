import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ethers } from 'ethers';
import RetroPlane from "./RetroPlane";

// Önce fonksiyonu tanımla
const createIsolatedProvider = () => {
  const provider = new ethers.JsonRpcProvider('https://monad-testnet.g.alchemy.com/v2/TQTWv1mrWxh8m5RuVRRDj');
  return provider;
};
// Sonra provider'ı oluştur
const provider = createIsolatedProvider();

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
  opacity: ${props => props.isLoading ? 1 : 0};
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

  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;

    const fetchData = async () => {
      if (!isMounted) return;

      try {
        setIsLoading(true);
        console.log('[FETCH] Başlatıldı, isMounted:', isMounted);
        
        const network = await provider.getNetwork();
        console.log('[FETCH] Network bilgisi:', network);
        
        const blockNumber = await provider.getBlockNumber();
        console.log('[FETCH] Block number alındı:', blockNumber);
        
        if (!isMounted) return;
        
        if (lastBlockNumber !== null && blockNumber <= lastBlockNumber) {
          console.log('[FETCH] Yeni blok yok, son blok:', lastBlockNumber);
          setLastUpdate(new Date());
          setIsLoading(false);
          return;
        }
        
        setLastBlockNumber(blockNumber);
        
        const block = await provider.getBlock(blockNumber, true);
        
        if (!isMounted) return;
        
        console.log('[FETCH] Block detayları alındı:', {
          number: block?.number,
          hash: block?.hash,
          timestamp: block?.timestamp,
          transactions: block?.transactions?.length
        });
        
        if (block && block.number && block.hash && block.timestamp) {
          console.log('[FETCH] Blok verisi geçerli, state güncelleniyor');
          
          // Transaction analizi
          const stats = {
            'Transfer': 0,
            'NFT Mint': 0,
            'DEX Swap': 0,
            'Contract Creation': 0,
            'Other': 0
          };

          // Tüm transaction'ları analiz et
          for (const txHash of block.transactions) {
            const type = await analyzeTransactionType(txHash);
            stats[type]++;
          }

          setTxStats(stats);
          
          setBlockData({
            blockNumber: Number(block.number),
            timestamp: new Date(Number(block.timestamp) * 1000).toLocaleString(),
            transactions: block.transactions.length,
            gasUsed: block.gasUsed.toString(),
            gasLimit: block.gasLimit.toString(),
            hash: block.hash,
            baseFeePerGas: block.baseFeePerGas ? block.baseFeePerGas.toString() : '0',
            miner: block.miner,
            parentHash: block.parentHash
          });
          setError(null);
        } else {
          console.error('[FETCH] Blok verisi eksik:', {
            isMounted,
            hasBlock: !!block,
            blockNumber: block?.number,
            blockHash: block?.hash,
            blockTimestamp: block?.timestamp,
            transactionsLength: block?.transactions?.length
          });
          setError('[FETCH] Blok verisi eksik veya hatalı! Lütfen konsolu kontrol edin.');
        }
        
        setLastUpdate(new Date());
        setIsLoading(false);
      } catch (err) {
        if (!isMounted) return;
        
        console.error('[FETCH] Hata detayı:', {
          message: err.message,
          code: err.code,
          stack: err.stack,
          name: err.name
        });
        setError('Veri çekme hatası: ' + (err.message || err));
        setIsLoading(false);
      }

      // Bir sonraki fetch için timeout ayarla
      if (isMounted) {
        timeoutId = setTimeout(fetchData, 1000);
      }
    };

    // İlk fetch'i başlat
    fetchData();

    // Cleanup
    return () => {
      console.log('[FETCH] Component unmount ediliyor, cleanup başlatılıyor');
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []); // lastBlockNumber dependency'sini kaldırdık

  // Transaction tipini analiz et
  const analyzeTransactionType = async (txHash) => {
    try {
      const tx = await provider.getTransaction(txHash);
      if (!tx) return 'Other';

      // Transfer işlemi kontrolü
      if (!tx.data || tx.data === '0x') {
        return 'Transfer';
      }

      // Contract Creation kontrolü
      if (!tx.to) {
        // NFT Mint kontrolü (basit ERC721/1155 signature)
        if (tx.data && tx.data.startsWith('0x60806040')) {
          return 'NFT Mint';
        }
        return 'Contract Creation';
      }

      // DEX Swap kontrolü (Uniswap/PancakeSwap gibi router fonksiyon imzaları)
      if (tx.data && (
        tx.data.startsWith('0x38ed1739') || // swapExactTokensForTokens
        tx.data.startsWith('0x18cbafe5') || // swapExactETHForTokens
        tx.data.startsWith('0x8803dbee') || // swapTokensForExactTokens
        tx.data.startsWith('0x5c11d795')    // swapETHForExactTokens
      )) {
        return 'DEX Swap';
      }

      // NFT Mint kontrolü (OpenSea/standart mint fonksiyon imzaları)
      if (tx.data && (
        tx.data.startsWith('0x1249c58b') || // mint(address,uint256)
        tx.data.startsWith('0x40c10f19')    // mint(address,uint256)
      )) {
        return 'NFT Mint';
      }

      return 'Other';
    } catch (err) {
      console.warn('Error analyzing transaction:', err);
      return 'Other';
    }
  };

  if (showRetro) {
    return <RetroPlane onReturn={() => setShowRetro(false)} />;
  }

  if (error) {
    return (
      <div>
        <RetroButton onClick={() => setShowRetro(true)}>
          GO TO RETRO PLANE
        </RetroButton>
        <AppContainer>
          <Title>MONAD TESTNET BLOCK EXPLORER</Title>
          <Terminal>
            <ErrorBox>
              <h2>Hata</h2>
              <p>{error}</p>
              <p>Son güncelleme: {lastUpdate.toLocaleTimeString()}</p>
            </ErrorBox>
          </Terminal>
        </AppContainer>
      </div>
    );
  }

  if (!blockData) {
    return (
      <div>
        <RetroButton onClick={() => setShowRetro(true)}>
          GO TO RETRO PLANE
        </RetroButton>
        <AppContainer>
          <Title>MONAD TESTNET BLOCK EXPLORER</Title>
          <Terminal>
            <LoadingBox>
              <h2>Yükleniyor...</h2>
              <p>Blok verileri alınıyor...</p>
            </LoadingBox>
          </Terminal>
        </AppContainer>
      </div>
    );
  }

  return (
    <div>
      <RetroButton onClick={() => setShowRetro(true)}>
        GO TO RETRO PLANE
      </RetroButton>
      <AppContainer>
        <Title>MONAD TESTNET BLOCK EXPLORER</Title>
        <Terminal>
          <DataDisplay>
            <UpdateIndicator isLoading={isLoading}>Güncelleniyor...</UpdateIndicator>
            <p>Block Number: {blockData?.blockNumber}</p>
            <p>Block Hash: {blockData?.hash}</p>
            <p>Parent Hash: {blockData?.parentHash}</p>
            <p>Timestamp: {blockData?.timestamp}</p>
            <p>Transactions: {blockData?.transactions}</p>
            <p>Gas Used: {blockData?.gasUsed}</p>
            <p>Gas Limit: {blockData?.gasLimit}</p>
            <p>Base Fee: {blockData?.baseFeePerGas} wei</p>
            <p>Miner: {blockData?.miner}</p>
            <p>Son Güncelleme: {lastUpdate.toLocaleTimeString()}</p>
          </DataDisplay>

          <TransactionStats>
            <StatTitle>İŞLEM TİPLERİ ANALİZİ</StatTitle>
            {Object.entries(txStats).map(([type, count]) => (
              <StatItem key={type}>
                <StatLabel>{type}</StatLabel>
                <StatValue>{count}</StatValue>
              </StatItem>
            ))}
          </TransactionStats>
        </Terminal>
      </AppContainer>
    </div>
  );
}

export default App; 