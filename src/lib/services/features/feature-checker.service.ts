///<reference path="../../../../../../node_modules/@cartesianui/js/axis.d.ts"/>

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
