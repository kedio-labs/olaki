import logger from '../logger';
import extractCDroidDeviceSummaries from './cdroid';
import extractEOsDeviceSummaries from './eos';
import extractKaliDeviceSummaries from './kali';
import extractLineageOsDeviceSummaries from './lineageos';
import { CodenameToDeviceSummary, DeviceSummaryOSSpecific, JsonResult } from './model';
import extractOmniRomDeviceSummaries from './omnirom';
import extractPmOsDeviceSummaries from './pmos';
import extractResurrectionRemixDeviceSummaries from './resurrectionremix';
import extractUbuntuTouchDeviceSummaries from './ubuntutouch';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

const JSON_RESULT_DIRECTORY = './dist/public';
const JSON_RESULT_FILENAME = 'device-summaries.json';
const JSON_RESULT_FILE_PATH = `${JSON_RESULT_DIRECTORY}/${JSON_RESULT_FILENAME}`;

const saveResult = (overallCodenameToDeviceSummary: CodenameToDeviceSummary) => {
  logger.info(`[Extractor] Writing results into file: ${JSON_RESULT_FILE_PATH}`);
  const jsonResult: JsonResult = {
    lastUpdated: new Date().getTime(),
    codenameToDeviceSummary: overallCodenameToDeviceSummary,
  };

  if (!existsSync(JSON_RESULT_DIRECTORY)) {
    mkdirSync(JSON_RESULT_DIRECTORY, { recursive: true });
  }
  writeFileSync(JSON_RESULT_FILE_PATH, JSON.stringify(jsonResult, null, ' '));
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

logger.info('[Extractor] cDroid: Extracting device summaries');
const cDroidPromise = extractCDroidDeviceSummaries().then(deviceSummaries => {
  logger.info('[Extractor] cDroid: Successfully extracted device summaries. Merging into overall result.');
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

Promise.all([cDroidPromise, ubuntuTouchPromise, omniromPromise, resurrectionRemixPromise, kaliPromise])
  .then(
    ([
      cDroidDeviceSummaries,
      ubuntuTouchDeviceSummaries,
      omniromDeviceSummaries,
      resurrectionRemixDeviceSummaries,
      kaliDeviceSummaries,
    ]) => {
      mergeIntoOverallCodenameToDeviceSummary(overallCodenameToDeviceSummary, cDroidDeviceSummaries, 'cDroid');

      mergeIntoOverallCodenameToDeviceSummary(overallCodenameToDeviceSummary, ubuntuTouchDeviceSummaries, 'ubuntuTouch');

      mergeIntoOverallCodenameToDeviceSummary(overallCodenameToDeviceSummary, omniromDeviceSummaries, 'omnirom');

      mergeIntoOverallCodenameToDeviceSummary(
        overallCodenameToDeviceSummary,
        resurrectionRemixDeviceSummaries,
        'resurrectionRemix'
      );

      mergeIntoOverallCodenameToDeviceSummary(overallCodenameToDeviceSummary, kaliDeviceSummaries, 'kali');

      saveResult(overallCodenameToDeviceSummary);
    }
  )
  .catch(e => logger.error(e));
