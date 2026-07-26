import type { BadgeTone } from "@/lib/scoring";

type Props = {
  tone: BadgeTone;
  children: React.ReactNode;
};

export default function Badge({ tone, children }: Props) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
