import logger from '../logger';
import extractCDroidDeviceSummaries from './cdroid';
import extractEOsDeviceSummaries from './eos';
import extractKaliDeviceSummaries from './kali';
import extractLineageOsDeviceSummaries from './lineageos';
import { CodenameToDeviceSummary, JsonResult } from './model';
import extractPmOsDeviceSummaries from './pmos';
import extractResurrectionRemixDeviceSummaries from './resurrectionremix';
import extractUbuntuTouchDeviceSummaries from './ubuntutouch';
import { writeFileSync } from 'fs';

const JSON_RESULT_FILE_PATH = './dist/device-summaries.json';

const saveResult = (overallCodenameToDeviceSummary: CodenameToDeviceSummary) => {
  logger.info(`[Extractor] Writing results into file: ${JSON_RESULT_FILE_PATH}`);
  const jsonResult: JsonResult = {
    lastUpdated: new Date().getTime(),
    codenameToDeviceSummary: overallCodenameToDeviceSummary,
  };
  writeFileSync(JSON_RESULT_FILE_PATH, JSON.stringify(jsonResult, null, ' '));
};

const mergeIntoOverallCodenameToDeviceSummary = (
  overallCodenameToDeviceSummary: CodenameToDeviceSummary,
  osCodenameToDeviceSummary: CodenameToDeviceSummary,
  osName: 'lineageOs' | 'pmos' | 'eos' | 'ubuntuTouch' | 'resurrectionRemix' | 'cDroid' | 'kali'
) => {
  for (const k in overallCodenameToDeviceSummary) {
    if (osCodenameToDeviceSummary[k]) {
      if (osName === 'lineageOs') {
        overallCodenameToDeviceSummary[k].lineageOs = osCodenameToDeviceSummary[k].lineageOs;
      } else if (osName === 'pmos') {
        overallCodenameToDeviceSummary[k].pmos = osCodenameToDeviceSummary[k].pmos;
      } else if (osName === 'eos') {
        overallCodenameToDeviceSummary[k].eOS = osCodenameToDeviceSummary[k].eOS;
      } else if (osName === 'ubuntuTouch') {
        overallCodenameToDeviceSummary[k].ubuntuTouch = osCodenameToDeviceSummary[k].ubuntuTouch;
      } else if (osName === 'resurrectionRemix') {
        overallCodenameToDeviceSummary[k].resurrectionRemix = osCodenameToDeviceSummary[k].resurrectionRemix;
      } else if (osName === 'cDroid') {
        overallCodenameToDeviceSummary[k].cDroid = osCodenameToDeviceSummary[k].cDroid;
      } else if (osName === 'kali') {
        overallCodenameToDeviceSummary[k].kali = osCodenameToDeviceSummary[k].kali;
      }
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
mergeIntoOverallCodenameToDeviceSummary(overallCodenameToDeviceSummary, eOsDeviceSummaries, 'eos');

logger.info('[Extractor] cDroid: Extracting device summaries');
const cDroidPromise = extractCDroidDeviceSummaries().then(cDroidDeviceSummaries => {
  logger.info('[Extractor] cDroid: Successfully extracted device summaries. Merging into overall result.');
  return cDroidDeviceSummaries;
});

logger.info('[Extractor] ubuntuTouch: Extracting device summaries');
const ubuntuTouchPromise = extractUbuntuTouchDeviceSummaries().then(ubuntuTouchDeviceSummaries => {
  logger.info('[Extractor] ubuntuTouch: Successfully extracted device summaries. Merging into overall result.');
  return ubuntuTouchDeviceSummaries;
});

logger.info('[Extractor] resurrectionRemix: Extracting device summaries');
const resurrectionRemixPromise = extractResurrectionRemixDeviceSummaries().then(resurrectionRemixDeviceSummaries => {
  logger.info('[Extractor] resurrectionRemix: Successfully extracted device summaries. Merging into overall result.');
  return resurrectionRemixDeviceSummaries;
});

logger.info('[Extractor] kali: Extracting device summaries');
const kaliPromise = extractKaliDeviceSummaries().then(kaliDeviceSummaries => {
  logger.info('[Extractor] kali: Successfully extracted device summaries. Merging into overall result.');
  return kaliDeviceSummaries;
});

Promise.all([cDroidPromise, ubuntuTouchPromise, resurrectionRemixPromise, kaliPromise])
  .then(([cDroidDeviceSummaries, ubuntuTouchDeviceSummaries, resurrectionRemixDeviceSummaries, kaliDeviceSummaries]) => {
    mergeIntoOverallCodenameToDeviceSummary(overallCodenameToDeviceSummary, cDroidDeviceSummaries, 'cDroid');

    mergeIntoOverallCodenameToDeviceSummary(overallCodenameToDeviceSummary, ubuntuTouchDeviceSummaries, 'ubuntuTouch');

    mergeIntoOverallCodenameToDeviceSummary(
      overallCodenameToDeviceSummary,
      resurrectionRemixDeviceSummaries,
      'resurrectionRemix'
    );

    mergeIntoOverallCodenameToDeviceSummary(overallCodenameToDeviceSummary, kaliDeviceSummaries, 'kali');

    saveResult(overallCodenameToDeviceSummary);
  })
  .catch(e => logger.error(e));
