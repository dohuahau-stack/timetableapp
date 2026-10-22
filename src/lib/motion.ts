/** Hiệu ứng lò xo dùng chung cho mọi khối nổi lên khi hover. */
export const spring = { type: "spring", stiffness: 380, damping: 25 } as const;

export const lift = {
  whileHover: { y: -4, scale: 1.015 },
  whileTap: { scale: 0.98 },
  transition: spring,
} as const;
