import logger from '../../logger';
import extractCalyxOsDeviceSummaries from './calyxos';
import extractCrDroidDeviceSummaries from './crdroid';
import extractEOsDeviceSummaries from './eos';
import extractGrapheneOsDeviceSummaries from './grapheneos';
import extractKaliDeviceSummaries from './kali';
import extractLineageOsDeviceSummaries from './lineageos';
import { CodenameToDeviceSummary, DeviceSummaryOSSpecific } from './model';
import extractOmniRomDeviceSummaries from './omnirom';
import extractPmOsDeviceSummaries from './pmos';
import { buildPublicDirectory } from './publicAssetsBuilder';
import extractUbuntuTouchDeviceSummaries from './ubuntutouch';

const mergeIntoOverallCodenameToDeviceSummary = (
  overallCodenameToDeviceSummary: CodenameToDeviceSummary,
  osCodenameToDeviceSummary: CodenameToDeviceSummary,
  osName: keyof DeviceSummaryOSSpecific,
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

const logDeviceSummaries = (osName: string, deviceSummaries: CodenameToDeviceSummary) =>
  logger.info(
    `[Extractor] ${osName}: Successfully extracted ${
      Object.keys(deviceSummaries).length
    } device summaries. Merging into overall result.`,
  );

const logAndReturnDeviceSummaries = (osName: string) => (deviceSummaries: CodenameToDeviceSummary) => {
  logDeviceSummaries(osName, deviceSummaries);
  return deviceSummaries;
};

const overallCodenameToDeviceSummary = {};

logger.info('[Extractor] lineageos: Extracting device summaries');
const lineageosDeviceSummaries = extractLineageOsDeviceSummaries();
logDeviceSummaries('lineageos', lineageosDeviceSummaries);
mergeIntoOverallCodenameToDeviceSummary(overallCodenameToDeviceSummary, lineageosDeviceSummaries, 'lineageos');

logger.info('[Extractor] postmarketOs: Extracting device summaries');
const pmOsDeviceSummaries = extractPmOsDeviceSummaries();
logDeviceSummaries('postmarketOs', pmOsDeviceSummaries);
mergeIntoOverallCodenameToDeviceSummary(overallCodenameToDeviceSummary, pmOsDeviceSummaries, 'pmos');

logger.info('[Extractor] /e/OS: Extracting device summaries');
const eOsDeviceSummaries = extractEOsDeviceSummaries();
logDeviceSummaries('/e/OS', eOsDeviceSummaries);
mergeIntoOverallCodenameToDeviceSummary(overallCodenameToDeviceSummary, eOsDeviceSummaries, 'eos');

logger.info('[Extractor] CalyxOS: Extracting device summaries');
const calyxOsDeviceSummaries = extractCalyxOsDeviceSummaries();
logDeviceSummaries('CalyxOS', calyxOsDeviceSummaries);
mergeIntoOverallCodenameToDeviceSummary(overallCodenameToDeviceSummary, calyxOsDeviceSummaries, 'calyxos');

logger.info('[Extractor] crDroid: Extracting device summaries');
const crDroidPromise = extractCrDroidDeviceSummaries().then(logAndReturnDeviceSummaries('crDroid'));

logger.info('[Extractor] ubuntutouch: Extracting device summaries');
const ubuntuTouchPromise = extractUbuntuTouchDeviceSummaries().then(logAndReturnDeviceSummaries('ubuntutouch'));

logger.info('[Extractor] omnirom: Extracting device summaries');
const omniromPromise = extractOmniRomDeviceSummaries().then(logAndReturnDeviceSummaries('omnirom'));

logger.info('[Extractor] kali: Extracting device summaries');
const kaliPromise = extractKaliDeviceSummaries().then(logAndReturnDeviceSummaries('kali'));

logger.info('[Extractor] GrapheneOs: Extracting device summaries');
const grapheneOsPromise = extractGrapheneOsDeviceSummaries().then(logAndReturnDeviceSummaries('GrapheneOs'));

Promise.all([crDroidPromise, ubuntuTouchPromise, omniromPromise, kaliPromise, grapheneOsPromise])
  .then(
    ([
      crdroidDeviceSummaries,
      ubuntutouchDeviceSummaries,
      omniromDeviceSummaries,
      kaliDeviceSummaries,
      grapheneOsDeviceSummaries,
    ]) => {
      mergeIntoOverallCodenameToDeviceSummary(overallCodenameToDeviceSummary, crdroidDeviceSummaries, 'crdroid');

      mergeIntoOverallCodenameToDeviceSummary(overallCodenameToDeviceSummary, ubuntutouchDeviceSummaries, 'ubuntutouch');

      mergeIntoOverallCodenameToDeviceSummary(overallCodenameToDeviceSummary, omniromDeviceSummaries, 'omnirom');

      mergeIntoOverallCodenameToDeviceSummary(overallCodenameToDeviceSummary, kaliDeviceSummaries, 'kali');

      mergeIntoOverallCodenameToDeviceSummary(overallCodenameToDeviceSummary, grapheneOsDeviceSummaries, 'grapheneos');

      buildPublicDirectory(overallCodenameToDeviceSummary);
    },
  )
  .catch(e => logger.error(e));
