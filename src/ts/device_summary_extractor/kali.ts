import appConfig from '../../../appConfig.json';
import logger from '../../logger';
import { CodenameToDeviceSummary } from './model';
import { fetchUrl, normaliseCodename } from './util';
import { load } from 'cheerio';

const KALI_DEVICES_LIST_URL = 'https://stats.nethunter.com/nethunter-images.html';
const KALI_MOBILE_DOWNLOAD_URL = 'https://www.kali.org/get-kali/#kali-mobile';

const extractDeviceVendorAndName = (codename: string, deviceName: string) => {
  // device names from the device list include OS info
  // e.g. Nexus 6P (LineageOS 17.1)
  // let's remove that
  const sanitisedDeviceName = deviceName.replace(/\(.+\)/, '').trim();

  if (sanitisedDeviceName.toLowerCase().includes('nexus')) {
    return {
      vendor: 'Google',
      name: sanitisedDeviceName,
    };
  }

  // device: Pocophone F1
  if (codename === 'beryllium') {
    return {
      vendor: 'Xiaomi',
      name: sanitisedDeviceName,
    };
  }

  // device: TicWatch Pro
  if (codename === 'catfish') {
    return {
      vendor: 'Mobvoi',
      name: sanitisedDeviceName,
    };
  }

  // gts4llte: Galaxy Tab S4 LTE
  // gts4lwifi: Galaxy Tab S4 WiFi
  if (codename === 'gts4llte' || codename === 'gts4lwifi') {
    return {
      vendor: 'Samsung',
      name: sanitisedDeviceName,
    };
  }

  const splitBySpace = sanitisedDeviceName.split(' ');
  return {
    vendor: splitBySpace.shift() || '',
    name: splitBySpace.join(' '),
  };
};

const normaliseStatus = (status: string) => status.toLowerCase().trim();

enum Status {
  Stable = 'stable',
  Latest = 'latest',
}

export default async function extractKaliDeviceSummaries(): Promise<CodenameToDeviceSummary> {
  const codenameToDeviceSummary: CodenameToDeviceSummary = {};
  const response = await fetchUrl('[KALI]', KALI_DEVICES_LIST_URL);

  logger.debug('[KALI] Scraping kali devices list');
  const $ = load(response.data);

  $('tr').each((index, trElement) => {
    // rows on the devices list page are of the form
    // | Display Name (Android OS) | codename   | ignore     | ignore      | Status | ignore         |
    // | Nexus 5 (Marshmallow)     | hammerhead | hammerhead | marshmallow | Stable | Nexmon support |
    // see https://gitlab.com/kalilinux/nethunter/build-scripts/kali-nethunter-devices/-/blob/master/scripts/generate_images_table.py

    // codename
    const codename: string = $($(trElement).find('td').get(1)).text();
    const normalisedCodename = normaliseCodename(codename);

    // device name may include vendor name
    const status: string = normaliseStatus($($(trElement).find('td').get(4)).text());

    if (
      (status === Status.Stable && appConfig.kali.includeStable) ||
      // the devices list may contain multiple entries for the same codename (one for "stable" and another one for "latest")
      // only include the stable one in that scenario
      (status === Status.Latest && appConfig.kali.includeLatest && !codenameToDeviceSummary[normalisedCodename])
    ) {
      // device name may include vendor name
      const deviceName: string = $($(trElement).find('td').get(0)).text();

      const vendorAndName = extractDeviceVendorAndName(normalisedCodename, deviceName);

      codenameToDeviceSummary[normalisedCodename] = {
        codename: normalisedCodename,
        vendor: vendorAndName.vendor,
        name: vendorAndName.name,
        kali: {
          url: KALI_MOBILE_DOWNLOAD_URL,
          isStable: status === Status.Stable,
          isLatest: status === Status.Latest,
        },
      };
    } else {
      logger.debug(`[KALI] Excluding codename: ${normalisedCodename} with status: ${status}`);
    }
  });

  return codenameToDeviceSummary;
}
