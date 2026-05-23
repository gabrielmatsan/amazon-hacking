"use client";

import { motion, type Variants } from "motion/react";

type RevealProps = {
  children: React.ReactNode;
  /** Direction the element slides in from. */
  from?: "up" | "down" | "left" | "right";
  /** Delay in seconds before the animation starts. */
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "span" | "h2" | "h3" | "p" | "ul" | "ol";
};

const offset = 24;

const offsetByDirection: Record<NonNullable<RevealProps["from"]>, { x: number; y: number }> = {
  up: { x: 0, y: offset },
  down: { x: 0, y: -offset },
  left: { x: offset, y: 0 },
  right: { x: -offset, y: 0 },
};

export function Reveal({
  children,
  from = "up",
  delay = 0,
  className,
  as = "div",
}: RevealProps) {
  const { x, y } = offsetByDirection[from];

  const variants: Variants = {
    hidden: { opacity: 0, x, y },
    show: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const MotionTag = motion[as];

  return (
    <MotionTag
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.25 }}
    >
      {children}
    </MotionTag>
  );
}

/** Wrap a group; children using Reveal will stagger via parent orchestration. */
export function RevealGroup({
  children,
  className,
  stagger = 0.12,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger } },
      }}
    >
      {children}
    </motion.div>
  );
}
