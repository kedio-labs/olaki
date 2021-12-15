export type codename = string;

export interface DeviceSummary {
  name: string;
  vendor: string;
  releaseDate?: string; // not available in ubuntu touch website

  // OS specific
  lineageOs?: LineageOs;
  pmos?: Pmos;
  eOS?: eOS;
  ubuntuTouch?: UbuntuTouch;
}

export interface LineageOs {
  versions: [];
  models: string[];
  isMaintained: boolean;
  url: string;
}

export interface Pmos {
  category: string;
  url: string;
}

export interface UbuntuTouch {
  // 0 -> 0%, 1 -> 100%
  progress: number;
  url: string;
}

export enum eOSMaturity {
  red,
  orange,
  green,
}

export enum eOSInstallMode {
  installDoc,
  easyInstaller,
  eSmartphones,
}

export interface eOS {
  maturity: eOSMaturity;
  installModes: eOSInstallMode[];
  models: string[];
  url: string;
}

export interface CodenameToDeviceSummary {
  [k: codename]: DeviceSummary;
}

export interface JsonResult {
  lastUpdated: number;
  codenameToDeviceSummary: CodenameToDeviceSummary;
}
