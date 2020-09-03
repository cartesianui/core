# @cartesian-ui/ng-axis

# Important

Issues of this repository are tracked on https://github.com/orendalabs/cartesian.ui. Please create your issues on https://github.com/orendalabs/cartesian.ui/issues.

## Installation

To install this library, run:

```bash
$ npm i @cartesian-ui/ng-axis --save
```

## AxisHttpInterceptor

In order to use AxisHttpInterceptor, first import it into module like below;

```ts
import { AxisHttpInterceptor } from '@cartesian-ui/ng-axis';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
```

then, add it to your module providers like below;

```ts
imports: [
    ///other imports
],
providers: [
    ///other providers
    { provide: HTTP_INTERCEPTORS, useClass: AxisHttpInterceptor, multi: true }
]
```

## AxisMultiTenancyService

Import any other service e.g. AxisMultiTenancyService

```ts
import { AxisMultiTenancyService } from '@cartesian-ui/ng-axis';
```

## License

MIT
