import type { ReactNode } from "react"

type RootPlaceholderProps = {
  title: string
  description: string
  icon: ReactNode
}

export function RootPlaceholder({
  title,
  description,
  icon,
}: RootPlaceholderProps) {
  return (
    <section className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-6 pt-10 pb-8">
      <div className="max-w-[300px]">
        <div
          className="w-14 h-14 rounded-[18px] flex items-center justify-center mb-6"
          style={{
            background: "var(--color-brand-50)",
            color: "var(--color-brand-700)",
          }}
        >
          {icon}
        </div>
        <h1 className="text-[30px] leading-[38px] font-[600] text-[var(--color-ink)] tracking-[-0.02em]">
          {title}
        </h1>
        <p className="text-[15px] leading-[23px] text-[var(--color-ink-2)] mt-3">
          {description}
        </p>
        <div className="h-px bg-[var(--color-border-subtle)] my-7" />
        <p className="text-[12px] leading-[18px] text-[var(--color-ink-3)]">
          Superficie reservada para una fase posterior.
        </p>
      </div>
    </section>
  )
}
