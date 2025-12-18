import { OrderedPeer } from "../classes/orderedPeer.js";
import { OtherNodeRegistry } from "../classes/sharedDomHost.js";

export function makeComponentProxy(componentId: string, peer: OrderedPeer) {
  return new Proxy({} as Record<string, any>, {
    get(_, prop) {
      if (prop === "then") return undefined;

      const calledOrGotten = async function (...args: any[]) {
        console.log(args);
        console.trace();
        const v = await peer.rpc("callProperty", {
          propertyName: prop,
          arguments: args,
          componentId,
        });
        if ("nodeId" in v) {
          return OtherNodeRegistry.registryOf(peer.win)!.getNode(v.nodeId);
        }
        return v.value;
      };
      calledOrGotten.then = (resolve: (a: any) => void) => peer.rpc("getProperty", {
        propertyName: prop,
        componentId,
      }).then((v) => {
        if ("nodeId" in v) {
          return resolve(OtherNodeRegistry.registryOf(peer.win)!.getNode(v.nodeId));
        }
        return resolve(v.value);
      });

      return calledOrGotten;
    },
  });
}
