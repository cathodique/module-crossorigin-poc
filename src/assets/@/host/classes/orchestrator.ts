import { Module } from "./module.js";

interface OrchestratorData {
  defaults: Record<string, string>;
}

export class Orchestrator {
  data: OrchestratorData;

  constructor() {
    const script = document.querySelector("script[type=\"application/vnd.raytube.orchestrator-data\"]");

    if (!script || !script.textContent) throw new Error("Cannot orchestrate: No script");

    this.data = JSON.parse(script.textContent);
  }

  load(schemaName: string) {
    return Module.getModule(this.data.defaults[schemaName]);
  }
}
