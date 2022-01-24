import appConfig from '../../../appConfig.json';
import logger from '../../logger';
import { CodenameToDeviceSummary, DeviceSummary, JsonResult } from './model';
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';

const SRC_PUBLIC_DIRECTORY = './src/public';
const DIST_PUBLIC_DIRECTORY = './dist/public';
const JS_RESULT_FILENAME = 'olaki-data.js';
const INDEX_FILENAME = 'index.html';
const JS_RESULT_FILE_PATH = `${DIST_PUBLIC_DIRECTORY}/${JS_RESULT_FILENAME}`;

const sortAlphabetically = (codenameToDeviceSummary: CodenameToDeviceSummary): DeviceSummary[] =>
  Object.keys(codenameToDeviceSummary)
    .sort((codename1, codename2) => {
      const vendor1 = codenameToDeviceSummary[codename1].vendor.toString().toLowerCase();
      const vendor2 = codenameToDeviceSummary[codename2].vendor.toString().toLowerCase();

      const name1 = codenameToDeviceSummary[codename1].name.toString().toLowerCase();
      const name2 = codenameToDeviceSummary[codename2].name.toString().toLowerCase();

      if (vendor1 == vendor2) {
        if (name1 == name2) {
          return 0;
        }
        return name1 < name2 ? -1 : 1;
      }

      return vendor1 < vendor2 ? -1 : 1;
    })
    .map(codename => codenameToDeviceSummary[codename]);

// save to JavaScript file so that it can be easily loaded in public/index.html
const createJavaScriptFileInPublicDirectory = (codenameToDeviceSummary: CodenameToDeviceSummary) => {
  logger.info(`[Public Assets Builder] Writing results into file: ${JS_RESULT_FILE_PATH}`);

  const jsonResult: JsonResult = {
    lastUpdated: new Date().getTime(),
    deviceSummaries: sortAlphabetically(codenameToDeviceSummary),
    appConfig,
  };

  if (!existsSync(DIST_PUBLIC_DIRECTORY)) {
    mkdirSync(DIST_PUBLIC_DIRECTORY, { recursive: true });
  }
  const javaScriptFileContent = `const olakiData = ${JSON.stringify(jsonResult, null, ' ')};`;

  writeFileSync(JS_RESULT_FILE_PATH, javaScriptFileContent);
};

const copyIndexFileToPublicDirectory = () =>
  copyFileSync(`${SRC_PUBLIC_DIRECTORY}/${INDEX_FILENAME}`, `${DIST_PUBLIC_DIRECTORY}/${INDEX_FILENAME}`);

export const buildPublicDirectory = (codenameToDeviceSummary: CodenameToDeviceSummary) => {
  createJavaScriptFileInPublicDirectory(codenameToDeviceSummary);
  copyIndexFileToPublicDirectory();

  logger.info('[Public Assets Builder] Success.');
};
