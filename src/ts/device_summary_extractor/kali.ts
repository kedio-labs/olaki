import { CodenameToDeviceSummary } from './model';
import { fetchUrl, normaliseCodename } from './util';
import { load } from 'js-yaml';
import logger from '../../logger';
import appConfig from '../../../appConfig.json';

const KALI_DEVICES_FILE_URL =
  'https://gitlab.com/kalilinux/nethunter/build-scripts/kali-nethunter-kernels/-/raw/main/devices.yml';

const KALI_MOBILE_DOWNLOAD_URL = 'https://www.kali.org/get-kali/#kali-mobile';

const extractDeviceVendorAndName = (model: string) => {
  // device names from the device list include OS info
  // e.g. Nexus 6P (LineageOS 17.1)
  // let's remove that
  const sanitisedDeviceName = model.replace(/\(.+\)/, '').trim();

  const splitBySpace = sanitisedDeviceName.split(' ');
  return {
    vendor: splitBySpace.shift() || '',
    name: splitBySpace.join(' '),
  };
};

export default async function extractKaliDeviceSummaries(): Promise<CodenameToDeviceSummary> {
  logger.debug('[KALI] Scraping kali devices list');

  const codenameToDeviceSummary: CodenameToDeviceSummary = {};
  const response = await fetchUrl('[KALI]', KALI_DEVICES_FILE_URL);

  const codenameToDeviceArray: any = load(response.data, { json: true }) as any;

  codenameToDeviceArray.forEach((codenameToDevice: any) => {
    const codename: string = Object.keys(codenameToDevice)[0];
    const normalisedCodename = normaliseCodename(codename);

    const hasPreCreatedImages = !!codenameToDevice[codename].images;
    if (
      (hasPreCreatedImages && appConfig.kali.includePreCreatedImages) ||
      (!hasPreCreatedImages && appConfig.kali.includeImagesToSelfGenerate)
    ) {
      const deviceVendorAndName = extractDeviceVendorAndName(codenameToDevice[codename].model);
      codenameToDeviceSummary[normalisedCodename] = {
        codename: normalisedCodename,
        name: deviceVendorAndName.name,
        vendor: deviceVendorAndName.vendor,
        kali: {
          hasPreCreatedImages: hasPreCreatedImages,
          isSelfGeneratedImage: !hasPreCreatedImages,
          url: KALI_MOBILE_DOWNLOAD_URL,
        },
      };
    } else {
      logger.debug(`[KALI] Excluding codename: ${normalisedCodename} with flag hasPreCreatedImages: ${hasPreCreatedImages}`);
    }
  });

  return codenameToDeviceSummary;
}
