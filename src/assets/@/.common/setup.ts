// NOTES FOR FUTURE USE
// TODO: TURN INTO README
// - Element lifetimes are handled by the client (this, here!)
//   Because, them being dereferenced implied it's not ref'able
//   through the DOM tree

import { postToParent, setupIpcListener } from "./ipc.js";
import { nanoid } from "./utils.js";

setupIpcListener();

class Component extends EventTarget {
  componentHandle: string;

  constructor() {
    super();
    const handle = nanoid();
    this.componentHandle = '';
    Object.defineProperty(this, 'componentHandle', {
      get: () => handle,
      writable: false,
    });
  }

  postMessage(obj: Record<string | symbol, any>) {
    return postToParent({ ...obj, componentHandle: this.componentHandle });
  }

  getDependency(dep: string) {
    return this.postMessage({ type: "getDependency", dependency: dep });
  }
  getOptionalDependency(dep: string) {
    return this.postMessage({ type: "getOptionalDependency", dependency: dep });
  }
  getAllOfDependency(dep: string) {
    return this.postMessage({ type: "getAllOfDependency", dependency: dep });
  }
}

class ComponentList extends EventTarget {
  componentClasses = new Map();

  register(componentName: string, componentClass: new (...a: any[]) => Component) {
    if (this.componentClasses.has(componentName))
      throw new Error("This component already exists");
    this.componentClasses.set(componentName, componentClass);

    postMessage({
      type: "componentRegistered",
      componentName,
    });
  }
}
