export type codename = string;

export interface DeviceSummary extends DeviceSummaryOSSpecific {
  name: string;
  vendor: string;
  releaseDate?: string;
}

export interface DeviceSummaryOSSpecific {
  lineageOs?: LineageOs;
  pmos?: Pmos;
  eOS?: eOS;
  ubuntuTouch?: UbuntuTouch;
  resurrectionRemix?: ResurrectionRemix;
  cDroid?: CDroid;
  kali?: Kali;
  omnirom?: Omnirom;
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

export interface UbuntuTouch {
  // 0 -> 0%, 1 -> 100%
  progress: number;
  url: string;
}

interface ResurrectionRemix {
  isMaintained: boolean;
  url?: string;
}

interface CDroid {
  url: string;
}

interface Kali {
  url: string;
  isStable: boolean;
  isLatest: boolean;
}

interface Omnirom {
  url: string;
  isOfficial: boolean;
}

export interface CodenameToDeviceSummary {
  [k: codename]: DeviceSummary;
}

export interface JsonResult {
  lastUpdated: number;
  codenameToDeviceSummary: CodenameToDeviceSummary;
}
