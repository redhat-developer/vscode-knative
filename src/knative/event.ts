/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { Broker } from './broker';
import { Channel } from './channel';
import { Service } from './service';

export type Sink = Broker | Channel | Service | vscode.Uri;
