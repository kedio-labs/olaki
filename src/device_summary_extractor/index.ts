import logger from '../logger';
import extractEOsDeviceSummaries from './eos';
import extractLineageOsDeviceSummaries from './lineageos';
import { CodenameToDeviceSummary, JsonResult } from './model';
import extractPmOsDeviceSummaries from './pmos';
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
  osName: 'lineageOs' | 'pmos' | 'eos' | 'ubuntuTouch'
) => {
  for (const k in overallCodenameToDeviceSummary) {
    if (osCodenameToDeviceSummary[k]) {
      if (osName === 'lineageOs') {
        overallCodenameToDeviceSummary[k].lineageOs = osCodenameToDeviceSummary[k].lineageOs;
      } else if (osName === 'pmos') {
        overallCodenameToDeviceSummary[k].pmos = osCodenameToDeviceSummary[k].pmos;
      } else if (osName === 'ubuntuTouch') {
        overallCodenameToDeviceSummary[k].ubuntuTouch = osCodenameToDeviceSummary[k].ubuntuTouch;
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

logger.info('[Extractor] ubuntuTouch: Extracting device summaries');
extractUbuntuTouchDeviceSummaries()
  .then(ubuntuTouchDeviceSummaries => {
    logger.info('[Extractor] ubuntuTouch: Successfully extracted device summaries. Merging into overall result.');
    mergeIntoOverallCodenameToDeviceSummary(overallCodenameToDeviceSummary, ubuntuTouchDeviceSummaries, 'ubuntuTouch');

    saveResult(overallCodenameToDeviceSummary);
  })
  .catch(e => logger.error(e));
