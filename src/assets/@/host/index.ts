import { Orchestrator } from "./classes/orchestrator.js";
import { OrderedPeer } from "./classes/orderedPeer.js";

OrderedPeer.registerIpcListener();

const orchestrator = new Orchestrator();

const module = orchestrator.load("WindowFrame");

const windowFrame = await module.createInstance("WindowFrame");

console.log(await windowFrame.template);

document.body.append(await windowFrame.template);
