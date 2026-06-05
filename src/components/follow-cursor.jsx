import { useEffect } from 'react';

const FollowCursor = () => {
  useEffect(() => {
    let canvas;
    let context;
    let animationFrame;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let cursor = { x: width / 2, y: height / 2 };
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let dot;

    class Dot {
      constructor(x, y, size, lag, image) {
        this.position = { x, y };
        this.size = size;
        this.lag = lag;
        this.image = image;
      }

      moveTowards(x, y, context) {
        this.position.x += (x - this.position.x) / this.lag;
        this.position.y += (y - this.position.y) / this.lag;
        const drawSize = this.size;

        context.drawImage(
          this.image,
          this.position.x - drawSize / 2,
          this.position.y - drawSize / 2,
          drawSize,
          drawSize
        );
      }
    }

    const onMouseMove = (e) => {
      cursor.x = e.clientX;
      cursor.y = e.clientY;
    };

    const onWindowResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      if (canvas) {
        canvas.width = width;
        canvas.height = height;
      }
    };

    const updateDot = () => {
      if (context && dot) {
        context.clearRect(0, 0, width, height);
        dot.moveTowards(cursor.x, cursor.y, context);
      }
    };

    const loop = () => {
      updateDot();
      animationFrame = requestAnimationFrame(loop);
    };

    const init = () => {
      if (prefersReducedMotion.matches) {
        console.log('Reduced motion enabled, cursor effect skipped.');
        return;
      }

      canvas = document.createElement('canvas');
      context = canvas.getContext('2d');
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '9999';
      canvas.width = width;
      canvas.height = height;
      document.body.appendChild(canvas);

      const img = new Image();
      img.onload = () => {
        dot = new Dot(width / 15, height / 15, 64, 3, img); 
        loop(); 
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('resize', onWindowResize);
    };

    const destroy = () => {
      if (canvas) canvas.remove();
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onWindowResize);
    };

    prefersReducedMotion.onchange = () => {
      if (prefersReducedMotion.matches) {
        destroy();
      } else {
        init();
      }
    };

    init();

    return () => {
      destroy();
    };
  }, []);

  return null;
};

export default FollowCursor;
