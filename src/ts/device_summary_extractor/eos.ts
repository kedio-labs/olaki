import appConfig from '../../../appConfig.json';
import logger from '../../logger';
import { CodenameToDeviceSummary, EOSInstallMode, EOSMaturity } from './model';
import { normaliseCodename } from './util';
import { readdirSync, readFileSync } from 'fs';
import { load } from 'js-yaml';

const UTF_8 = 'utf8';
const DEVICE_INFO_ROOT_DIRECTORY = './submodules/user/htdocs/_data/devices';
const E_OS_BASE_DEVICE_URL = 'https://doc.e.foundation/devices';

const shouldIncludeDevice = (isLegacy: boolean, maturity: string) => {
  if (isLegacy && !appConfig.eos.includeLegacy) {
    return false;
  } else {
    return (
      (maturity === EOSMaturity[EOSMaturity.red] && appConfig.eos.includeRedMaturity) ||
      (maturity === EOSMaturity[EOSMaturity.orange] && appConfig.eos.includeOrangeMaturity) ||
      (maturity === EOSMaturity[EOSMaturity.green] && appConfig.eos.includeGreenMaturity)
    );
  }
};

const getInstallModes = (installArray: { mode: string }[]): EOSInstallMode[] =>
  installArray.map(install => {
    const modeLowerCase = install.mode.toLowerCase();

    if (modeLowerCase === 'community install doc') {
      return EOSInstallMode.communityInstallDoc;
    }
    if (modeLowerCase === 'official install doc') {
      return EOSInstallMode.officialInstallDoc;
    }
    if (modeLowerCase === '/e/os installer') {
      return EOSInstallMode.eOSInstaller;
    }
    if (modeLowerCase === 'murena smartphones') {
      return EOSInstallMode.murenaSmartphones;
    }
    if (modeLowerCase === 'roll-back') {
      return EOSInstallMode.rollBack;
    }

    throw Error(`[EOS] Unknown install mode: ${install.mode}`);
  });
export default function extractEOsDeviceSummaries(): CodenameToDeviceSummary {
  const codenameToDeviceSummary: CodenameToDeviceSummary = {};

  const deviceInfoFilenames = readdirSync(DEVICE_INFO_ROOT_DIRECTORY);

  deviceInfoFilenames.forEach(deviceInfoFilename => {
    const filePath = `${DEVICE_INFO_ROOT_DIRECTORY}/${deviceInfoFilename}`;

    logger.debug(`[EOS] Reading content of file ${filePath}`);

    const deviceInfoFileContent: string = readFileSync(filePath, UTF_8);
    const deviceInfo: any = load(deviceInfoFileContent, { json: true }) as any;

    const isLegacy = Object.hasOwn(deviceInfo, 'legacy') && deviceInfo.legacy.trim() == 'yes';
    const maturity = deviceInfo.maturity;
    if (!shouldIncludeDevice(isLegacy, maturity)) {
      logger.debug(`[EOS] Excluding device due to legacy flag or maturity level ${maturity}: ${deviceInfoFilename}`);
      return;
    }
    const codename = deviceInfo.codename;
    logger.debug(`[EOS] Processing codename ${codename}`);

    const normalisedCodename = normaliseCodename(codename);
    codenameToDeviceSummary[normalisedCodename] = {
      codename: normalisedCodename,
      name: deviceInfo.name,
      vendor: deviceInfo.vendor,
      releaseDate: deviceInfo.release,
      eos: {
        isLegacy,
        maturity,
        installModes: getInstallModes(deviceInfo.install),
        models: deviceInfo.models,
        url: `${E_OS_BASE_DEVICE_URL}/${codename}`,
      },
    };
  });

  return codenameToDeviceSummary;
}
