import { join } from "../auth";
import { IContext } from "../context";
import { PsstError } from "../errors";
import { hexStringToUint8Array } from "../f";
import { IRPCContext } from "./jsonrpc";

function callbackify(f: any) {
  return (args: any, context: IRPCContext, callback: any) => {
    try {
      callback(null, f(context.user, ...args));
    } catch (error) {
      if (error instanceof PsstError) {
        callback({
          code: error.code,
          message: error.toString(),
        });
      } else {
        throw error;
      }
    }
  };
}

export default function rpc(context: IContext) {
  const { db } = context;

  function rpcJoin(publicKey: string, invite: string) {
    join(db, hexStringToUint8Array(publicKey), hexStringToUint8Array(invite));
  }

  function rpcReadSecrets(publicKey: string) {
    //join(db, hexStringToUint8Array(publicKey), hexStringToUint8Array(invite));
  }

  return {
    join: callbackify(rpcJoin),
  };
}
