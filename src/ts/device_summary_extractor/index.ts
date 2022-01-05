import logger from '../../logger';
import extractCrDroidDeviceSummaries from './crdroid';
import extractEOsDeviceSummaries from './eos';
import extractKaliDeviceSummaries from './kali';
import extractLineageOsDeviceSummaries from './lineageos';
import { CodenameToDeviceSummary, DeviceSummaryOSSpecific } from './model';
import extractOmniRomDeviceSummaries from './omnirom';
import extractPmOsDeviceSummaries from './pmos';
import { buildPublicDirectory } from './publicFilesBuilder';
import extractResurrectionRemixDeviceSummaries from './resurrectionremix';
import extractUbuntuTouchDeviceSummaries from './ubuntutouch';

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

      buildPublicDirectory(overallCodenameToDeviceSummary);
    }
  )
  .catch(e => logger.error(e));
