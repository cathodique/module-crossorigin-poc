import { cathodiqueHandlers } from "./ipcHandlers/cathodique.js";
import { domSyncHandlers } from "./ipcHandlers/dom.js";
import { hostWithoutSubdomain } from "./utils.js";

const ordered = (postMessage: typeof globalThis.postMessage, origin = "*") => {
  let currentOrder = 0;
  let pendingMessages: any[] = [];
  let pendingTransfer: Transferable[] = [];

  return (data: any, transfer: Transferable[] = []) => {
    pendingMessages.push(data);
    pendingTransfer.push(...transfer);

    if (pendingMessages.length === 1) {
      queueMicrotask(() => {
        postMessage(
          {
            messages: pendingMessages,
            currentOrder,
          },
          origin,
          pendingTransfer,
        );

        pendingMessages = [];
        pendingTransfer = [];
        currentOrder += 1;
      });
    }
  };
};
export const postToParent = ordered(window.parent.postMessage, hostWithoutSubdomain);

const orderedDecoder = (callback: (v: MessageEvent) => any) => {
  const remaining = new Map<number, MessageEvent[]>();
  let current = 0;

  return ({ data: { messages, currentOrder } }: { data: { messages: any[], currentOrder: number } }) => {
    remaining.set(currentOrder, messages);
    if (current === currentOrder) {
      do {
        remaining.get(current)!.map((v) => callback(v));
        remaining.delete(current);
        current += 1;
      } while (remaining.has(current));
    }
  };
};

const handlers = {
  ...cathodiqueHandlers,
  ...domSyncHandlers,
} as Record<string, (...data: any[]) => any>;

const promiseCallbacks = new Map<string, (...a: any[]) => any>();

export const setupIpcListener = () => {
  window.addEventListener(
    "message",
    orderedDecoder(async (v) => {
      if (v.origin !== hostWithoutSubdomain) return;

      await Promise.all(
        v.data.messages.map(async (message: { data: any, type: string }) => {
          const { data, type } = message;

          if (type === "promiseReply") {
            const promiseCallback = promiseCallbacks.get(data.promiseId);

            if (!promiseCallback) return console.log('No such promise handler');

            return promiseCallback(data.promiseValue);
          }

          if (!(type in handlers)) return console.error('No such type handler');
          const [result, transfer] = await handlers[type](data);

          postToParent(result, transfer);
        })
      );
    }),
  );
};
