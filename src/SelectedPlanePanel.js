import React from 'react';

export default function SelectedPlanePanel({ selectedPlane, handleRescue }) {
  return (
    <div style={{
      position: 'fixed',
      left: 24,
      top: 425,
      width: 255,
      minHeight: 180,
      background: '#181818',
      border: '2px solid #00ff00',
      borderRadius: 12,
      color: '#fff',
      fontFamily: 'VT323, monospace',
      fontSize: 18,
      padding: 16,
      boxShadow: '0 0 16px #00ff00',
      opacity: 0.98,
      marginTop: 0,
      zIndex: 30001
    }}>
      <div style={{
        fontFamily: 'VT323, monospace',
        fontSize: 22,
        color: '#ffeb3b',
        textShadow: '0 0 8px #ffeb3b, 0 0 16px #ffeb3b',
        marginBottom: 12,
        letterSpacing: 1.5
      }}>
        Select your OVERLOADED plane and <span style={{color:'#fff'}}>rescue</span> it before it falls!
      </div>
      {!selectedPlane ? (
        <div style={{color:'#888'}}>Click a plane to see details.</div>
      ) : (
        <>
          <div style={{fontSize:20, color:'#ff0', marginBottom:6}}><b>Block #{selectedPlane.blockNumber}</b></div>
          <div><b>Status:</b> <span style={{color:selectedPlane.type==='rescued'||selectedPlane.type==='refueled'?'#00ff80':selectedPlane.type==='overloaded'?'#ffcc00':selectedPlane.type==='outOfGas'?'#ff4444':'#fff', textShadow:selectedPlane.type==='outOfGas'?'0 0 12px #ff0000, 0 0 24px #ff0000':''}}>{selectedPlane.type.toUpperCase()}</span></div>
          <div><b>Tx Count:</b> {selectedPlane.transactionCount}</div>
          <div><b>Gas Used:</b> {selectedPlane.gasUsed}</div>
          <div><b>Gas Limit:</b> {selectedPlane.gasLimit}</div>
          <div><b>Revert Ratio:</b> {(selectedPlane.revertRatio*100).toFixed(1)}%</div>
          {selectedPlane.type === 'overloaded' && (
            <>
              <div style={{margin:'8px 0', color:'#ffcc00'}}><b>Rescue this block before it falls!</b></div>
              <button style={{padding:'8px 18px', fontSize:20, fontFamily:'VT323, monospace', background:'#ffcc00', color:'#222', border:'none', borderRadius:8, cursor:'pointer', boxShadow:'0 0 8px #ffcc00', fontWeight:'bold'}} onClick={() => handleRescue(selectedPlane)}>RESCUE</button>
            </>
          )}
          {selectedPlane.type === 'outOfGas' && (
            <>
              <div style={{margin:'8px 0', color:'#ff4444', textShadow:'0 0 12px #ff0000, 0 0 24px #ff0000'}}><b>Refuel this block before it falls!</b></div>
              <button style={{padding:'8px 18px', fontSize:20, fontFamily:'VT323, monospace', background:'#ff4444', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', boxShadow:'0 0 12px #ff0000', fontWeight:'bold'}} onClick={() => handleRescue(selectedPlane)}>REFUEL</button>
            </>
          )}
          {selectedPlane.type === 'rescued' && (
            <div style={{margin:'12px 0', color:'#00ff00', fontWeight:'bold', fontSize:22}}>RESCUED!</div>
          )}
          {selectedPlane.type === 'refueled' && (
            <div style={{margin:'12px 0', color:'#00ff00', fontWeight:'bold', fontSize:22}}>REFUELED!</div>
          )}
          {/* Reverted işlemler bölümü */}
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
          {/* Mission Debrief: tüm tx'ler tıklanabilir */}
          {selectedPlane && selectedPlane.transactions && selectedPlane.transactions.length > 0 ? (
            <div style={{marginTop:12}}>
              <b>Mission Debrief:</b><br/>
              {selectedPlane.transactions.map((tx, i) => (
                <div key={tx.hash} style={{marginBottom:4}}>
                  <span style={{color:'#0ff'}}>Hash:</span>
                  <a href={`https://testnet.monadexplorer.com/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" style={{color:'#00ff00', textDecoration:'underline', fontFamily:'monospace'}}>
                    {tx.hash.slice(0,10)}...{tx.hash.slice(-6)}
                  </a>
                  <span style={{color:'#ff0', marginLeft:8}}>[{tx.type || 'Other'}]</span><br/>
                </div>
              ))}
            </div>
          ) : (
            <div style={{marginTop:12, color:'#888'}}>No failed transactions.</div>
          )}
          {selectedPlane && (
            <div style={{
              marginTop: 24,
              background: '#181818',
              border: '2px solid #00ff00',
              borderRadius: 12,
              color: '#fff',
              fontFamily: 'VT323, monospace',
              fontSize: 18,
              padding: 16,
              boxShadow: '0 0 16px #00ff00',
              opacity: 0.98,
              marginBottom: 0,
              zIndex: 30001
            }}>
              <div style={{
                fontFamily: 'VT323, monospace',
                fontSize: 22,
                color: '#ffeb3b',
                textShadow: '0 0 8px #ffeb3b, 0 0 16px #ffeb3b',
                marginBottom: 12,
                letterSpacing: 1.5
              }}>
                Select your plane and rescue it before it falls!
              </div>
              <div style={{fontSize:20, color:'#ffeb3b', marginBottom:6}}><b>Block #{selectedPlane.number}</b></div>
              <div><b>Status:</b> <span style={{color:selectedPlane.type==='RESCUED'?'#00ff80':selectedPlane.type==='OVERLOADED'?'#ffcc00':'#00ff00', textShadow:selectedPlane.type==='OVERLOADED'?'0 0 8px #ffcc00, 0 0 16px #ffcc00':''}}>{selectedPlane.type.toUpperCase()}</span></div>
              <div><b>Tx Count:</b> {selectedPlane.transactions?.length ?? 0}</div>
              <div><b>Gas Used:</b> {selectedPlane.gasUsed}</div>
              <div><b>Gas Limit:</b> {selectedPlane.gasLimit}</div>
              <div><b>Revert Ratio:</b> {selectedPlane.revertRatio ? (selectedPlane.revertRatio*100).toFixed(1) : '0.0'}%</div>
              {selectedPlane.type === 'OVERLOADED' && (
                <button style={{padding:'8px 18px', fontSize:20, fontFamily:'VT323, monospace', background:'#ffcc00', color:'#222', border:'none', borderRadius:8, cursor:'pointer', boxShadow:'0 0 8px #ffcc00', fontWeight:'bold', marginTop:12}} onClick={() => handleRescue(selectedPlane)}>RESCUE</button>
              )}
              {selectedPlane.type === 'RESCUED' && (
                <div style={{color:'#00ff80', fontWeight:'bold', fontSize:22, marginTop:10}}>RESCUED!</div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
} 