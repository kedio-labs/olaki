import appConfig from '../../appConfig.json';
import logger from '../logger';
import { CodenameToDeviceSummary } from './model';
import vendorList from './ubuntutouch_vendors.json';
import { normaliseCodename } from './util';
import axios from 'axios';
import { load } from 'cheerio';

const UBUNTU_TOUCH_BASE_URL = 'https://devices.ubuntu-touch.io';

const extractCodenameFromHref = (href: string) => href.replaceAll('/device/', '').replaceAll('/', '');
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
      name: text.replace(maybeVendor, '').trim(),
    };
  }

  return {
    vendor: text,
    name: text,
  };
};

const shouldIncludeDevice = (progress: number) => progress >= appConfig.ubuntuTouch.includeProgressLevelAboveThreshold;

export default async function extractUbuntuTouchDeviceSummaries(): Promise<CodenameToDeviceSummary> {
  const codenameToDeviceSummary: CodenameToDeviceSummary = {};
  const response = await axios.get(`${UBUNTU_TOUCH_BASE_URL}`);

  if (response.status !== 200) {
    throw new Error(
      `[UBTOUCH] ERROR - Received non-200 status code when retrieving codenames list from URL ${UBUNTU_TOUCH_BASE_URL}: ${response.status}\n ${response.data}`
    );
  }

  logger.debug('[UBTOUCH] Scraping ubuntu touch devices page');
  const $ = load(response.data);
  $('li.device-name > a')
    .get()
    .forEach(aElement => {
      const href: string = $($(aElement)).attr('href') || '';
      const title: string = $($(aElement)).attr('title') || '';

      const codename = normaliseCodename(extractCodenameFromHref(href));
      const [deviceVendorAndNameCandidates, progress] = title
        .replaceAll('%', '')
        .split('- Progress:')
        .map(s => s.trim());

      if (!codename) {
        logger.error(`[PMOS] ERROR - Found device without codename: ${title}`);
        return;
      }

      logger.debug(`[UBTOUCH] Processing codename: ${codename}`);

      // do not process Raspberry Pi or Desktop PC
      if (codename === 'rpi' || codename === 'x86') {
        logger.debug(`[UBTOUCH] Excluding codename: ${codename}`);
        return;
      }

      const progressAsNumber = +progress;

      if (shouldIncludeDevice(progressAsNumber)) {
        const deviceVendorAndName = extractDeviceVendorAndName(codename, deviceVendorAndNameCandidates);

        codenameToDeviceSummary[codename] = {
          vendor: deviceVendorAndName.vendor,
          name: deviceVendorAndName.name,
          ubuntuTouch: {
            progress: progressAsNumber,
            url: getDeviceUrl(codename),
          },
        };
      } else {
        logger.debug(
          `[UBTOUCH] Excluding codename with progress level lower than threshold: ${codename}. Progress level: ${progressAsNumber}. Threshold: ${appConfig.ubuntuTouch.includeProgressLevelAboveThreshold}`
        );
      }
    });

  return codenameToDeviceSummary;
}
