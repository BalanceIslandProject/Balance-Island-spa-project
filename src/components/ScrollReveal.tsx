'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ScrollRevealProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  yOffset?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  staggerChildren?: number;
  className?: string;
  viewportMargin?: string;
  once?: boolean;
}

export default function ScrollReveal({
  children,
  delay = 0,
  duration = 0.8,
  yOffset = 28,
  direction = 'up',
  staggerChildren = 0,
  className = '',
  viewportMargin = '-60px',
  once = true,
  ...props
}: ScrollRevealProps) {
  const getInitial = () => {
    switch (direction) {
      case 'up':
        return { opacity: 0, y: yOffset };
      case 'down':
        return { opacity: 0, y: -yOffset };
      case 'left':
        return { opacity: 0, x: yOffset };
      case 'right':
        return { opacity: 0, x: -yOffset };
      case 'none':
        return { opacity: 0 };
      default:
        return { opacity: 0, y: yOffset };
    }
  };

  const variants = {
    hidden: getInitial(),
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
        ...(staggerChildren > 0 ? { staggerChildren } : {}),
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: viewportMargin }}
      variants={variants}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
