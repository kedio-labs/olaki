import extractLineageOsDeviceSummaries from './lineageos';
import extractPmOsDeviceSummaries from './pmos';
import extractUbuntuTouchDeviceSummaries from './ubuntutouch';
import { writeFileSync } from 'fs';
import logger from '../logger';
import { CodenameToDeviceSummary, JsonResult } from './model';

const OVERALL_DEVICE_SUMMARIES_JSON_RESULT = 'device-summaries.json';

const saveResult = (overallCodenameToDeviceSummary: CodenameToDeviceSummary) => {
  logger.info(`[Extractor] Writing results into file: ${OVERALL_DEVICE_SUMMARIES_JSON_RESULT}`);
  const jsonResult: JsonResult = {
    lastUpdated: new Date().getTime(),
    codenameToDeviceSummary: overallCodenameToDeviceSummary,
  };
  writeFileSync(OVERALL_DEVICE_SUMMARIES_JSON_RESULT, JSON.stringify(jsonResult, null, ' '));
};

const mergeIntoOverallCodenameToDeviceSummary = (
  overallCodenameToDeviceSummary: CodenameToDeviceSummary,
  osCodenameToDeviceSummary: CodenameToDeviceSummary,
  osName: 'lineageOs' | 'pmos' | 'ubuntuTouch'
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

logger.info('[Extractor] ubuntuTouch: Extracting device summaries');
extractUbuntuTouchDeviceSummaries()
  .then(ubuntuTouchDeviceSummaries => {
    logger.info('[Extractor] ubuntuTouch: Successfully extracted device summaries. Merging into overall result.');
    mergeIntoOverallCodenameToDeviceSummary(overallCodenameToDeviceSummary, ubuntuTouchDeviceSummaries, 'ubuntuTouch');

    saveResult(overallCodenameToDeviceSummary);
  })
  .catch(e => logger.error(e));
