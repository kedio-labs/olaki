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
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';

const SRC_PUBLIC_DIRECTORY = './src/public';
const DIST_PUBLIC_DIRECTORY = './dist/public';
const JS_RESULT_FILENAME = 'olaki-data.js';
const INDEX_FILENAME = 'index.html';
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

const copyIndexFile = () => {
  copyFileSync(`${SRC_PUBLIC_DIRECTORY}/${INDEX_FILENAME}`, `${DIST_PUBLIC_DIRECTORY}/${INDEX_FILENAME}`);
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

logger.info('[Extractor] lineageos: Extracting device summaries');
const lineageosDeviceSummaries = extractLineageOsDeviceSummaries();
logger.info('[Extractor] lineageos: Successfully extracted device summaries. Merging into overall result.');
mergeIntoOverallCodenameToDeviceSummary(overallCodenameToDeviceSummary, lineageosDeviceSummaries, 'lineageos');

logger.info('[Extractor] postmarketOs: Extracting device summaries');
const pmOsDeviceSummaries = extractPmOsDeviceSummaries();
logger.info('[Extractor] postmarketOs: Successfully extracted device summaries. Merging into overall result.');
mergeIntoOverallCodenameToDeviceSummary(overallCodenameToDeviceSummary, pmOsDeviceSummaries, 'pmos');

logger.info('[Extractor] /e/OS: Extracting device summaries');
const eOsDeviceSummaries = extractEOsDeviceSummaries();
logger.info('[Extractor] /e/OS: Successfully extracted device summaries. Merging into overall result.');
mergeIntoOverallCodenameToDeviceSummary(overallCodenameToDeviceSummary, eOsDeviceSummaries, 'eos');

logger.info('[Extractor] crDroid: Extracting device summaries');
const crDroidPromise = extractCrDroidDeviceSummaries().then(deviceSummaries => {
  logger.info('[Extractor] crDroid: Successfully extracted device summaries. Merging into overall result.');
  return deviceSummaries;
});

logger.info('[Extractor] ubuntutouch: Extracting device summaries');
const ubuntuTouchPromise = extractUbuntuTouchDeviceSummaries().then(deviceSummaries => {
  logger.info('[Extractor] ubuntutouch: Successfully extracted device summaries. Merging into overall result.');
  return deviceSummaries;
});

logger.info('[Extractor] omnirom: Extracting device summaries');
const omniromPromise = extractOmniRomDeviceSummaries().then(deviceSummaries => {
  logger.info('[Extractor] omnirom: Successfully extracted device summaries. Merging into overall result.');
  return deviceSummaries;
});

logger.info('[Extractor] resurrectionremix: Extracting device summaries');
const resurrectionremixPromise = extractResurrectionRemixDeviceSummaries().then(deviceSummaries => {
  logger.info('[Extractor] resurrectionremix: Successfully extracted device summaries. Merging into overall result.');
  return deviceSummaries;
});

logger.info('[Extractor] kali: Extracting device summaries');
const kaliPromise = extractKaliDeviceSummaries().then(deviceSummaries => {
  logger.info('[Extractor] kali: Successfully extracted device summaries. Merging into overall result.');
  return deviceSummaries;
});

Promise.all([crDroidPromise, ubuntuTouchPromise, omniromPromise, resurrectionremixPromise, kaliPromise])
  .then(
    ([
      crdroidDeviceSummaries,
      ubuntutouchDeviceSummaries,
      omniromDeviceSummaries,
      resurrectionremixDeviceSummaries,
      kaliDeviceSummaries,
    ]) => {
      mergeIntoOverallCodenameToDeviceSummary(overallCodenameToDeviceSummary, crdroidDeviceSummaries, 'crdroid');

      mergeIntoOverallCodenameToDeviceSummary(overallCodenameToDeviceSummary, ubuntutouchDeviceSummaries, 'ubuntutouch');

      mergeIntoOverallCodenameToDeviceSummary(overallCodenameToDeviceSummary, omniromDeviceSummaries, 'omnirom');

      mergeIntoOverallCodenameToDeviceSummary(
        overallCodenameToDeviceSummary,
        resurrectionremixDeviceSummaries,
        'resurrectionremix'
      );

      mergeIntoOverallCodenameToDeviceSummary(overallCodenameToDeviceSummary, kaliDeviceSummaries, 'kali');

      saveResultInJavaScriptFile(overallCodenameToDeviceSummary);
      copyIndexFile();
    }
  )
  .catch(e => logger.error(e));
