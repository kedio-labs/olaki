import appConfig from '../../../appConfig.json';
import logger from '../../logger';
import { CodenameToDeviceSummary, DeviceSummary } from './model';
import { fetchUrl, normaliseCodename, removeVendorPrefixFromModelAndTrim } from './util';
import { AxiosResponse } from 'axios';
import { load } from 'cheerio';
import { Element } from 'domhandler/lib/node';
import { readFileSync } from 'fs';

const UTF_8 = 'utf8';
const DEVICE_MAINTAINERS_FRAGMENT_XML_FILE_PATH =
  './submodules/Resurrection_packages_apps_Settings/res/xml/device_maintainers_fragment.xml';
const DEVICE_MAINTAINERS_XML_FILE_PATH =
  './submodules/Resurrection_packages_apps_Settings/res/values/resurrection_device_maintainers_strings.xml';
const DOWNLOAD_URL = 'https://get.resurrectionremix.com/';

const normaliseDeviceKey = (deviceKey: string) => deviceKey.toLowerCase().trim();

const hasVendorAttrib = (nameAttrib: string) => nameAttrib.includes('device_category');
const getDeviceKey = (nameAttrib: string) =>
  nameAttrib.replace('device_', '').replace('_codename', '').replace('_maintainer', '');
const isDeviceModel = (nameAttrib: string) => !(nameAttrib.includes('_codename') || nameAttrib.includes('_maintainer'));
const isCodename = (nameAttrib: string) => nameAttrib.includes('_codename');

// some codenames are funky, e.g.:
// Find 7a
// All klte variants
// spyder GSM-CDMA
// GT-I9195 / GT-I9190
// hlte/hltechn/hltekor/hltetmo
const isFunkyCodename = (codename: string) => codename.includes('-') || codename.includes(' ') || codename.includes('/');
const isMaintainer = (nameAttrib: string) => nameAttrib.includes('_maintainer');
const isMaintained = (elementText: string) => elementText.trim().length > 0;

const shouldIncludeDevice = (codename: string, deviceSummary: DeviceSummary) =>
  !isFunkyCodename(codename) &&
  ((deviceSummary.resurrectionRemix?.isMaintained && appConfig.resurrectionRemix.includeMaintained) ||
    (!deviceSummary.resurrectionRemix?.isMaintained && appConfig.resurrectionRemix.includeUnmaintained));

// use response.request.res.responseUrl as it represents the final value after axios has followed redirects
const getDownloadUrl = (response: AxiosResponse, codename: string) => `${response.request.res.responseUrl}${codename}`;

export default async function extractResurrectionRemixDeviceSummaries(): Promise<CodenameToDeviceSummary> {
  const deviceKeyToVendorKey: { [k: string]: string } = {};
  const vendorKeyToVendorName: { [k: string]: string } = {};
  const deviceKeyToDeviceSummary: {
    [k: string]: DeviceSummary;
  } = {};

  logger.debug('[RESURRECTIONREMIX] Getting device metadata');
  const deviceMaintainersFragmentXml = readFileSync(DEVICE_MAINTAINERS_FRAGMENT_XML_FILE_PATH, UTF_8);
  let $ = load(deviceMaintainersFragmentXml, { xmlMode: true });
  $('PreferenceScreen PreferenceCategory')
    .filter((index, category) => !category.attribs['android:id'].includes('device_category_generic'))
    .each((index, category) => {
      const vendorKey = category.attribs['android:id'].replace('@+id/', '');
      category.children
        .filter(child => child.type === 'tag')
        .forEach(child => {
          const deviceKey = (child as Element).attribs['android:id'].replace('@+id/device_', '');
          deviceKeyToVendorKey[normaliseDeviceKey(deviceKey)] = vendorKey;
        });
    });

  logger.debug('[RESURRECTIONREMIX] Getting devices info');
  const deviceMaintainersXml = readFileSync(DEVICE_MAINTAINERS_XML_FILE_PATH, UTF_8);
  $ = load(deviceMaintainersXml, { xmlMode: true });
  $('string')
    .filter((index, element) => !element.attribs['name'].includes('_generic'))
    .each((index, element) => {
      const nameAttrib = element.attribs['name'];
      if (hasVendorAttrib(nameAttrib)) {
        vendorKeyToVendorName[nameAttrib.replace('_title', '')] = $(element).text().trim();
      } else {
        const elementText = $(element).text();
        const deviceKey = getDeviceKey(nameAttrib);
        const normalisedDeviceKey = normaliseDeviceKey(deviceKey);
        if (!deviceKeyToDeviceSummary[normalisedDeviceKey]) {
          deviceKeyToDeviceSummary[normalisedDeviceKey] = {
            codename: '',
            vendor: vendorKeyToVendorName[deviceKeyToVendorKey[normalisedDeviceKey]],
          } as DeviceSummary;
        }
        if (isDeviceModel(nameAttrib)) {
          deviceKeyToDeviceSummary[normalisedDeviceKey].name = removeVendorPrefixFromModelAndTrim(
            deviceKeyToDeviceSummary[normalisedDeviceKey].vendor,
            elementText
          );
        } else if (isCodename(nameAttrib)) {
          deviceKeyToDeviceSummary[normalisedDeviceKey].codename = normaliseCodename(elementText);
        } else if (isMaintainer(nameAttrib)) {
          deviceKeyToDeviceSummary[normalisedDeviceKey].resurrectionRemix = {
            isMaintained: isMaintained(elementText),
          };
        }
      }
    });

  const codenameToDeviceSummary: CodenameToDeviceSummary = {};
  for (const deviceKey in deviceKeyToDeviceSummary) {
    const codename = deviceKeyToDeviceSummary[deviceKey].codename;
    const deviceSummary = deviceKeyToDeviceSummary[deviceKey];
    if (shouldIncludeDevice(codename, deviceSummary)) {
      codenameToDeviceSummary[codename] = deviceSummary;
    } else {
      logger.debug(`[RESURRECTIONREMIX] Excluding codename: ${codename}`);
    }
  }

  logger.debug('[RESURRECTIONREMIX] Scraping resurrection remix downloads page');
  const response = await fetchUrl('[RESURRECTIONREMIX]', DOWNLOAD_URL);
  $ = load(response.data);
  $('table#files_list > tbody > tr > th > a').each((index, aElement) => {
    const href = aElement.attribs['href'];
    const codename =
      href
        .split('/')
        .filter(t => t.trim() !== '')
        .pop() || '';

    const normalisedCodename = normaliseCodename(codename);
    if (codenameToDeviceSummary[normalisedCodename]) {
      if (!codenameToDeviceSummary[normalisedCodename].resurrectionRemix) {
        throw new Error(
          `[RESURRECTIONREMIX] ERROR - Found device summary without property resurrectionRemix: ${codenameToDeviceSummary[normalisedCodename]}`
        );
      }

      // @ts-ignore: TypeScript compiler sees that resurrectionRemix is an optional property
      // it doesn't pick up the fact that we have actually instantiated it earlier when parsing DEVICE_MAINTAINERS_XML_FILE_PATH
      codenameToDeviceSummary[normalisedCodename].resurrectionRemix.url = getDownloadUrl(response, codename);
    }
  });

  if (!appConfig.resurrectionRemix.includeMissingImageDownloadLink) {
    for (const codename in codenameToDeviceSummary) {
      if (!codenameToDeviceSummary[codename].resurrectionRemix?.url) {
        logger.debug(`[RESURRECTIONREMIX] Excluding codename as it has no download link: ${codename}`);
        delete codenameToDeviceSummary[codename];
      }
    }
  }

  return codenameToDeviceSummary;
}
