import { Injectable, signal, computed, effect } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { toCamel, isString } from '../../utils/helpers';
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
  readonly operators = ['=', 'like'];

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
    if (Array.isArray(column)) return this.whereArray(column);

    const [resolvedValue, resolvedOperator] = this.resolveOperatorValue(value, operator, arguments.length === 2);
    const finalOperator = this.operators.includes(resolvedOperator) ? resolvedOperator : '=';

    const updated = this.wheres().filter((w) => w.column !== column);
    updated.push({ column, operator: finalOperator, value: resolvedValue, options });
    this.wheres.set(updated);
    return this;
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

    this.wheres().forEach((condition) => {
      search.push(`${condition.column}:${condition.value}`);
      searchFields.push(`${condition.column}:${condition.operator}`);
    });

    this.orders().forEach((order) => {
      orderBy.push(order.column);
      sortedBy.push(order.direction);
    });

    return {
      search,
      searchFields,
      orderBy,
      sortedBy,
      with: this.relations(),
      include: this.relations(),
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
    return new HttpParams({ fromString: this.toQueryString() });
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
