import StaffServicesEditor from "./editor";

export default async function StaffServicesPage({
  params
}: {
  params: Promise<{ staffMemberId: string }>;
}) {
  const { staffMemberId } = await params;
  return <StaffServicesEditor staffMemberId={staffMemberId} />;
}
