import { signal, computed } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { toCamel, isString } from '../../utils/helpers';
import { AppConfig } from '../../app-config';
import { ObjectUtils } from '../../utils/object.utils';
import { WhereItem, WhereOptions, OrderItem, Operator, Value, OrderDirection, Column, ColumnItem, Comparison, Fields, SearchForm, Pairs } from './types';

// @Injectable()
export class RequestCriteria {
  readonly form = signal<SearchForm>({} as SearchForm);

  readonly wheres = signal<WhereItem[]>([]);
  readonly orders = signal<OrderItem[]>([]);
  readonly relations = signal<string[]>([]);
  readonly filters = signal<string[]>([]);
  readonly limitPerPage = signal<number>(30);
  readonly pageNo = signal<number>(1);
  readonly searchJoinComparison = signal<Comparison>('and');
  readonly operators = ['=', 'like', 'between', 'in'];

  constructor(form?: SearchForm) {
    if (form) this.form.set(form);

    // only onload
    this.syncWhereUsingForm();
  }

  //-----------------------------------------------
  //                     Setters
  //-----------------------------------------------

  with(relationship: string) {
    this.relations.set([...this.relations(), relationship]);
    return this;
  }
  
  where(column: string | Column, operator: Operator | Value = null, value: Value = null, options?: WhereOptions) {
    if (Array.isArray(column) && !isString(column[0])) return this.whereArray(column as Column);

    const [resolvedValue, resolvedOperator] = this.resolveOperatorValue(value, operator, arguments.length === 2);
    const finalOperator = this.operators.includes(resolvedOperator) ? resolvedOperator : '=';

    const updated = this.wheres().filter((w) => w.column !== column);
    if (resolvedValue !== null && resolvedValue !== '') {
      updated.push({ column: column as string, operator: finalOperator, value: resolvedValue, options });
    }
    this.wheres.set(updated);
    return this;
  }

  whereBetween(column: string, range: [Value, Value], options?: WhereOptions) {
    return this.where(column, 'between', range as any, options);
  }

  whereIn(column: string, values: Value[], options?: WhereOptions) {
    return this.where(column, 'in', values as any, options);
  }

  whereArray(column: Column) {
    column.forEach((item: ColumnItem) => {
      this.where.apply(this, item);
    });
    return this;
  }

  filter(filters: string[]) {
    this.filters.set(filters);
    return this;
  }

  searchJoin(comparison: Comparison) {
    this.searchJoinComparison.set(comparison);
    return this;
  }

  orderBy(column: string, direction: OrderDirection = 'asc') {
    this.orders.set([...this.orders(), { column, direction }]);
    return this;
  }

  orderByDesc(column: string) {
    return this.orderBy(column, 'desc');
  }

  /**
   * Order by a related table's column.
   * Generates: orderBy=relation|column (API joins the relation table)
   * @example orderByRelation('posts', 'title', 'desc')
   *          → ?orderBy=posts|title&sortedBy=desc
   * @example orderByRelation('posts:custom_id', 'title')
   *          → ?orderBy=posts:custom_id|title&sortedBy=asc
   */
  orderByRelation(relation: string, column: string, direction: OrderDirection = 'asc') {
    return this.orderBy(`${relation}|${column}`, direction);
  }

  page(page: number) {
    this.pageNo.set(page);
    return this;
  }

  limit(limit: number) {
    this.limitPerPage.set(limit);
    return this;
  }

  initForm(urlSearchString: string): void {
    if (!urlSearchString) return;

    const entries: [string, string][] = urlSearchString.split(',').map((str): [string, string] => {
      const [key = '', val = ''] = str.split(':');
      return [key.trim(), val.trim()];
    });

    this.applyFormUpdates(entries);
  }

  /**
   * Hydrate wheres from URL query params (search + searchFields).
   * Parses: search=name:John;status:active  searchFields=name:like;status:=
   * Converts API-format keys back to app-format (e.g. snake_case → camelCase).
   */
  hydrateFromUrl(params: Record<string, string>): void {
    const searchStr = params['search'];
    if (!searchStr) return;

    const searchFieldsStr = params['searchFields'] || '';
    const needsConvert = AppConfig.keysFormatAPI && AppConfig.keysFormatAPP && AppConfig.keysFormatAPI !== AppConfig.keysFormatAPP;

    // Parse searchFields into a map: { column: operator }
    const operatorMap: Record<string, string> = {};
    if (searchFieldsStr) {
      searchFieldsStr.split(';').forEach(part => {
        const [col, op] = part.split(':');
        if (col && op) operatorMap[col.trim()] = op.trim();
      });
    }

    // Parse search into wheres
    const wheres: WhereItem[] = [];
    searchStr.split(';').forEach(part => {
      const idx = part.indexOf(':');
      if (idx === -1) return;
      const apiCol = part.substring(0, idx).trim();
      const val = part.substring(idx + 1).trim();
      if (!apiCol || !val) return;

      const appCol = needsConvert ? ObjectUtils.convertKey(apiCol, AppConfig.keysFormatAPI, AppConfig.keysFormatAPP) : apiCol;
      const operator = operatorMap[apiCol] || '=';

      wheres.push({ column: appCol, operator, value: val });
    });

    if (wheres.length) {
      this.wheres.set(wheres);
    }
  }

