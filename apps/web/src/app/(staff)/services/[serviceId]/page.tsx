import { ServiceDetailWorkspace } from "@/features/catalog/ServiceDetail";
export default async function ServicePage({params}:{params:Promise<{serviceId:string}>}){const {serviceId}=await params;return <ServiceDetailWorkspace serviceId={serviceId}/>;}
