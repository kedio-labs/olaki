import appConfig from '../../../appConfig.json';
import logger from '../../logger';
import { CodenameToDeviceSummary } from './model';
import { fetchUrl, normaliseCodename } from './util';

type AndroidVersion = string;
type DeviceId = string;
type DeviceIdToAndroidVersion = { [k: DeviceId]: AndroidVersion };
type DeviceIdToProperties = { [k: DeviceId]: DeviceIdProperties };
type DeviceIdProperties = { id: string; state: string };
type DeviceInfo = {
  model: string;
  pageUrl: string;
  make: string;
  image: string;
  state: string;
  device: string;
};

enum DeviceState {
  Official = 'official',
  Unofficial = 'unofficial',
}

const DEVICES_LIST_BASE_URL = 'https://gerrit.omnirom.org/projects';
const AVAILABLE_ANDROID_VERSIONS_DESCENDING_ORDER = ['12.0', '11', '10']; // note android 12.0 instead of 12

const getDevicesListUrl = (androidVersion: AndroidVersion) =>
  `${DEVICES_LIST_BASE_URL}/?b=android-${androidVersion}&p=android_device`;
const fetchDevicesList = async (
  androidVersion: AndroidVersion
): Promise<{ data: DeviceIdToProperties; androidVersion: AndroidVersion }> => {
  const url = getDevicesListUrl(androidVersion);
  const response = await fetchUrl('[OMNIDROID]', url);

  // need to sanitise a bit the response data as it somehow starts with )]}'\n
  const data = response.data.substring(response.data.indexOf('{'));
  return { data: JSON.parse(data), androidVersion };
};

const getDeviceInfoUrl = (deviceId: DeviceId, androidVersion: AndroidVersion) =>
  `https://raw.githubusercontent.com/omnirom/${deviceId}/android-${androidVersion}/meta/config.json`;
const fetchDeviceInfo = async (deviceId: DeviceId, androidVersion: AndroidVersion): Promise<DeviceInfo> => {
  const url = getDeviceInfoUrl(deviceId, androidVersion);
  const response = await fetchUrl('[OMNIDROID]', url, {
    validateStatus: status => status < 500, // include 4xx in success responses so that we can process them
  });

  if (response.status === 404) {
    return {} as DeviceInfo;
  }

  return response.data;
};

const getDevicesPageForAndroidVersion = (androidVersion: AndroidVersion): string => {
  const formattedAndroidVersion = androidVersion.replaceAll('.', '_');
  return `https://omnirom.org/#devices/android-${formattedAndroidVersion}`;
};

const shouldIncludeDevice = (deviceInfo: DeviceInfo) =>
  (deviceInfo.state === DeviceState.Official && appConfig.omnirom.includeOfficial) ||
  (deviceInfo.state === DeviceState.Unofficial && appConfig.omnirom.includeUnofficial);

export default async function extractOmniRomDeviceSummaries(): Promise<CodenameToDeviceSummary> {
  const codenameToDeviceSummary: CodenameToDeviceSummary = {};

  logger.debug('[OMNIDROID] Getting list of all available device ids');
  const devicesListPromises = AVAILABLE_ANDROID_VERSIONS_DESCENDING_ORDER.map(fetchDevicesList);

  // do not catch errors here so that they get propagated
  const deviceIdToAndroidVersion: DeviceIdToAndroidVersion = await Promise.all(devicesListPromises).then(
    (devicesLists: Awaited<{ data: DeviceIdToProperties; androidVersion: AndroidVersion }>[]) => {
      const deviceIdToAndroidVersion: DeviceIdToAndroidVersion = {};

      const isActiveAndNotAvailableForLaterVersion = (
        devicesList: Awaited<{ data: DeviceIdToProperties; androidVersion: AndroidVersion }>,
        deviceId: DeviceId
      ) => devicesList.data[deviceId].state === 'ACTIVE' && !deviceIdToAndroidVersion[deviceId];

      devicesLists.forEach(devicesList => {
        for (const deviceId in devicesList.data) {
          if (isActiveAndNotAvailableForLaterVersion(devicesList, deviceId)) {
            deviceIdToAndroidVersion[devicesList.data[deviceId].id] = devicesList.androidVersion;
          }
        }
      });

      return deviceIdToAndroidVersion;
    }
  );

  logger.debug('[OMNIDROID] Fetching device codenames');
  for (const deviceId in deviceIdToAndroidVersion) {
    const androidVersion: string = deviceIdToAndroidVersion[deviceId];
    // await in a for loop works fine
    // see https://zellwk.com/blog/async-await-in-loops/
    const deviceInfo = await fetchDeviceInfo(deviceId, androidVersion);

    if (Object.keys(deviceInfo).length > 0 && shouldIncludeDevice(deviceInfo)) {
      const normalisedCodename = normaliseCodename(deviceInfo.device);
      codenameToDeviceSummary[normalisedCodename] = {
        codename: normalisedCodename,
        vendor: deviceInfo.make,
        name: deviceInfo.model,
        omnirom: {
          url: getDevicesPageForAndroidVersion(androidVersion),
          isOfficial: deviceInfo.state === DeviceState.Official,
        },
      };
    }
  }

  return codenameToDeviceSummary;
}
