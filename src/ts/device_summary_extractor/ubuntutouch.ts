import appConfig from '../../../appConfig.json';
import logger from '../../logger';
import { CodenameToDeviceSummary } from './model';
import vendorList from './ubuntutouch_vendors.json';
import { fetchUrl, normaliseCodename, removeVendorPrefixFromModelAndTrim } from './util';
import { load } from 'cheerio';

const UBUNTU_TOUCH_BASE_URL = 'https://devices.ubuntu-touch.io';

const getDeviceUrl = (codename: string) => `${UBUNTU_TOUCH_BASE_URL}/device/${codename}`;

const extractDeviceVendorAndName = (codename: string, text: string) => {
  if (codename === 'axolotl') {
    // device: SHIFT6mq
    return {
      vendor: 'SHIFT',
      name: text,
    };
  }
  if (codename === 'flo') {
    // device: Nexus 7 2013 WiFi
    return {
      vendor: 'Google',
      name: text,
    };
  }
  if (codename.startsWith('pine')) {
    // devices: Pinebook, Pinephone, Pinetab
    return {
      vendor: 'Pine64',
      name: text,
    };
  }
  if (codename === 'titan') {
    return {
      // device: Moto G (2014)
      vendor: 'Motorola',
      name: text,
    };
  }
  if (codename === 'yggdrasil' || codename === 'yggdrasilx') {
    // devices: Volla Phone, Volla Phone X
    return {
      // device: Moto G (2014)
      vendor: 'Volla',
      name: text,
    };
  }
  if (codename === 'zuk_z2_plus') {
    return {
      // device: Zuk z2 Plus
      vendor: 'Lenovo',
      name: text,
    };
  }

  const maybeVendor = vendorList.find(vendor => text.toLowerCase().startsWith(vendor.toLowerCase()));
  if (maybeVendor) {
    return {
      vendor: maybeVendor,
      name: removeVendorPrefixFromModelAndTrim(maybeVendor, text),
    };
  }

  return {
    vendor: text,
    name: text,
  };
};

const shouldIncludeDevice = (progress: number) => progress >= appConfig.ubuntutouch.includeProgressLevelAboveThreshold;

export default async function extractUbuntuTouchDeviceSummaries(): Promise<CodenameToDeviceSummary> {
  const codenameToDeviceSummary: CodenameToDeviceSummary = {};

  const response = await fetchUrl('[UBTOUCH]', UBUNTU_TOUCH_BASE_URL);

  logger.debug('[UBTOUCH] Scraping ubuntu touch devices page');
  const $ = load(response.data);
  $(`li[data-release="${appConfig.ubuntutouch.currentRelease}"]`)
    .get()
    .forEach(liElement => {
      const li = $($(liElement));
      const codename: string = li.attr('data-codename')?.replaceAll(`@${appConfig.ubuntutouch.currentRelease}`, '') || '';

      const normalisedCodename = normaliseCodename(codename);

      const deviceVendorAndNameCandidates: string = li.attr('data-name') || '';
      const progress: string = li.attr('data-progress') || '';

      if (!normalisedCodename) {
        logger.error(`[UBTOUCH] ERROR - Found device without codename: ${deviceVendorAndNameCandidates}`);
        return;
      }

      logger.debug(`[UBTOUCH] Processing codename: ${normalisedCodename}`);

      // do not process Raspberry Pi or Desktop PC
      if (normalisedCodename === 'rpi' || normalisedCodename === 'x86') {
        logger.debug(`[UBTOUCH] Excluding codename: ${normalisedCodename}`);
        return;
      }

      const progressAsNumber = +progress;

      if (shouldIncludeDevice(progressAsNumber)) {
        const deviceVendorAndName = extractDeviceVendorAndName(normalisedCodename, deviceVendorAndNameCandidates);

        codenameToDeviceSummary[normalisedCodename] = {
          codename: normalisedCodename,
          vendor: deviceVendorAndName.vendor,
          name: deviceVendorAndName.name,
          ubuntutouch: {
            progress: progressAsNumber,
            url: getDeviceUrl(normalisedCodename),
          },
        };
      } else {
        logger.debug(
          `[UBTOUCH] Excluding codename with progress level lower than threshold: ${normalisedCodename}. Progress level: ${progressAsNumber}. Threshold: ${appConfig.ubuntutouch.includeProgressLevelAboveThreshold}`,
        );
      }
    });

  return codenameToDeviceSummary;
}
