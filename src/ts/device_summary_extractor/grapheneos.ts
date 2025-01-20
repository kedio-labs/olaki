import logger from '../../logger';
import { CodenameToDeviceSummary } from './model';
import { fetchUrl, normaliseCodename } from './util';
import { load } from 'cheerio';

const GRAPHENE_OS_INSTALL_URL = 'https://grapheneos.org/install';
const GRAPHENE_OS_RELEASES_URL = 'https://grapheneos.org/releases';

export default async function extractGrapheneOsDeviceSummaries(): Promise<CodenameToDeviceSummary> {
  const codenameToDeviceSummary: CodenameToDeviceSummary = {};

  const response = await fetchUrl('[GRAPHENEOS]', GRAPHENE_OS_RELEASES_URL);

  logger.debug('[GRAPHENEOS] Scraping GrapheneOS releases page');
  const $ = load(response.data);
  $('section#devices section')
    .get()
    .forEach(sectionElement => {
      const codename: string = sectionElement.attribs.id;
      const normalisedCodename = normaliseCodename(codename);

      logger.debug(`[GRAPHENEOS] Processing codename: ${normalisedCodename}`);

      codenameToDeviceSummary[normalisedCodename] = {
        codename: normalisedCodename,
        vendor: 'Google', // Currently, only Pixel devices are compatible with GrapheneOS
        name: $(sectionElement).find('h3 > a').text(),
        grapheneos: {
          url: GRAPHENE_OS_INSTALL_URL,
        },
      };
    });

  return codenameToDeviceSummary;
}
