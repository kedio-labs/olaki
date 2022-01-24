import axios, { AxiosRequestConfig } from 'axios';

export const normaliseCodename = (codename: string) => codename.toLowerCase().replaceAll('-', '_').trim();

export const capitalise = (text: string) =>
  text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

// e.g. Asus ZenFone 5 -> ZenFone 5
export const removeVendorPrefixFromModelAndTrim = (vendor: string, model: string) => model.replace(vendor, '').trim();

export const fetchUrl = async (module: string, url: string, config: AxiosRequestConfig = {}) => {
  return await axios.get(url, config).catch(error => {
    if (error.response) {
      throw new Error(
        `${module} ERROR - Received non-200 status code when fetching URL ${url}: ${error.response.status}\n ${error.response.data}`
      );
    } else if (error.request) {
      throw new Error(`${module} ERROR - No response received for request to URL ${url}: ${error.request}`);
    } else {
      throw new Error(`${module} ERROR Could not setup request for URL ${url}: ${error.message}\n${error.config}`);
    }
  });
};
