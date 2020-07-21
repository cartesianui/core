# Important

Issues of this repository are tracked on https://github.com/orendalabs/ng-axs. Please create your issues on https://github.com/orendalabs/ng-axis/issues.

# ng-axis

## Installation

To install this library, run:

```bash
$ npm install ng-axis --save
```
## Development

To generate all `*.js`, `*.js.map` and `*.d.ts` files:

```bash
$ ng build ng-axis --prod
```

## AxisHttpInterceptor

In order to use AxisHttpInterceptor in your module, first import it and AxisHttpInterceptor into your module like below;

```ts
import { AxisModule } from '@axis/axis.module';
import { AxisHttpInterceptor } from '@axis/axisHttpInterceptor';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
```

then, add it to your module providers like below;

```ts
imports: [
    ///other imports
],
providers: [
    ///other providers
    { provide: HTTP_INTERCEPTORS, useClass: AbpHttpInterceptor, multi: true }
]
```

## License

MIT
