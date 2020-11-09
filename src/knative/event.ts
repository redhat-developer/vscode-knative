import * as vscode from 'vscode';
import { Broker } from './broker';
import { Channel } from './channel';
import { Service } from './service';

export type Sink = Broker | Channel | Service | vscode.Uri;
