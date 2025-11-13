import { CodenameToDeviceSummary } from './model';
import { fetchUrl, normaliseCodename } from './util';
import logger from '../../logger';
import { load } from 'cheerio';

const IODEOS_URL = 'https://iode.tech/iodeos-official-supported-devices';

export default async function extractIodeOsDeviceSummaries(): Promise<CodenameToDeviceSummary> {
  const codenameToDeviceSummary: CodenameToDeviceSummary = {};

  const response = await fetchUrl('[IODEOS]', IODEOS_URL);

  logger.debug('[IODEOS] Scraping iodéOS devices page');
  const $ = load(response.data);
  $('table#tablepress-1')
    .first()
    .find('tbody tr')
    .get()
    .forEach(trElement => {
      const tr = $(trElement);

      const vendor = tr.find('td.column-1').text().trim();
      const secondCellText = tr.find('td.column-2').text();
      const codenameStartIndex = secondCellText.lastIndexOf('(');
      const name = secondCellText.substring(0, codenameStartIndex).trim();
      const codename = normaliseCodename(secondCellText.substring(codenameStartIndex + 1).replaceAll(')', ''));

      codenameToDeviceSummary[codename] = {
        codename,
        vendor,
        name,
        iodeos: {
          url: IODEOS_URL,
        },
      };
    });

  return codenameToDeviceSummary;
}
