/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { Uri } from 'vscode';
import { KnativeChannels } from './knativeChannels';
import { KnativeServices } from './knativeServices';
import { KnativeBrokers } from './knativeBrokers';
import { GenericSource } from './genericSource';
import { APIServerSource } from './apiServerSource';
import { BindingSource } from './bindingSource';
import { PingSource } from './pingSource';
import { Broker } from './broker';
import { Channel } from './channel';
import { Service } from './service';
import { Sink } from './sink';
import { convertStringToURI } from '../util/parse';

export type SourceTypes = GenericSource | APIServerSource | BindingSource | PingSource;

/**
 * A singleton to hold the Sources.
 * Public methods to control the list of Sources.
 */
export class KnativeSources {
  private knChannel = KnativeChannels.Instance;

  private knService = KnativeServices.Instance;

  private knBroker = KnativeBrokers.Instance;

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

  private sources: Array<SourceTypes> = [];

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

  /**
   * Find a Sink from the static list of Channels that matches the name
   *  in the Subscription channel field.
   *
   * Then add that found Channel to the childChannel in the sub sent in.
   * @param subscription
   * @returns channel for the subscription
   */
  public addSink(source: SourceTypes): Sink {
    const sinkName = source.sink;
    // if no channel was set on the subscription then don't try to add it.
    if (!sinkName) {
      return null;
    }

    const broker: Broker = this.knBroker.findBroker(sinkName);
    const channel: Channel = this.knChannel.findChannel(sinkName);
    const service: Service = this.knService.findService(sinkName);
    const uri: Uri = typeof sinkName === 'string' ? convertStringToURI(sinkName) : undefined;
    const sink: Sink = broker || channel || service || uri;
    if (sink) {
      // find this source in the master list of sources and add the sink to it
      this.findSource(source.name).childSink = sink;
      this.updateTree();
    }
    return sink;
  }

  public addSource(source: SourceTypes): SourceTypes {
    this.sources.push(source);
    this.addSink(source);
    // this.sources.sort(compareNodes);
    this.updateTree();
    return source;
  }

  public addSources(sources: Array<SourceTypes>): Array<SourceTypes> {
    this.sources = sources;
    sources.forEach((sink) => {
      this.addSink(sink);
    });
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
