import appConfig from '../../../appConfig.json';
import logger from '../../logger';
import { CodenameToDeviceSummary, DeviceSummary } from './model';
import { normaliseCodename } from './util';
import { readdirSync, readFileSync, statSync } from 'fs';

const PMOS_WIKI_BASE_URL = 'https://wiki.postmarketos.org/wiki';

const UTF_8 = 'utf8';
const DEVICE_INFO_ROOT_DIRECTORY = './submodules/pmaports/device';
const DEVICE_INFO_FILENAME_PATTERN = 'deviceinfo';
const PMOS_CATEGORIES = {
  main: 'main',
  community: 'community',
  testing: 'testing',
  unmaintained: 'unmaintained',
  unknown: 'UNKNOWN_PMOS_CATEGORY',
};

const DEVICE_INFO_KEYS = {
  codename: 'deviceinfo_codename',
  manufacturer: 'deviceinfo_manufacturer',
  name: 'deviceinfo_name',
  year: 'deviceinfo_year',
};

const DEVICE_INFO_LINE_KEY_VALUE_SEPARATOR = '=';
const getDeviceInfoLineValue = (line: string) => line.split(DEVICE_INFO_LINE_KEY_VALUE_SEPARATOR)[1].replaceAll('"', '').trim();

// transforms 'xiaomi-beryllium' into 'beryllium'
const removeManufacturerPrefix = (codename: string) => codename.replace(/[^-]+-/, '');

const getPmosCategory = (deviceInfoFilePath: string) => {
  if (deviceInfoFilePath.includes(`/${PMOS_CATEGORIES.main}/`)) {
    return PMOS_CATEGORIES.main;
  }
  if (deviceInfoFilePath.includes(`/${PMOS_CATEGORIES.community}/`)) {
    return PMOS_CATEGORIES.community;
  }
  if (deviceInfoFilePath.includes(`/${PMOS_CATEGORIES.testing}/`)) {
    return PMOS_CATEGORIES.testing;
  }
  if (deviceInfoFilePath.includes(`/${PMOS_CATEGORIES.unmaintained}/`)) {
    return PMOS_CATEGORIES.unmaintained;
  }

  logger.error(`[PMOS] ERROR - Unknown category in filepath: ${deviceInfoFilePath}`);
  return PMOS_CATEGORIES.unknown;
};

const getDeviceInfoFilePaths = (directoryPath: string, arrayOfFiles: string[] = []) => {
  readdirSync(directoryPath).forEach(function (filename) {
    const filePath = `${directoryPath}/${filename}`;
    if (statSync(filePath).isDirectory()) {
      arrayOfFiles = getDeviceInfoFilePaths(filePath, arrayOfFiles);
    } else {
      if (filename === DEVICE_INFO_FILENAME_PATTERN) {
        arrayOfFiles.push(`${directoryPath}/${filename}`);
      }
    }
  });
  return arrayOfFiles;
};

const shouldIncludePmosCategory = (pmosCategory: string) => {
  return (
    (pmosCategory === PMOS_CATEGORIES.main && appConfig.pmos.includeMain) ||
    (pmosCategory === PMOS_CATEGORIES.community && appConfig.pmos.includeCommunity) ||
    (pmosCategory === PMOS_CATEGORIES.testing && appConfig.pmos.includeTesting) ||
    (pmosCategory === PMOS_CATEGORIES.unmaintained && appConfig.pmos.includeUnmaintained)
  );
};

const encodeToWikiUrlFormat = (text: string) => text.replaceAll(' ', '_').replaceAll(/[(|)]/g, '');

const getDeviceUrl = (rawCodename: string, deviceSummary: DeviceSummary) => {
  const formattedVendor = encodeToWikiUrlFormat(deviceSummary.vendor);
  const formattedName = encodeToWikiUrlFormat(deviceSummary.name);
  const formattedCodename = `(${rawCodename})`;
  const path = encodeURIComponent(`${formattedVendor}_${formattedName}_${formattedCodename}`);

  return `${PMOS_WIKI_BASE_URL}/${path}`;
};

export default function extractPmOsDeviceSummaries(): CodenameToDeviceSummary {
  const codenameToDeviceSummary: CodenameToDeviceSummary = {};

  const deviceInfoFilePaths = getDeviceInfoFilePaths(DEVICE_INFO_ROOT_DIRECTORY);
  deviceInfoFilePaths.forEach(deviceInfoFilePath => {
    logger.debug(`[PMOS] Reading content of file ${deviceInfoFilePath}`);

    const deviceInfoFileContent = readFileSync(`${deviceInfoFilePath}`, UTF_8);
    const pmosCategory = getPmosCategory(deviceInfoFilePath);

    if (shouldIncludePmosCategory(pmosCategory)) {
      const lines = deviceInfoFileContent.split(/\r?\n/);
      const deviceSummary = {} as DeviceSummary;
      let normalisedCodename = '';
      let rawCodename = '';
      lines.forEach(line => {
        if (line.includes(DEVICE_INFO_KEYS.codename)) {
          rawCodename = getDeviceInfoLineValue(line);
          normalisedCodename = normaliseCodename(removeManufacturerPrefix(rawCodename));
        } else if (line.includes(DEVICE_INFO_KEYS.manufacturer)) {
          deviceSummary.vendor = getDeviceInfoLineValue(line);
        } else if (line.includes(DEVICE_INFO_KEYS.name)) {
          deviceSummary.name = getDeviceInfoLineValue(line);
        } else if (line.includes(DEVICE_INFO_KEYS.year)) {
          deviceSummary.releaseDate = getDeviceInfoLineValue(line);
        }
      });

      if (normalisedCodename === '') {
        logger.error(
          `[PMOS] ERROR - Could not create device summary as codename absent in deviceinfo file ${deviceInfoFilePath}.`,
        );
      } else {
        logger.debug(`[PMOS] Adding codename ${normalisedCodename}`);

        deviceSummary.codename = normalisedCodename;

        // sanitise name
        if (deviceSummary.name.startsWith(deviceSummary.vendor)) {
          deviceSummary.name = deviceSummary.name.replace(deviceSummary.vendor, '').trim();
        }

        deviceSummary.pmos = {
          category: pmosCategory,
          url: getDeviceUrl(rawCodename, deviceSummary),
        };

        codenameToDeviceSummary[normalisedCodename] = deviceSummary;
      }
    }
  });

  return codenameToDeviceSummary;
}
