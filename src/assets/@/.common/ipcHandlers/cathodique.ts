export const componentClasses = new Map<string, new () => any>();
export const componentInstances = new Map<string, any>();

export const cathodiqueHandlers = {
  async createInstance(data: { className: string; componentId: string }) {
    // TODO Obj verification
    const ClassObj = componentClasses.get(data.className);
    if (!ClassObj) return; // Quiet fail

    const componentInstance = new ClassObj();

    await componentInstance.init();

    componentInstances.set(data.componentId, componentInstance);
    return;
  },
  getProperty(data: { propertyName: string; componentId: string }) {
    const component = componentInstances.get(data.componentId);

    return component[data.propertyName];
  },
  setProperty(data: {
    propertyName: string;
    propertyValue: any;
    componentId: string;
  }) {
    const component = componentInstances.get(data.componentId);

    try {
      component[data.propertyName] = data.propertyValue;
      return true;
    } catch (err) {
      return false;
    }
  },
  callProperty(data: {
    methodName: string;
    arguments: string;
    componentId: string;
  }) {
    const component = componentInstances.get(data.componentId);

    return component[data.methodName](...data.arguments);
  },
};
