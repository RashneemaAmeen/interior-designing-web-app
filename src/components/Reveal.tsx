import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";

type Props = {
  children: ReactNode;
  as?: keyof React.JSX.IntrinsicElements;
  delay?: number;
  className?: string;
};

export function Reveal({ children, as = "div", delay = 0, className = "" }: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Tag = as as string;
  const style: CSSProperties = delay ? { transitionDelay: `${delay}ms` } : {};

  return (
    // @ts-expect-error dynamic tag
    <Tag
      ref={ref}
      style={style}
      className={`reveal ${visible ? "reveal-visible" : ""} ${className}`}
    >
      {children}
    </Tag>
  );
}
