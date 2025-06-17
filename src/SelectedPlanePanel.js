import React from 'react';

export default function SelectedPlanePanel({ selectedPlane, handleRescue, style }) {
  return (
    <div style={{
      position: 'relative',
      width: 245,
      minHeight: 270,
      background: '#181818',
      border: '2px solid #00ff00',
      borderRadius: 12,
      color: '#fff',
      fontFamily: 'VT323, monospace',
      fontSize: 18,
      padding: 16,
      boxShadow: '0 0 16px #00ff00',
      opacity: 0.98,
      marginLeft: 0,
      marginTop: 0,
      zIndex: 30001,
      ...style
    }}>
      <div style={{
        fontFamily: 'VT323, monospace',
        fontSize: 22,
        color: '#ffeb3b',
        textShadow: '0 0 8px #ffeb3b, 0 0 16px #ffeb3b',
        marginBottom: 12,
        letterSpacing: 1.5
      }}>
        Select your OVERLOADED plane and rescue it before it falls!
      </div>
      {!selectedPlane ? (
        <div style={{color:'#888'}}>Click a plane to see details.</div>
      ) : (
        <div style={{display:'flex', flexDirection:'row', alignItems:'flex-end', justifyContent:'space-between'}}>
          <div style={{flex:1}}>
            <div style={{fontSize:20, color:'#ff0', marginBottom:6}}>
              <b>
                <a
                  href={`https://testnet.monadexplorer.com/block/${selectedPlane.number || selectedPlane.blockNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#ffeb3b', textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Block #{selectedPlane.number || selectedPlane.blockNumber}
                </a>
              </b>
            </div>
            <div><b>Status:</b> <span style={{color:selectedPlane.type==='rescued'||selectedPlane.type==='refueled'?'#00ff80':selectedPlane.type==='overloaded'?'#ffcc00':selectedPlane.type==='outOfGas'?'#ff4444':'#fff', textShadow:selectedPlane.type==='outOfGas'?'0 0 12px #ff0000, 0 0 24px #ff0000':''}}>{selectedPlane.type?.toUpperCase()}</span></div>
            <div><b>Tx Count:</b> {selectedPlane.transactionCount ?? selectedPlane.transactions?.length ?? 0}</div>
            <div><b>Gas Used:</b> {selectedPlane.gasUsed}</div>
            <div><b>Gas Limit:</b> {selectedPlane.gasLimit}</div>
            <div><b>Revert Ratio:</b> {selectedPlane.revertRatio ? (selectedPlane.revertRatio*100).toFixed(1) : '0.0'}%</div>
            {selectedPlane && selectedPlane.transactions && (
              <div style={{marginTop:12}}>
                <b>Failed Transactions:</b><br/>
                {selectedPlane.transactions.filter(tx => (typeof tx.status === 'string' && (tx.status === '0x0' || tx.status === 0)) || (typeof tx.status === 'number' && tx.status === 0)).length > 0 ? (
                  selectedPlane.transactions.filter(tx => (typeof tx.status === 'string' && (tx.status === '0x0' || tx.status === 0)) || (typeof tx.status === 'number' && tx.status === 0)).map((tx, i) => (
                    <div key={tx.hash} style={{marginBottom:4}}>
                      <span style={{color:'#0ff'}}>Hash:</span>
                      <a href={`https://testnet.monadexplorer.com/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" style={{color:'#ff4444', textDecoration:'underline', fontFamily:'monospace'}}>
                        {tx.hash.slice(0,10)}...{tx.hash.slice(-6)}
                      </a>
                      <span style={{color:'#ff0', marginLeft:8}}>[{tx.type || 'Other'}]</span><br/>
                    </div>
                  ))
                ) : (
                  <div style={{marginTop:4, color:'#888'}}>No reverted transactions.</div>
                )}
              </div>
            )}
          </div>
          <button
            disabled={selectedPlane.type !== 'overloaded'}
            onClick={() => selectedPlane.type === 'overloaded' && handleRescue && handleRescue(selectedPlane)}
            style={{
              height: 150,
              width: 60,
              marginLeft: 15,
              marginBottom: 40,
              borderRadius: 16,
              border: 'none',
              fontFamily: 'VT323, monospace',
              fontSize: 18,
              fontWeight: 'bold',
              background: selectedPlane.type === 'overloaded' ? 'linear-gradient(orange,#ff9800 80%,#ffb74d)' : '#444',
              color: selectedPlane.type === 'overloaded' ? '#fff' : '#bbb',
              boxShadow: selectedPlane.type === 'overloaded' ? '0 0 24px 6px #ff9800' : 'none',
              cursor: selectedPlane.type === 'overloaded' ? 'pointer' : 'not-allowed',
              outline: selectedPlane.type === 'overloaded' ? '2px solid #ff9800' : 'none',
              opacity: selectedPlane.type === 'overloaded' ? 1 : 0.5,
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              letterSpacing: 0,
              lineHeight: 1.1
            }}
          >
            {'RESCUE'.split('').map((char, i) => (
              <span key={i}>{char}</span>
            ))}
          </button>
        </div>
      )}
    </div>
  );
} 