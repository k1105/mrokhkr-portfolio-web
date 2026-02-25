"use client";

import Link from "next/link";
import {useCallback} from "react";

interface TransitionLinkProps {
  href: string;
  bgColor: string;
  className?: string;
  children: React.ReactNode;
}

export default function TransitionLink({
  href,
  bgColor,
  className,
  children,
}: TransitionLinkProps) {
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      window.dispatchEvent(
        new CustomEvent("page-transition-start", {
          detail: {x: e.clientX, y: e.clientY, href, bgColor},
        }),
      );
    },
    [href, bgColor],
  );

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}
