export type codename = string;

export interface DeviceSummary {
  name: string;
  vendor: string;
  releaseDate: string;
  lineageOs?: LineageOs;
  pmos?: Pmos;
}

export interface LineageOs {
  versions: [];
  models: string[];
  isMaintained: boolean;
}

export interface Pmos {
  category: string;
}

export interface CodenameToDeviceSummary {
  [k: codename]: DeviceSummary;
}
