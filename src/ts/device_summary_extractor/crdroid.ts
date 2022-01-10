import logger from '../../logger';
import { CodenameToDeviceSummary } from './model';
import { fetchUrl, normaliseCodename, removeVendorPrefixFromModelAndTrim } from './util';

const CRDROID_BASE_URL = 'https://crdroid.net';
const CRDROID_DEVICES_LIST_JSON_URL = `${CRDROID_BASE_URL}/devices_handler/compiled.json`;

const IGNORE_VERSIONS = ['6'];

export default async function extractCrDroidDeviceSummaries(): Promise<CodenameToDeviceSummary> {
  const codenameToDeviceSummary: CodenameToDeviceSummary = {};

  logger.debug('[CRDROID] Discovering latest crDroid major version');
  const response = await fetchUrl('[CRDROID]', CRDROID_DEVICES_LIST_JSON_URL);
  const vendorToCodenames = response.data;

  logger.debug('[CRDROID] Parsing list of crDroid devices');
  for (const vendor in vendorToCodenames) {
    for (const codename in vendorToCodenames[vendor]) {
      const latestAvailableVersion = Object.keys(vendorToCodenames[vendor][codename]).sort().pop() as string;
      if (!IGNORE_VERSIONS.includes(latestAvailableVersion)) {
        const normalisedCodename = normaliseCodename(codename);
        codenameToDeviceSummary[normalisedCodename] = {
          codename: normalisedCodename,
          name: removeVendorPrefixFromModelAndTrim(vendor, vendorToCodenames[vendor][codename][latestAvailableVersion].device),
          vendor: vendor,
          crdroid: {
            url: `${CRDROID_BASE_URL}/${codename}/${latestAvailableVersion}`,
            latestAvailableVersion: +latestAvailableVersion,
          },
        };
      }
    }
  }

  return codenameToDeviceSummary;
}
