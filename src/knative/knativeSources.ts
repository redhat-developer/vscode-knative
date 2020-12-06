/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { GenericSource } from './genericSource';
import { APIServerSource } from './apiServerSource';
import { BindingSource } from './bindingSource';
import { PingSource } from './pingSource';

export type SourceTypes = GenericSource | APIServerSource | BindingSource | PingSource;

/**
 * A singleton to hold the Sources.
 * Public methods to control the list of Sources.
 */
export class KnativeSources {
  private static instance: KnativeSources;

  // eslint-disable-next-line no-useless-constructor
  private constructor() {
    // do something if needed, but this is private for the singleton
  }

  public static get Instance(): KnativeSources {
    if (!KnativeSources.instance) {
      KnativeSources.instance = new KnativeSources();
    }
    return KnativeSources.instance;
  }

  private sources: Array<SourceTypes>;

  // eslint-disable-next-line class-methods-use-this
  private updateTree(): void {
    // TODO:
    // tell the tree view to refresh it's look at the data in 'sources'
    // convert sources to tree objects and then sort them
  }

  public getSources(): Array<SourceTypes> {
    return this.sources;
  }

  public findSource(sourceName: string): SourceTypes {
    return this.sources[this.sources.findIndex((s) => s.name === sourceName)];
  }

  public addSource(source: SourceTypes): SourceTypes {
    this.sources.push(source);
    // this.sources.sort(compareNodes);
    this.updateTree();
    return source;
  }

  public addSources(sources: Array<SourceTypes>): Array<SourceTypes> {
    this.sources = sources;
    // this.sources.sort(compareNodes);
    this.updateTree();
    return this.sources;
  }

  public updateSource(source: SourceTypes): Array<SourceTypes> {
    const updated: Array<SourceTypes> = this.sources.map((s) => {
      if (s.name === source.name) {
        return source;
      }
      return s;
    });
    // passing this through a variable to ensure we don't change values while working on them
    this.sources = updated;
    return this.sources;
  }

  public removeSource(name: string): Array<SourceTypes> {
    // find the index of the source passed in.
    const sourceIndex: number = this.sources.findIndex((s) => s.name === name);
    // remove the source
    this.sources.splice(sourceIndex, 1);

    this.updateTree();
    return this.sources;
  }
}