  updateForm(fields: string | string[], value: string): this {
    const list = Array.isArray(fields) ? fields : fields.split(',').map((f) => f.trim());

    const entries: [string, string][] = list.map((f): [string, string] => [f, value ?? '']);

    this.applyFormUpdates(entries);
    return this;
  }

  //-----------------------------------------------
  //                 Computed Getters
  //-----------------------------------------------

  readonly criteria = computed(() => this.toCriteria());
  readonly pairs = computed(() => this.toPairs());
  readonly queryString = computed(() => this.toQueryString());
  readonly httpParams = computed(() => this.toHttpParams());
  readonly urlParams = computed(() => this.toUrlParams());
  

  //-----------------------------------------------
  //                     Helpers
  //-----------------------------------------------

  private toCriteria(): Fields {
    const search: string[] = [];
    const searchFields: string[] = [];
    const orderBy: string[] = [];
    const sortedBy: string[] = [];

    const needsConvert = AppConfig.keysFormatAPI && AppConfig.keysFormatAPP && AppConfig.keysFormatAPI !== AppConfig.keysFormatAPP;

    this.wheres().forEach((condition) => {
      const col = needsConvert ? ObjectUtils.convertKey(condition.column, AppConfig.keysFormatAPP, AppConfig.keysFormatAPI) : condition.column;
      // For 'between' and 'in' operators, values are arrays joined by comma
      const val = Array.isArray(condition.value) ? condition.value.join(',') : condition.value;
      search.push(`${col}:${val}`);
      searchFields.push(`${col}:${condition.operator}`);
    });

    this.orders().forEach((order) => {
      const col = needsConvert ? ObjectUtils.convertKey(order.column, AppConfig.keysFormatAPP, AppConfig.keysFormatAPI) : order.column;
      orderBy.push(col);
      sortedBy.push(order.direction);
    });

    const relations = needsConvert
      ? this.relations().map(r =>
          r.split(',').map(path =>
            path.split('.').map(seg => ObjectUtils.convertKey(seg, AppConfig.keysFormatAPP, AppConfig.keysFormatAPI)).join('.')
          ).join(',')
        )
      : this.relations();

    return {
      search,
      searchFields,
      orderBy,
      sortedBy,
      with: relations,
      include: relations,
      filter: this.filters(),
      page: [this.pageNo()],
      limit: [this.limitPerPage()],
      searchJoin: [this.searchJoinComparison()]
    };
  }

  private toPairs(): Pairs {
    const fields = this.criteria();
    return Object.entries(fields).reduce((acc, [key, val]) => {
      if (Array.isArray(val) && val.length > 0) {
        acc[key] = val.join(';');
      }
      return acc;
    }, {} as Pairs);
  }

  private toQueryString(): string {
    return new URLSearchParams(this.pairs() as Record<string, string>).toString();
  }

  private toHttpParams(): HttpParams {
    return new HttpParams({ fromObject: this.pairs() as Record<string, string> });
  }

  private toUrlParams(): string {
    const search: string[] = [];
    this.wheres().forEach((field) => {
      if (field?.options?.url !== false) search.push(`${field.column}:${field.value}`);
    });

    return search.length ? `?search=${search.join(';')}` : '';
  }

  private applyFormUpdates(entries: [string, string][]): void {
    const form = { ...this.form() };
    for (const [key, val] of entries) {
      const fieldKey = toCamel(key);
      if (form[fieldKey]) {
        form[fieldKey].value = val ?? '';
      }
    }
    this.form.set(form);

    this.syncWhereUsingForm();
  }

  private syncWhereUsingForm() {
    const form = this.form();
    const wheres = [...this.wheres()];

    Object.entries(form).forEach(([_, field]) => {
      const f = field as WhereItem;
      if (f?.value) {
        const existingIdx = wheres.findIndex((w) => w.column === f.column);
        if (existingIdx > -1) wheres.splice(existingIdx, 1);
        wheres.push(f);
      } else {
        const idx = wheres.findIndex((c) => c.column === f.column);
        if (idx > -1) wheres.splice(idx, 1);
      }
    });

    this.wheres.set(wheres);
  }

  private resolveOperatorValue(value: Value, operator: Operator | Value, useDefault: boolean): [Value, Operator] {
    if (useDefault) return [operator as Value, '='];
    if (!isString(operator)) return [operator as Value, '='];
    return [value, operator as Operator];
  }
}
