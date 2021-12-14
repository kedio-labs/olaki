export type codename = string;

export interface DeviceSummary {
  name: string;
  vendor: string;
  releaseDate?: string; // not available in ubuntu touch website
  lineageOs?: LineageOs;
  pmos?: Pmos;
  ubuntuTouch?: UbuntuTouch;
}

export interface LineageOs {
  versions: [];
  // add url
  // url: string;
  models: string[];
  isMaintained: boolean;
}

export interface Pmos {
  // add url
  // url: string;
  category: string;
}

export interface UbuntuTouch {
  // 0 -> 0%, 1 -> 100%
  progress: number;
  url: string;
}

export interface CodenameToDeviceSummary {
  [k: codename]: DeviceSummary;
}
