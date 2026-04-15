export function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <span className="brand-badge">{eyebrow}</span> : null}
        <h1 className="page-title mt-3">{title}</h1>
        {description ? <p className="section-copy mt-3 max-w-3xl">{description}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  )
}
