function flattenLandingLinks(links) {
  const result = [];

  // Rekursi untuk traversing setiap item di dalam array links
  function traverse(linkArray) {
    linkArray.forEach(({ key, element, children, capability }) => {
      if (key && element) {
        result.push({
          path: key,
          element: element,
          capability: capability
        });
      }
      if (children) {
        traverse(children); // Rekursi pada children jika ada
      }
    });
  }

  traverse(links);
  return result;
}

const findItemByKey = (links, key) => {
  for (const link of links) {
    if (link.key === key && link.element) {
      return link;
    }
    if (link.children) {
      const found = findItemByKey(link.children, key);
      if (found) {
        return found;
      }
    }
  }
  return undefined;
};

export { flattenLandingLinks, findItemByKey };
