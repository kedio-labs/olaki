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
  crdroid?: CrDroid;
  kali?: Kali;
  omnirom?: OmniROM;
  calyxos?: HasUrl;
  grapheneos?: HasUrl;
}

interface HasUrl {
  url: string;
}

export interface LineageOS extends HasUrl {
  versions: [];
  models: string[];
  isMaintained: boolean;
}

export interface PmOS extends HasUrl {
  category: string;
}

export enum EOSMaturity {
  red,
  orange,
  green,
}

export enum EOSInstallMode {
  communityInstallDoc,
  officialInstallDoc,
  easyInstaller,
  eSmartphones,
  rollBack,
}

export interface EOS extends HasUrl {
  maturity: EOSMaturity;
  installModes: EOSInstallMode[];
  models: string[];
}

export interface UbuntuTouch extends HasUrl {
  // 0 -> 0%, 1 -> 100%
  progress: number;
}

interface CrDroid extends HasUrl {
  latestAvailableVersion: number;
}

interface Kali extends HasUrl {
  isStable: boolean;
  isLatest: boolean;
}

interface OmniROM extends HasUrl {
  isOfficial: boolean;
}

export interface CodenameToDeviceSummary {
  [k: string]: DeviceSummary;
}

export interface JsonResult {
  lastUpdated: number;
  deviceSummaries: DeviceSummary[];
  appConfig: object;
}
