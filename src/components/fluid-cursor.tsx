import { useEffect } from 'react';
// @ts-ignore
import fluidCursor from '@/hooks/useFluidCursor.jsx';

const FluidCursor = () => {
  useEffect(() => {
    const cleanup = fluidCursor();
    return () => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 z-10">
      <canvas id="fluid" className="h-screen w-screen pointer-events-none inset-0 fixed" />
    </div>
  );
};

export default FluidCursor;
