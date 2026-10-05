import { DISCLAIMER } from "@/lib/config";

export default function Disclaimer() {
  return (
    <p
      data-testid="disclaimer"
      className="shrink-0 border-b border-line bg-[#fff8ee] px-4 py-2 text-center text-xs leading-5 text-[#5c3b12]"
    >
      {DISCLAIMER}
    </p>
  );
}
