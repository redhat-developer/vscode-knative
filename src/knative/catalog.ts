/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import KnAPI from '../kn/kn-api';
import { Kn, KnImpl } from '../kn/knController';
import Platform from "../util/platform";

export default class Catalog {
    private static kn: Kn = KnImpl.Instance;

    static listComponents(): void {
        Catalog.kn.executeInTerminal(KnAPI.listCatalogComponents(), Platform.getUserHomePath());
    }

    static listServices(): void {
        Catalog.kn.executeInTerminal(KnAPI.listCatalogOsServices(), Platform.getUserHomePath());
    }
}
