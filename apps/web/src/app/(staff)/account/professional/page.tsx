import { redirect } from "next/navigation";

// Professional Profile is no longer a Product surface (U03 §57, §73). The deep link
// redirects to Mi cuenta; ProfessionalProfile data is preserved (U03 §74, §101).
export default function ProfessionalAccountPage() { redirect("/account"); }
