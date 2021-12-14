import extractLineageOsDeviceSummaries from './lineageos';
import extractPmOsDeviceSummaries from './pmos';
import extractUbuntuTouchDeviceSummaries from './ubuntutouch';
import { writeFileSync } from 'fs';
import logger from '../logger';
import { CodenameToDeviceSummary } from './model';

const OVERALL_DEVICE_SUMMARIES_JSON_RESULT = 'device-summaries.json';

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

logger.info('[Extractor] Extracting lineageOs device summaries');
const lineageOsDeviceSummaries = extractLineageOsDeviceSummaries();
logger.info('[Extractor] Successfully extracted lineageOs device summaries. Merging into overall result.');
mergeIntoOverallCodenameToDeviceSummary(overallCodenameToDeviceSummary, lineageOsDeviceSummaries, 'lineageOs');

logger.info('[Extractor] Extracting postmarketOs device summaries');
const pmOsDeviceSummaries = extractPmOsDeviceSummaries();
logger.info('[Extractor] Successfully extracted postmarketOs device summaries. Merging into overall result.');
mergeIntoOverallCodenameToDeviceSummary(overallCodenameToDeviceSummary, pmOsDeviceSummaries, 'pmos');

logger.info('[Extractor] Extracting ubuntuTouch device summaries');
extractUbuntuTouchDeviceSummaries()
  .then(ubuntuTouchDeviceSummaries => {
    logger.info('[Extractor] Successfully extracted ubuntuTouch device summaries. Merging into overall result.');
    mergeIntoOverallCodenameToDeviceSummary(overallCodenameToDeviceSummary, ubuntuTouchDeviceSummaries, 'ubuntuTouch');

    logger.info(`[Extractor] Writing results into file: ${OVERALL_DEVICE_SUMMARIES_JSON_RESULT}`);
    writeFileSync(OVERALL_DEVICE_SUMMARIES_JSON_RESULT, JSON.stringify(overallCodenameToDeviceSummary, null, ' '));
  })
  .catch(e => logger.error(e));
