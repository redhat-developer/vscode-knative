/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { TreeItem } from 'vscode';

export class KnativeItem {}

/**
 * The Sort compare function will compare the context type first, then compare the label.
 *
 * All non-undefined array elements are sorted according to the return value of the compare function (all undefined elements are sorted to the end of the array, with no call to compareFunction). If a and b are two elements being compared, then:
 *
 * If compareFunction(a, b) returns less than 0, sort a to an index lower than b (i.e. a comes first).
 * If compareFunction(a, b) returns 0, leave a and b unchanged with respect to each other, but sorted with respect to all different elements. Note: the ECMAscript standard does not guarantee this behavior, thus, not all browsers (e.g. Mozilla versions dating back to at least 2003) respect this.
 * If compareFunction(a, b) returns greater than 0, sort b to an index lower than a (i.e. b comes first).
 * compareFunction(a, b) must always return the same value when given a specific pair of elements a and b as its two arguments. If inconsistent results are returned, then the sort order is undefined.
 *
 * @param a TreeObject
 * @param b TreeObject
 */
export function compareNodes(a: TreeItem, b: TreeItem): number {
  if (!a.contextValue) {
    return -1;
  }
  if (!b.contextValue) {
    return 1;
  }
  // We do not want to consider sorting on anything after the underscore.
  const aContext = a.contextValue.includes('_') ? a.contextValue.substr(0, a.contextValue.indexOf('_')) : a.contextValue;
  const bContext = b.contextValue.includes('_') ? b.contextValue.substr(0, b.contextValue.indexOf('_')) : b.contextValue;
  const t = aContext.localeCompare(bContext);
  return t || a.label.localeCompare(b.label);
}
