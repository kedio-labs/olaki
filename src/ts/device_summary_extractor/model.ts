export interface DeviceSummary extends DeviceSummaryOSSpecific {
  name: string;
  vendor: string;
  releaseDate?: string;
  codename: string;
}

export interface DeviceSummaryOSSpecific {
  lineageos?: LineageOS;
  pmos?: PmOS;
  eos?: EOS;
  ubuntutouch?: UbuntuTouch;
  resurrectionremix?: ResurrectionRemix;
  crdroid?: CrDroid;
  kali?: Kali;
  omnirom?: OmniROM;
}

export interface LineageOS {
  versions: [];
  models: string[];
  isMaintained: boolean;
  url: string;
}

export interface PmOS {
  category: string;
  url: string;
}

export enum EOSMaturity {
  red,
  orange,
  green,
}

export enum EOSInstallMode {
  installDoc,
  easyInstaller,
  eSmartphones,
}

export interface EOS {
  maturity: EOSMaturity;
  installModes: EOSInstallMode[];
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

interface CrDroid {
  url: string;
}

interface Kali {
  url: string;
  isStable: boolean;
  isLatest: boolean;
}

interface OmniROM {
  url: string;
  isOfficial: boolean;
}

export interface CodenameToDeviceSummary {
  [k: string]: DeviceSummary;
}

export interface JsonResult {
  lastUpdated: number;
  deviceSummaries: DeviceSummary[];
}
