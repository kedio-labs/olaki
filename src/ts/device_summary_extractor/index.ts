import logger from '../../logger';
import extractCrDroidDeviceSummaries from './crdroid';
import extractEOsDeviceSummaries from './eos';
import extractKaliDeviceSummaries from './kali';
import extractLineageOsDeviceSummaries from './lineageos';
import { CodenameToDeviceSummary, DeviceSummaryOSSpecific, JsonResult } from './model';
import extractOmniRomDeviceSummaries from './omnirom';
import extractPmOsDeviceSummaries from './pmos';
import extractResurrectionRemixDeviceSummaries from './resurrectionremix';
import extractUbuntuTouchDeviceSummaries from './ubuntutouch';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

const DIST_PUBLIC_DIRECTORY = './dist/public';
const JS_RESULT_FILENAME = 'device-summaries.js';
const JS_RESULT_FILE_PATH = `${DIST_PUBLIC_DIRECTORY}/${JS_RESULT_FILENAME}`;

// save in JavaScript file so that it can be easily loaded in public/index.html
const saveResultInJavaScriptFile = (overallCodenameToDeviceSummary: CodenameToDeviceSummary) => {
  logger.info(`[Extractor] Writing results into file: ${JS_RESULT_FILE_PATH}`);

  // First, alphabetically sort devices
  const sortedDeviceSummaries = Object.keys(overallCodenameToDeviceSummary)
    .sort((codename1, codename2) => {
      const vendor1 = overallCodenameToDeviceSummary[codename1].vendor.toString().toLowerCase();
      const vendor2 = overallCodenameToDeviceSummary[codename2].vendor.toString().toLowerCase();

      const name1 = overallCodenameToDeviceSummary[codename1].name.toString().toLowerCase();
      const name2 = overallCodenameToDeviceSummary[codename2].name.toString().toLowerCase();

      if (vendor1 == vendor2) {
        if (name1 == name2) {
          return 0;
        }
        return name1 < name2 ? -1 : 1;
      }

      return vendor1 < vendor2 ? -1 : 1;
    })
    .map(codename => ({
      ...overallCodenameToDeviceSummary[codename],
      codename,
    }));

  const jsonResult: JsonResult = {
    lastUpdated: new Date().getTime(),
    deviceSummaries: sortedDeviceSummaries,
  };

  if (!existsSync(DIST_PUBLIC_DIRECTORY)) {
    mkdirSync(DIST_PUBLIC_DIRECTORY, { recursive: true });
  }
  const javaScriptFileContent = `const olakiData = ${JSON.stringify(jsonResult, null, ' ')};`;

  writeFileSync(JS_RESULT_FILE_PATH, javaScriptFileContent);
};

const mergeIntoOverallCodenameToDeviceSummary = (
  overallCodenameToDeviceSummary: CodenameToDeviceSummary,
  osCodenameToDeviceSummary: CodenameToDeviceSummary,
  osName: keyof DeviceSummaryOSSpecific
) => {
  for (const k in overallCodenameToDeviceSummary) {
    if (osCodenameToDeviceSummary[k]) {
      // @ts-ignore we know that we're not assigning apples to pears here
      overallCodenameToDeviceSummary[k][osName] = osCodenameToDeviceSummary[k][osName];
    }
    delete osCodenameToDeviceSummary[k];
  }

  Object.assign(overallCodenameToDeviceSummary, osCodenameToDeviceSummary);
};

const overallCodenameToDeviceSummary = {};

logger.info('[Extractor] lineageOs: Extracting device summaries');
const lineageOsDeviceSummaries = extractLineageOsDeviceSummaries();
logger.info('[Extractor] lineageOs: Successfully extracted device summaries. Merging into overall result.');
mergeIntoOverallCodenameToDeviceSummary(overallCodenameToDeviceSummary, lineageOsDeviceSummaries, 'lineageOs');

logger.info('[Extractor] postmarketOs: Extracting device summaries');
const pmOsDeviceSummaries = extractPmOsDeviceSummaries();
logger.info('[Extractor] postmarketOs: Successfully extracted device summaries. Merging into overall result.');
mergeIntoOverallCodenameToDeviceSummary(overallCodenameToDeviceSummary, pmOsDeviceSummaries, 'pmos');

logger.info('[Extractor] /e/OS: Extracting device summaries');
const eOsDeviceSummaries = extractEOsDeviceSummaries();
logger.info('[Extractor] /e/OS: Successfully extracted device summaries. Merging into overall result.');
mergeIntoOverallCodenameToDeviceSummary(overallCodenameToDeviceSummary, eOsDeviceSummaries, 'eOS');

logger.info('[Extractor] crDroid: Extracting device summaries');
const crDroidPromise = extractCrDroidDeviceSummaries().then(deviceSummaries => {
  logger.info('[Extractor] crDroid: Successfully extracted device summaries. Merging into overall result.');
  return deviceSummaries;
});

logger.info('[Extractor] ubuntuTouch: Extracting device summaries');
const ubuntuTouchPromise = extractUbuntuTouchDeviceSummaries().then(deviceSummaries => {
  logger.info('[Extractor] ubuntuTouch: Successfully extracted device summaries. Merging into overall result.');
  return deviceSummaries;
});

logger.info('[Extractor] omnirom: Extracting device summaries');
const omniromPromise = extractOmniRomDeviceSummaries().then(deviceSummaries => {
  logger.info('[Extractor] omnirom: Successfully extracted device summaries. Merging into overall result.');
  return deviceSummaries;
});

logger.info('[Extractor] resurrectionRemix: Extracting device summaries');
const resurrectionRemixPromise = extractResurrectionRemixDeviceSummaries().then(deviceSummaries => {
  logger.info('[Extractor] resurrectionRemix: Successfully extracted device summaries. Merging into overall result.');
  return deviceSummaries;
});

logger.info('[Extractor] kali: Extracting device summaries');
const kaliPromise = extractKaliDeviceSummaries().then(deviceSummaries => {
  logger.info('[Extractor] kali: Successfully extracted device summaries. Merging into overall result.');
  return deviceSummaries;
});

Promise.all([crDroidPromise, ubuntuTouchPromise, omniromPromise, resurrectionRemixPromise, kaliPromise])
  .then(
    ([
      crDroidDeviceSummaries,
      ubuntuTouchDeviceSummaries,
      omniromDeviceSummaries,
      resurrectionRemixDeviceSummaries,
      kaliDeviceSummaries,
    ]) => {
      mergeIntoOverallCodenameToDeviceSummary(overallCodenameToDeviceSummary, crDroidDeviceSummaries, 'crdroid');

      mergeIntoOverallCodenameToDeviceSummary(overallCodenameToDeviceSummary, ubuntuTouchDeviceSummaries, 'ubuntuTouch');

      mergeIntoOverallCodenameToDeviceSummary(overallCodenameToDeviceSummary, omniromDeviceSummaries, 'omnirom');

      mergeIntoOverallCodenameToDeviceSummary(
        overallCodenameToDeviceSummary,
        resurrectionRemixDeviceSummaries,
        'resurrectionRemix'
      );

      mergeIntoOverallCodenameToDeviceSummary(overallCodenameToDeviceSummary, kaliDeviceSummaries, 'kali');

      saveResultInJavaScriptFile(overallCodenameToDeviceSummary);
    }
  )
  .catch(e => logger.error(e));
