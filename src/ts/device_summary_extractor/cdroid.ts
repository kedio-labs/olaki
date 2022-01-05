import logger from '../../logger';
import { CodenameToDeviceSummary } from './model';
import { fetchUrl, normaliseCodename, removeVendorPrefixFromModelAndTrim } from './util';

const CDROID_BASE_URL = 'https://crdroid.net';
const CDROID_DEVICES_LIST_JSON_URL = `${CDROID_BASE_URL}/devices_handler/compiled.json`;

export default async function extractCDroidDeviceSummaries(): Promise<CodenameToDeviceSummary> {
  const codenameToDeviceSummary: CodenameToDeviceSummary = {};

  logger.debug('[CDROID] Discovering latest cDroid major version');
  let latestMajorVersion = Number.MIN_VALUE;
  const response = await fetchUrl('[CDROID]', CDROID_DEVICES_LIST_JSON_URL);
  const vendorToCodenames = response.data;
  for (const vendor in vendorToCodenames) {
    for (const codename in vendorToCodenames[vendor]) {
      for (const version in vendorToCodenames[vendor][codename]) {
        const versionAsNumber = +version;
        if (versionAsNumber > latestMajorVersion) {
          latestMajorVersion = versionAsNumber;
        }
      }
    }
  }
  logger.debug(`[CDROID] Latest cDroid major version is ${latestMajorVersion}`);

  logger.debug('[CDROID] Parsing list of cDroid devices');
  for (const vendor in vendorToCodenames) {
    for (const codename in vendorToCodenames[vendor]) {
      if (vendorToCodenames[vendor][codename][latestMajorVersion]) {
        const normalisedCodename = normaliseCodename(codename);
        codenameToDeviceSummary[normalisedCodename] = {
          codename: normalisedCodename,
          name: removeVendorPrefixFromModelAndTrim(vendor, vendorToCodenames[vendor][codename][latestMajorVersion].device),
          vendor: vendor,
          cDroid: {
            url: `${CDROID_BASE_URL}/${codename}/${latestMajorVersion}`,
          },
        };
      } else {
        logger.debug(
          `[CDROID] Excluding codename as there is no image available for latest major version ${latestMajorVersion}: ${codename}`
        );
      }
    }
  }

  return codenameToDeviceSummary;
}
