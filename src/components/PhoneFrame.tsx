import { useEffect, useState, type ReactNode } from "react"

type PhoneFrameProps = {
  children: ReactNode
}

function useIsDesktopFrame(): boolean {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false
    return window.matchMedia("(min-width: 768px)").matches
  })

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    const query = window.matchMedia("(min-width: 768px)")
    const onChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches)
    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", onChange)
      return () => query.removeEventListener("change", onChange)
    }
    query.addListener(onChange)
    return () => query.removeListener(onChange)
  }, [])

  return isDesktop
}

export function PhoneFrame({ children }: PhoneFrameProps) {
  const isDesktop = useIsDesktopFrame()

  return (
    <div
      className="flex items-center justify-center w-full h-full"
      style={{ background: "#D9D7D0", fontFamily: "var(--font-sans)" }}
    >
      <div className="flex items-center justify-center gap-8">
        <div
          data-testid="iphone-frame"
          style={isDesktop ? {
            width: 390,
            height: 844,
            background: "var(--color-canvas)",
            borderRadius: 48,
            border: "10px solid #1A1714",
            boxShadow:
              "0 40px 80px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.1)",
            overflow: "hidden",
            position: "relative",
            flexShrink: 0,
          } : {
            width: "100vw",
            height: "100vh",
            background: "var(--color-canvas)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {isDesktop ? (
            <div
              className="flex items-center justify-between px-8 pt-4 pb-2"
              style={{ fontSize: 13, fontWeight: 600 }}
            >
              <span style={{ color: "#1A1714" }}>9:41</span>
              <div
                data-testid="dynamic-island"
                style={{
                  width: 120,
                  height: 32,
                  background: "#1A1714",
                  borderRadius: 20,
                  position: "absolute",
                  left: "50%",
                  transform: "translateX(-50%)",
                  top: 8,
                }}
              />
              <div
                className="flex items-center gap-1.5"
                style={{ color: "#1A1714" }}
              >
                <svg
                  width="16"
                  height="12"
                  viewBox="0 0 16 12"
                  fill="none"
                  aria-hidden
                >
                  <rect
                    x="0"
                    y="3"
                    width="3"
                    height="9"
                    rx="1"
                    fill="currentColor"
                    opacity="0.4"
                  />
                  <rect
                    x="4.5"
                    y="2"
                    width="3"
                    height="10"
                    rx="1"
                    fill="currentColor"
                    opacity="0.6"
                  />
                  <rect
                    x="9"
                    y="0"
                    width="3"
                    height="12"
                    rx="1"
                    fill="currentColor"
                    opacity="0.8"
                  />
                  <rect
                    x="13.5"
                    y="0"
                    width="2.5"
                    height="12"
                    rx="1"
                    fill="currentColor"
                  />
                </svg>
                <svg
                  width="16"
                  height="12"
                  viewBox="0 0 16 12"
                  fill="currentColor"
                  opacity="0.8"
                  aria-hidden
                >
                  <ellipse
                    cx="8"
                    cy="6"
                    rx="7"
                    ry="5"
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="1.5"
                  />
                  <ellipse
                    cx="8"
                    cy="6"
                    rx="4"
                    ry="3"
                    fill="currentColor"
                    opacity="0.6"
                  />
                  <circle cx="8" cy="6" r="1.5" fill="currentColor" />
                </svg>
                <svg
                  width="25"
                  height="12"
                  viewBox="0 0 25 12"
                  fill="none"
                  aria-hidden
                >
                  <rect
                    x="0.5"
                    y="0.5"
                    width="21"
                    height="11"
                    rx="3.5"
                    stroke="currentColor"
                    opacity="0.35"
                  />
                  <rect
                    x="2"
                    y="2"
                    width="16"
                    height="8"
                    rx="2"
                    fill="currentColor"
                  />
                  <path
                    d="M23 4v4a2 2 0 000-4z"
                    fill="currentColor"
                    opacity="0.4"
                  />
                </svg>
              </div>
            </div>
          ) : null}
          <div style={{ height: isDesktop ? "calc(100% - 50px)" : "100%", overflow: "hidden" }}>
            {children}
          </div>
        </div>
        {isDesktop ? (
          <div className="text-left" style={{ maxWidth: 220 }}>
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-[#1A1714] rounded-[10px] flex items-center justify-center">
                <span style={{ color: "white", fontWeight: 800, fontSize: 13 }}>
                  YK
                </span>
              </div>
              <span style={{ fontWeight: 700, fontSize: 18, color: "#1A1714" }}>
                YoungKingZ
              </span>
            </div>
            <p style={{ fontSize: 13, color: "#6B6560", lineHeight: 1.5 }}>
              Experiencia del Dueño
              <br />
              Workspace preparado para P0.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
