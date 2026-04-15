/**
 * @hook useReducedMotion
 * @description Detects if user prefers reduced motion via media query.
 *              Returns true if prefers-reduced-motion matches.
 * 
 * Usage:
 *   const prefersReducedMotion = useReducedMotion();
 *   
 *   const animationClass = prefersReducedMotion ? 'no-animation' : 'fade-in';
 *   return <div className={animationClass}>Content</div>;
 */

import { useEffect, useState } from 'react';

export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check initial preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handleChange = (e) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

export default useReducedMotion;
