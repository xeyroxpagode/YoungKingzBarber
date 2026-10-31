export function effectiveDisplayName(input: { professionalDisplayName: string | null; firstName: string; lastName: string | null }) {
  return input.professionalDisplayName ?? [input.firstName, input.lastName].filter(Boolean).join(" ");
}

export function professionallyEnabled(status: "ACTIVE" | "INACTIVE", employmentStatus: string) {
  return status === "ACTIVE" && employmentStatus === "ACTIVE";
}

export function sameProfessionalPresentation(
  current: { professionalDisplayName: string | null; bio: string | null; publicTitle: string | null },
  next: { professionalDisplayName: string | null; bio: string | null; publicTitle: string | null }
) {
  return current.professionalDisplayName === next.professionalDisplayName && current.bio === next.bio && current.publicTitle === next.publicTitle;
}
