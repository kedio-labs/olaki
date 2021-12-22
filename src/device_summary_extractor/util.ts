export const normaliseCodename = (codename: string) => codename.toLowerCase().trim();

// e.g. Asus ZenFone 5 -> ZenFone 5
export const removeVendorPrefixFromModelAndTrim = (vendor: string, model: string) => model.replace(vendor, '').trim();
