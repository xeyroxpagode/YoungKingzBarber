import { api, ApiError } from "@/lib/api/client";

type Operation={status:"PENDING"|"SUCCEEDED"|"FAILED";responseBody?:unknown;errorCode?:string};

export async function professionalMutation(path:string,options:{method:"POST"|"PATCH";body:unknown}){
  const operationId=crypto.randomUUID();
  try{return await api(path,{method:options.method,operationId,body:JSON.stringify(options.body)});}
  catch(error){
    if(error instanceof ApiError)throw error;
    try{
      const operation=await api<Operation>(`/v1/operations/${operationId}`);
      if(operation.status==="SUCCEEDED")return {data:operation.responseBody,replayed:true};
      if(operation.status==="FAILED")throw new ApiError(operation.errorCode??"CONFLICT","La operación falló; revisá el estado antes de intentar de nuevo.",409);
    }catch(recovery){if(recovery instanceof ApiError&&recovery.code!=="NOT_FOUND")throw recovery;}
    throw new ApiError("TRANSPORT_UNCERTAIN","No pudimos confirmar el resultado. Actualizá antes de volver a intentar.",503,{operationId});
  }
}
