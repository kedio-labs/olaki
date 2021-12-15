import { load } from 'js-yaml';
import { readdirSync, readFileSync } from 'fs';
import { CodenameToDeviceSummary, eOSInstallMode, eOSMaturity } from './model';
import appConfig from '../../appConfig.json';
import logger from '../logger';
import { normaliseCodename } from './util';

const UTF_8 = 'utf8';
const DEVICE_INFO_ROOT_DIRECTORY = './user/htdocs/_data/devices';
const E_OS_BASE_DEVICE_URL = 'https://doc.e.foundation/devices';

const shouldIncludeDevice = (maturity: string) => {
  return (
    (maturity === eOSMaturity[eOSMaturity.red] && appConfig.eOs.includeRedMaturity) ||
    (maturity === eOSMaturity[eOSMaturity.orange] && appConfig.eOs.includeOrangeMaturity) ||
    (maturity === eOSMaturity[eOSMaturity.green] && appConfig.eOs.includeGreenMaturity)
  );
};

const getInstallModes = (installArray: { mode: string }[]): eOSInstallMode[] =>
  installArray.map(install => {
    if (install.mode === 'Install doc') {
      return eOSInstallMode.installDoc;
    }
    if (install.mode === 'Easy Installer') {
      return eOSInstallMode.easyInstaller;
    }
    if (install.mode === '/e/ smartphones') {
      return eOSInstallMode.eSmartphones;
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

    const maturity = deviceInfo.maturity;
    if (!shouldIncludeDevice(maturity)) {
      logger.debug(`[EOS] Excluding device due to maturity level ${maturity}: ${deviceInfoFilename}`);
      return;
    }
    const codename = deviceInfo.codename;
    logger.debug(`[EOS] Processing codename ${codename}`);

    const normalisedCodename = normaliseCodename(codename);
    codenameToDeviceSummary[normalisedCodename] = {
      name: deviceInfo.name,
      vendor: deviceInfo.vendor,
      releaseDate: deviceInfo.release,
      eOS: {
        maturity,
        installModes: getInstallModes(deviceInfo.install),
        models: deviceInfo.models,
        url: `${E_OS_BASE_DEVICE_URL}/${codename}`,
      },
    };
  });

  return codenameToDeviceSummary;
}
