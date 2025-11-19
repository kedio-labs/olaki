const TableSort = (function () {
  /**
   * NaturalSorter helps sort natural text.
   * e.g. ['File1', 'File20', 'File10', 'File2'] gets sorted into ['File1', 'File2', 'File10', 'File20']
   */
  class NaturalSorter {
    /**
     * Converts a string like "File12A" into tokens:
     *     ["file", 12, "a"]
     */
    static tokenize(str, locale) {
      // Split into numeric and non-numeric parts
      const re = /(\d+|\D+)/g;
      const parts = [];
      let match;

      while ((match = re.exec(str)) !== null) {
        const part = match[0];
        if (/^\d+$/.test(part)) {
          // zero-pad numbers so lexicographic compare works correctly
          parts.push(part.padStart(10, '0'));
        } else {
          // locale-aware lowercasing for stable text comparison
          parts.push(part.toLocaleLowerCase(locale));
        }
      }

      return parts;
    }

    /**
     * Compares two token lists (e.g., ["a", 12] vs ["a", 2])
     */
    static compare(aTokens, bTokens, asc) {
      const len = Math.max(aTokens.length, bTokens.length);

      for (let i = 0; i < len; i++) {
        const a = aTokens[i] || '';
        const b = bTokens[i] || '';

        if (a === b) continue;

        const result = a < b ? -1 : 1;
        return asc ? result : -result;
      }

      return 0;
    }
  }

  function parseValue(text, type, locale) {
    const trimmed = text.trim();

    switch (type) {
      case 'number':
        return parseFloat(trimmed) || 0;
      case 'date':
        return new Date(trimmed).getTime();
      case 'natural':
        return NaturalSorter.tokenize(trimmed, locale);
      default: // text
        return trimmed.toLocaleLowerCase(locale);
    }
  }

  function sortTable(table, columnIndex, type, asc, locale) {
    const tbody = table.tBodies[0];
    const rows = Array.from(tbody.rows);

    rows.sort((rowA, rowB) => {
      const aVal = parseValue(rowA.cells[columnIndex].textContent, type, locale);
      const bVal = parseValue(rowB.cells[columnIndex].textContent, type, locale);

      if (type === 'natural') {
        return NaturalSorter.compare(aVal, bVal, asc);
      }

      if (type === 'text') {
        const cmp = aVal.localeCompare(bVal, locale);
        return asc ? cmp : -cmp;
      }

      // other types
      if (aVal === bVal) return 0;
      return asc ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1;
    });

    rows.forEach(row => tbody.appendChild(row));
  }

  function initSortableTable(table) {
    const headers = table.querySelectorAll('thead th');

    headers.forEach((th, index) => {
      const type = th.dataset.sort;

      if (!type) return; // only sort columns with data-sort="..."

      th.style.cursor = 'pointer';
      th.dataset.asc = 'true';

      th.addEventListener('click', () => {
        const asc = th.dataset.asc === 'true';
        const locale = th.dataset.locale ?? 'en';
        sortTable(table, index, type, asc, locale);
        th.dataset.asc = (!asc).toString(); // toggle for next click
      });
    });
  }

  // add sorting capability to any table with the class 'sortable'
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('table.sortable').forEach(initSortableTable);
  });

  // public API
  return {
    sort(table, columnIndex, options = {}) {
      const th = table.querySelectorAll('th')[columnIndex];
      const type = options.type || th?.dataset.sort;
      const asc = options.asc ?? true;
      const locale = options.locale || th?.dataset.locale;
      sortTable(table, columnIndex, type, asc, locale);
    },
  };
})();
