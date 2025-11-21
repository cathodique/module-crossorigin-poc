import { postToParent } from "../ipc.js";
import { patchNodeEventListeners } from "../nodeEventListener.js";
import { nanoid } from "../utils.js";

const elementToId = new WeakMap<Node, string>();
const idToNode = new Map<string, WeakRef<Node>>();

patchNodeEventListeners();

function getOrCreateId(node: Node, recursive: boolean = false) {
  if (recursive) node.childNodes.forEach((v) => getOrCreateId(v));

  if (elementToId.has(node)) return elementToId.get(node);

  const newNodeId = nanoid();
  registerAndObserveNode(node, newNodeId);
  return newNodeId;
}

function registerAndObserveNode(node: Node, id: string) {
  registerNode(node, id);
}

function registerNode(node: Node, id: string) {
  elementToId.set(node, id);
  idToNode.set(id, new WeakRef(node));

  const nodeTypeActual: Record<number, string> = {
    1: 'ELEMENT_NODE',
    3: 'TEXT_NODE',
    4: 'CDATA_SECTION_NODE',
    7: 'PROCESSING_INSTRUCTION_NODE',
    8: 'COMMENT_NODE',
    10: 'DOCUMENT_TYPE_NODE',
    11: 'DOCUMENT_FRAGMENT_NODE',
  };

  if (!nodeTypeActual[node.nodeType]) {
    throw new Error("We don't allow that here.");
  }

  switch (nodeTypeActual[node.nodeType]) {
    case 'ELEMENT_NODE':
      const element = node as Element;

      const children = Array.from(element.children).map((v) => getOrCreateId(v, true));

      postToParent({
        type: "createElement",
        addedNode: id,
        tagName: element.tagName,
        attributes: Array.from(element.attributes).map((v) => [v.namespaceURI, v.name, v.value]),
        children: children,
      });
      observeNode(node);
      break;

    case 'TEXT_NODE':
      const textNode = node as Text;
      postToParent({
        type: "createTextNode",
        addedNode: id,

      });
      observeNode(node);
      break;

    case '':

    // Don't bother sending any info about this node, it's pretty much useless
    // TODO: Handle CDATA somehow (Idk what it is so idk how to handle it)
    default:
      postToParent({
        type: "createArbitraryNode",
        addedNode: id,
        nodeType: node.nodeType,
      });
      break;
  }
}

// TODO Observe only once with one observer, but with subtree=true
function observeNode(node: Node) {
  const id = elementToId.get(node);

  if (!id) throw new Error("No such node registered");

  const mutObs = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      switch (mutation.type) {
        case "attributes":
          postToParent({
            type: "changeAttribute",
            target: id,
            namespace: mutation.attributeNamespace,
            attribute: mutation.attributeName,
          });
          break;
        case "childList":
          if (mutation.addedNodes.length > 0) {
            const nodes = Array.from(mutation.addedNodes).map((v) => getOrCreateId(v));
            postToParent({
              type: "addNodes",
              target: id,
              addedNodes: nodes,
              insertBefore: mutation.nextSibling && getOrCreateId(mutation.nextSibling),
            });
          }
          if (mutation.removedNodes.length > 0) {
            const nodes = Array.from(mutation.removedNodes).map((v) => getOrCreateId(v));
            postToParent({
              type: "removeNodes",
              target: id,
              removedNodes: nodes,
              insertBefore: mutation.nextSibling && getOrCreateId(mutation.nextSibling),
            });
          }
          break;
        case "characterData":
          postToParent({
            type: "characterData",
            target: id,
            value: node?.nodeValue,
          });

          parent.postMessage(id);
          break;
      }
    }
  });

  mutObs.observe(node, {
    attributes: true,
    childList: node instanceof Element,
    characterData: node instanceof Text,
  });
}

export const domSyncHandlers = {
  domEmitEvent(data: { id: string, event: Event }) {
    const element = idToNode.get(data.id)?.deref();

    if (!element) return console.error(`Tried to emit event ${data.event} to inexistent element ${data.id}`);

    element.dispatchEvent(data.event);
  },
};
