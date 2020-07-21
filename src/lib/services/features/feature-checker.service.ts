///<reference path="../../../../../../node_modules/@orendalabs/js-axis/axis.d.ts"/>

import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class FeatureCheckerService {

    get(featureName: string): axis.features.IFeature {
        return axis.features.get(featureName);
    }

    getValue(featureName: string): string {
        return axis.features.getValue(featureName);
    }

    isEnabled(featureName: string): boolean {
        return axis.features.isEnabled(featureName);
    }

}
