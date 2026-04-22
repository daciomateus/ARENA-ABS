import { buildWhatsAppLink } from "../data/content";

const variants = {
  primary:
    "bg-gradient-to-r from-coral to-orange-300 text-ink shadow-glow hover:-translate-y-0.5",
  secondary:
    "border border-white/15 bg-white/5 text-white hover:-translate-y-0.5 hover:border-white/30",
  ghost:
    "border border-sky/30 bg-sky/10 text-white hover:-translate-y-0.5 hover:bg-sky/15",
};

export function WhatsAppButton({
  label,
  message,
  variant = "primary",
  className = "",
}) {
  return (
    <a
      href={buildWhatsAppLink(message)}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex min-h-12 items-center justify-center rounded-full px-5 py-3 text-sm font-semibold tracking-wide transition duration-200 ${variants[variant]} ${className}`}
    >
      {label}
    </a>
  );
}
