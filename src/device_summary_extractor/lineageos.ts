import { load } from 'js-yaml';
import { readdirSync, readFileSync } from 'fs';
import { CodenameToDeviceSummary } from './model';
import appConfig from '../../appConfig.json';
import logger from '../logger';
import { normaliseCodename } from './util';

const UTF_8 = 'utf8';
const DEVICE_INFO_ROOT_DIRECTORY = './lineage_wiki/_data/devices';

const shouldIncludeDevice = (isMaintained: boolean) => isMaintained || (!isMaintained && appConfig.lineageOs.includeUnmaintained);

const getReleaseDate = (release: any) => (Array.isArray(release) ? Object.values(release[0])[0] : release);

export default function extractLineageOsDeviceSummaries(): CodenameToDeviceSummary {
  const codenameToDeviceSummary: CodenameToDeviceSummary = {};

  const deviceInfoFilenames = readdirSync(DEVICE_INFO_ROOT_DIRECTORY);

  deviceInfoFilenames.forEach(deviceInfoFilename => {
    const filePath = `${DEVICE_INFO_ROOT_DIRECTORY}/${deviceInfoFilename}`;

    logger.debug(`[LNOS] Reading content of file ${filePath}`);

    const deviceInfoFileContent: string = readFileSync(filePath, UTF_8);
    const deviceInfo: any = load(deviceInfoFileContent, { json: true }) as any;

    const isMaintained = deviceInfo.maintainers.length > 0;
    if (shouldIncludeDevice(isMaintained)) {
      const codename = normaliseCodename(deviceInfo.codename);

      logger.debug(`[LNOS] Processing codename ${codename}`);

      codenameToDeviceSummary[codename] = {
        name: deviceInfo.name,
        vendor: deviceInfo.vendor,
        releaseDate: getReleaseDate(deviceInfo.release),
        lineageOs: {
          versions: deviceInfo.versions,
          models: deviceInfo.models || [],
          isMaintained: isMaintained,
        },
      };
    }
  });

  return codenameToDeviceSummary;
}
