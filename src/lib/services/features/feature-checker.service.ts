///<reference path="../../../../../../node_modules/@cartesianui/js/cartesian.d.ts"/>

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FeatureCheckerService {
  get(featureName: string): cartesian.features.IFeature {
    return cartesian.features.get(featureName);
  }

  getValue(featureName: string): string {
    return cartesian.features.getValue(featureName);
  }

  isEnabled(featureName: string): boolean {
    return cartesian.features.isEnabled(featureName);
  }
}
