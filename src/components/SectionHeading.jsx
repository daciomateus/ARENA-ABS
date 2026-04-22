export function SectionHeading({ eyebrow, title, description, align = "left" }) {
  const alignment =
    align === "center"
      ? "mx-auto max-w-3xl text-center items-center"
      : "max-w-3xl";

  return (
    <div className={`flex flex-col gap-4 ${alignment}`} data-reveal>
      <span className="section-kicker">{eyebrow}</span>
      <h2 className="font-display text-4xl leading-none tracking-tight text-white sm:text-5xl md:text-6xl">
        {title}
      </h2>
      {description ? (
        <p className="max-w-2xl text-base leading-7 text-mist sm:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}
