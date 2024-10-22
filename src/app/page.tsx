// pages/index.tsx
'use client'

import Scene from '../components/Scene'

export default function Home() {
  return (
    <>
      <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
        <Scene />
        <div className="text1">
          <div className="instruction-item"> Drag to rotate</div>
          <div className="instruction-item"> Shift and drag to pan</div>
          <div className="instruction-item"> Scroll for zoom</div>
        </div>
      </div>
    </>
  );
}