import appConfig from '../../../appConfig.json';
import logger from '../../logger';
import { CodenameToDeviceSummary, EOSInstallMode, EOSMaturity } from './model';
import { normaliseCodename } from './util';
import { readdirSync, readFileSync } from 'fs';
import { load } from 'js-yaml';

const UTF_8 = 'utf8';
const DEVICE_INFO_ROOT_DIRECTORY = './submodules/user/htdocs/_data/devices';
const E_OS_BASE_DEVICE_URL = 'https://doc.e.foundation/devices';

const shouldIncludeDevice = (maturity: string) => {
  return (
    (maturity === EOSMaturity[EOSMaturity.red] && appConfig.eos.includeRedMaturity) ||
    (maturity === EOSMaturity[EOSMaturity.orange] && appConfig.eos.includeOrangeMaturity) ||
    (maturity === EOSMaturity[EOSMaturity.green] && appConfig.eos.includeGreenMaturity)
  );
};

const getInstallModes = (installArray: { mode: string }[]): EOSInstallMode[] =>
  installArray.map(install => {
    if (install.mode === 'Install doc') {
      return EOSInstallMode.installDoc;
    }
    if (install.mode === 'Easy Installer') {
      return EOSInstallMode.easyInstaller;
    }
    if (install.mode === '/e/ smartphones' || install.mode === 'Murena smartphones') {
      return EOSInstallMode.eSmartphones;
    }
    if (install.mode === 'Roll-back') {
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

    const maturity = deviceInfo.maturity;
    if (!shouldIncludeDevice(maturity)) {
      logger.debug(`[EOS] Excluding device due to maturity level ${maturity}: ${deviceInfoFilename}`);
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
        maturity,
        installModes: getInstallModes(deviceInfo.install),
        models: deviceInfo.models,
        url: `${E_OS_BASE_DEVICE_URL}/${codename}`,
      },
    };
  });

  return codenameToDeviceSummary;
}
