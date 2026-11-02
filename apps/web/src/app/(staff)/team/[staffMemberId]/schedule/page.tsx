import { ScheduleWorkspace } from "@/features/schedules/ScheduleWorkspace";
export default async function SchedulePage({ params }: { params: Promise<{ staffMemberId: string }> }) { const { staffMemberId } = await params; return <ScheduleWorkspace staffMemberId={staffMemberId} />; }
