"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// The ceremonial khata scarf sweep, played once per full route change and
// never within a page. Fast, low opacity, slight vertical drift.
export function KhataTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setShow(true);
    const timer = setTimeout(() => setShow(false), 380);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <>
      {show && <div aria-hidden className="khata-veil pointer-events-none fixed inset-0 z-[200] bg-paper" />}
      {children}
    </>
  );
}
