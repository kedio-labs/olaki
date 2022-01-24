import logger from '../../logger';
import { CodenameToDeviceSummary } from './model';
import { capitalise, normaliseCodename, removeVendorPrefixFromModelAndTrim } from './util';
import { readFileSync } from 'fs';
import { load } from 'js-yaml';

const UTF_8 = 'utf8';
const DEVICES_FILE = './submodules/calyxos.org/pages/_data/devices.yml';
const CALYX_OS_BASE_DEVICE_URL = 'https://calyxos.org/install/devices';

const getVendor = (brand: string) => {
  if (brand.toLowerCase() === 'pixel') {
    return 'Google';
  }

  return capitalise(brand);
};

export default function extractCalyxOsDeviceSummaries(): CodenameToDeviceSummary {
  const codenameToDeviceSummary: CodenameToDeviceSummary = {};

  logger.debug(`[CALYXOS] Reading content of file ${DEVICES_FILE}`);

  const devicesFileContent: string = readFileSync(DEVICES_FILE, UTF_8);
  const devices: any = load(devicesFileContent, { json: true }) as any;

  devices.codenames.forEach((codename: string) => {
    logger.debug(`[CALYXOS] Processing codename ${codename}`);
    const device = devices[codename];
    const vendor = getVendor(device.brand);
    codenameToDeviceSummary[normaliseCodename(codename)] = {
      codename,
      vendor: vendor,
      name: removeVendorPrefixFromModelAndTrim(vendor, device.model),
      calyxos: {
        url: `${CALYX_OS_BASE_DEVICE_URL}/${codename}`,
      },
    };
  });

  return codenameToDeviceSummary;
}
