/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const Remarkable = require('remarkable');
const mdToc = require('markdown-toc');
// const toSlug = require('./toSlug');

const TABLE_OF_CONTENTS_TOKEN = '<AUTOGENERATED_TABLE_OF_CONTENTS>';

/**
 * Returns a table of content from the headings
 *
 * @return array
 * Array of heading objects with `hashLink`, `content` and `children` fields
 *
 */
function getTOC(content, headingTags = 'h2', subHeadingTags = 'h3') {
  const tagToLevel = tag => Number(tag.slice(1));
  const headingLevels = [].concat(headingTags).map(tagToLevel);
  const subHeadingLevels = subHeadingTags
    ? [].concat(subHeadingTags).map(tagToLevel)
    : [];
  const allowedHeadingLevels = headingLevels.concat(subHeadingLevels);
  const md = new Remarkable();
  const headings = mdToc(content).json;
  const toc = [];
  // const context = {};
  let current;
  const anchorDep = [-1];
  let lastHLevel;

  headings.forEach(heading => {
    // we need always generate slugs to ensure, that we will have consistent
    // slug indexes for headings with the same names
    // const hashLink = toSlug(heading.content, context);
    if (!lastHLevel) {
      lastHLevel = heading.lvl;
    }
    const hLevel = heading.lvl;

    if (hLevel < lastHLevel) {
      const diff = lastHLevel - hLevel;
      for (let i = 0; i < diff; i += 1) {
        anchorDep.pop();
      }
      anchorDep[anchorDep.length - 1] += 1;
    }
    if (hLevel === lastHLevel) {
      anchorDep[anchorDep.length - 1] += 1;
    }
    if (hLevel > lastHLevel) {
      anchorDep.push(0);
    }
    lastHLevel = hLevel;
    const hashLink = anchorDep.join("_");
    if (!allowedHeadingLevels.includes(heading.lvl)) {
      return;
    }
    const rawContent = mdToc.titleize(heading.content);
    const entry = {
      hashLink,
      rawContent,
      content: md.renderInline(rawContent),
      children: [],
    };
    if (headingLevels.includes(heading.lvl)) {
      toc.push(entry);
      current = entry;
    } else if (current) {
      current.children.push(entry);
    }
  });
  return toc;
}

// takes the content of a doc article and returns the content with a table of
// contents inserted
function insertTOC(rawContent) {
  if (!rawContent || rawContent.indexOf(TABLE_OF_CONTENTS_TOKEN) === -1) {
    return rawContent;
  }
  const filterRe = /^`[^`]*`/;
  const headers = getTOC(rawContent, 'h3', null);
  const tableOfContents = headers
    .filter(header => filterRe.test(header.rawContent))
    .map(header => `  - [${header.rawContent}](#${header.hashLink})`)
    .join('\n');
  return rawContent.replace(TABLE_OF_CONTENTS_TOKEN, tableOfContents);
}

module.exports = {
  getTOC,
  insertTOC,
};
