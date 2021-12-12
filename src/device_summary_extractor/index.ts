import extractLineageOsDeviceSummaries from './lineageos';
import extractPmOsDeviceSummaries from './pmos';
import { writeFileSync } from 'fs';

const lineageOsDeviceSummaries = extractLineageOsDeviceSummaries();
// logger.info(lineageOsDeviceSummaries);
const pmOsDeviceSummaries = extractPmOsDeviceSummaries();
// logger.info(pmOsDeviceSummaries);

const deviceSummaries = lineageOsDeviceSummaries;

for (const k in deviceSummaries) {
  if (pmOsDeviceSummaries[k]) {
    deviceSummaries[k].pmos = pmOsDeviceSummaries[k].pmos;
  }
  delete pmOsDeviceSummaries[k];
}

Object.assign(deviceSummaries, pmOsDeviceSummaries);

writeFileSync('summaries.json', JSON.stringify(deviceSummaries, null, ' '));
