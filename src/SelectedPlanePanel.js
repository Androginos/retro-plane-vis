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
        Select your plane and <span style={{color:'#fff'}}>rescue</span> it before it falls!
      </div>
      {!selectedPlane ? (
        <div style={{color:'#888'}}>Click a plane to see details.</div>
      ) : (
        <>
          <div style={{fontSize:20, color:'#ff0', marginBottom:6}}><b>Block #{selectedPlane.blockNumber}</b></div>
          <div><b>Status:</b> <span style={{color:selectedPlane.type==='rescued'?'#00ff80':selectedPlane.type==='overloaded'?'#ffcc00':selectedPlane.type==='outOfGas'?'#ff4444':'#fff'}}>{selectedPlane.type.toUpperCase()}</span></div>
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
          {selectedPlane.type === 'rescued' && (
            <div style={{margin:'12px 0', color:'#00ff00', fontWeight:'bold', fontSize:22}}>RESCUED!</div>
          )}
        </>
      )}
    </div>
  );
} 