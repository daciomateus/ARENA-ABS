import { WhatsAppButton } from "./WhatsAppButton";

export function ServiceCard({ title, description, cta, message }) {
  return (
    <article
      className="surface-card group flex h-full flex-col justify-between gap-6 p-6"
      data-reveal
    >
      <div className="space-y-4">
        <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sand">
          Serviço
        </div>
        <h3 className="font-display text-2xl leading-none tracking-tight text-white">
          {title}
        </h3>
        <p className="text-sm leading-7 text-mist sm:text-base">{description}</p>
      </div>

      <WhatsAppButton
        label={cta}
        message={message}
        variant="secondary"
        className="w-full sm:w-fit"
      />
    </article>
  );
}
