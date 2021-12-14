import { CodenameToDeviceSummary } from './model';
import axios from 'axios';
import { load } from 'cheerio';
import logger from '../logger';
import vendorList from './ubuntutouch_vendors.json';

const UBUNTU_TOUCH_BASE_URL = 'https://devices.ubuntu-touch.io';
// const UBUNTU_TOUCH_CODENAMES_LIST_URL = `${UBUNTU_TOUCH_BASE_URL}/about/codenames`;

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

      const codename = href.replaceAll('/device/', '').replaceAll('/', '');
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
        return;
      }

      const deviceVendorAndName = extractDeviceVendorAndName(codename, deviceVendorAndNameCandidates);

      codenameToDeviceSummary[codename] = {
        vendor: deviceVendorAndName.vendor,
        name: deviceVendorAndName.name,
        ubuntuTouch: {
          progress: +progress,
          url: `${UBUNTU_TOUCH_BASE_URL}${href}`,
        },
      };
    });

  return codenameToDeviceSummary;
}
