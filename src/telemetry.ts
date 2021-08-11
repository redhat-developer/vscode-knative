/* eslint-disable @typescript-eslint/no-floating-promises */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import { rejects } from 'assert';
import { ExtensionContext } from 'vscode';
import { getRedHatService, TelemetryEvent, TelemetryService } from '@redhat-developer/vscode-redhat-telemetry';
import { hideClusterInfo } from './util/hideclusterinformation';
import { getStderrString } from './util/stderrstring';

let telemetryService: TelemetryService;

export interface TelemetryProperties {
  identifier?: string;
  version?: string;
  duration?: string;
  runtime?: string;
  error?: string;
  runtimeversion?: string;
  mission?: string;
  message?: string;
}

export async function startTelemetry(context: ExtensionContext): Promise<void> {
  try {
    const redHatService = await getRedHatService(context);
    telemetryService = await redHatService.getTelemetryService();
  } catch (error) {
    rejects(error);
  }
  return telemetryService?.sendStartupEvent();
}

export function telemetryProperties(commandId: string): TelemetryProperties {
  return {
    identifier: commandId,
  };
}

export function createTrackingEvent(name: string, properties = {}): TelemetryEvent {
  return {
    type: 'track',
    name,
    properties,
  };
}

export async function sendTelemetry(actionName: string, properties?: TelemetryProperties): Promise<void> {
  return telemetryService?.send(createTrackingEvent(actionName, properties));
}

export function telemetryLogError(identifier: string, result: string | Error): void {
  if (identifier) {
    const telemetryProps: TelemetryProperties = telemetryProperties(`${identifier}_error`);
    const message = getStderrString(result);
    telemetryProps.error = hideClusterInfo(message);
    sendTelemetry(`${identifier}_error`, telemetryProps);
  }
}

export function telemetryLog(identifier: string, message?: string): void {
  if (identifier) {
    const telemetryProps: TelemetryProperties = telemetryProperties(identifier);
    if (message) {
      telemetryProps.message = message;
    }
    sendTelemetry(identifier, telemetryProps);
  }
}
