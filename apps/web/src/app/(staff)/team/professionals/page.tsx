import { redirect } from "next/navigation";

// Professional Profiles are no longer a Product surface (U03 §56, §57). This deep link
// redirects to the Team root; ProfessionalProfile data/routes are preserved (U03 §101).
export default function ProfessionalsPage() { redirect("/team"); }
