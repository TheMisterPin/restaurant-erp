import type { ReactNode } from "react";

declare global {
  type BasePageProps = {
    children: ReactNode;
    className?: string;
  };
}

export {};
