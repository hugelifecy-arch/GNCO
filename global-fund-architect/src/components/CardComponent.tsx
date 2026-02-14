import type { PropsWithChildren, ReactNode } from "react";

type CardComponentProps = PropsWithChildren<{
  title: ReactNode;
  className?: string;
}>;

export function CardComponent({ title, className, children }: CardComponentProps) {
  return (
    <article className={["card-component", className].filter(Boolean).join(" ")}>
      <h3>{title}</h3>
      {children}
    </article>
  );
}
