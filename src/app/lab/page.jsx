"use client";

import dynamic from 'next/dynamic';

const DynamicLabCanvas = dynamic(() => import('../../components/LabCanvas'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[700px] bg-bg border border-muted/20 rounded-3xl animate-pulse flex items-center justify-center">
      <div className="text-accent font-mono text-sm tracking-widest uppercase">Initializing Physics Engine...</div>
    </div>
  )
});

export default function LabPage() {
  return (
    <div className="pt-24 px-6 md:px-12 w-full max-w-7xl mx-auto min-h-screen">
      <div className="mb-12 text-center md:text-left">
        <h1 className="text-4xl md:text-6xl font-display font-bold text-text mb-4 uppercase tracking-tighter mix-blend-difference z-20 relative pointer-events-none">
          The <span className="text-accent">Lab.</span>
        </h1>
        <p className="text-text-muted text-lg max-w-xl mx-auto md:mx-0">
          A sandbox for testing complex interactive visualisations. Grab, toss, and drag the nodes below to interact with the physics engine.
        </p>
      </div>

      <DynamicLabCanvas />
    </div>
  );
}
