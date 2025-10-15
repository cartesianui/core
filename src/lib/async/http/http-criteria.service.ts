import { HttpParams } from '@angular/common/http';
import { toCamel, isString } from '../../utils/helpers';
import { WhereItem, WhereOptions, OrderItem, Operator, Value, OrderDirection, Column, ColumnItem, Comparison, Fields, SearchForm, Pairs } from './types';

export class RequestCriteria {

  public form: SearchForm;
  private wheres: WhereItem[] = [];
  private orders: OrderItem[] = [];
  private relations: string[] = [];
  private filters: string[] = [];
  private limitPerPage: number = 30;
  private pageNo: number = 1;
  private searchJoinComparison: Comparison = 'and';
  private operators: string[] = ['=', 'like'];

  constructor(form?: SearchForm) {
    this.form = form ?? {} as SearchForm;
  }

  //-----------------------------------------------
  //                     Setters
  //-----------------------------------------------

  where(column: string | Column, operator: Operator | Value = null, value: Value = null, options?: WhereOptions) {
    if (Array.isArray(column)) return this.whereArray(column);

    const [resolvedValue, resolvedOperator] = this.resolveOperatorValue(value, operator, arguments.length === 2);
    const finalOperator = this.operators.includes(resolvedOperator) ? resolvedOperator : '=';

    this.wheres = this.wheres.filter(w => w.column !== column);
    this.wheres.push({ column, operator: finalOperator, value: resolvedValue, options });
    return this;
  }

  /**
   * Multiple where nested, such as [[column, value], [column, operator, value]]
   * @param {array} column
   */
  private whereArray(column: Column) {
    column.forEach((item: ColumnItem) => {
      this.where.apply(this, item);
    });
    return this;
  }

  filter(filters: string[]) {
    const clone = this.clone();
    clone.filters = filters;
    return clone;
  }

  with(relationship: string) {
    const clone = this.clone();
    clone.relations = [...this.relations, relationship];
    return clone;
  }

  searchJoin(comparison: Comparison) {
    const clone = this.clone();
    clone.searchJoinComparison = comparison;
    return clone;
  }

  orderBy(column: string, direction: OrderDirection = 'asc') {
    const clone = this.clone();
    clone.orders = [...this.orders, { column, direction }];
    return clone;
  }

  orderByDesc(column: string) {
    return this.orderBy(column, 'desc');
  }

  page(page: number) {
    const clone = this.clone();
    clone.pageNo = page;
    return clone;
  }

  limit(limit: number) {
    const clone = this.clone();
    clone.limitPerPage = limit;
    return clone;
  }

  initForm(urlSearchString: string): void {
    if (!urlSearchString) return;

    const entries: [string, string][] = urlSearchString
      .split(',')
      .map((str): [string, string] => {
        const [key = '', val = ''] = str.split(':');
        return [key.trim(), val.trim()];
      });

    this.applyFormUpdates(entries);
  }

  updateForm(fields: string | string[], value: string): this {
    const list = Array.isArray(fields)
      ? fields
      : fields.split(',').map(f => f.trim());

    const entries: [string, string][] = list.map(
      (f): [string, string] => [f, value ?? '']
    );

    this.applyFormUpdates(entries);
    return this;
  }

  //-----------------------------------------------
  //                 Getters
  //-----------------------------------------------
  toPairs(): Pairs {
    const fields = this.parseCriteria();
    return Object.entries(fields).reduce((acc, [key, val]) => {
      if (Array.isArray(val) && val.length > 0) {
        acc[key] = val.join(';');
      }
      return acc;
    }, {} as Pairs);
  }

  toString(): string {
    return new URLSearchParams(this.toPairs() as Record<string, string>).toString();
  }

  toHttpParams(): HttpParams {
    return new HttpParams({ fromString: this.toString() });
  }

  toUrlParams(): string {
    const search: string[] = [];
    this.syncWhereFromForm();

    this.wheres.forEach((field) => {
      if (field?.options?.url !== false) search.push(`${field.column}:${field.value}`);
    });

    let str = '';
    if (Array.isArray(search) && search.length > 0) {
      str += `?search=${search.join(';')}`;
    }
    return str;
  }


  //-----------------------------------------------
  //                     Helpers
  //-----------------------------------------------
  private clone(): RequestCriteria {
    const copy = new RequestCriteria(this.form);
    Object.assign(copy, this);
    // ensure deep clone for arrays
    copy.wheres = [...this.wheres];
    copy.orders = [...this.orders];
    copy.relations = [...this.relations];
    copy.filters = [...this.filters];
    return copy;
  }

  private syncWhereFromForm() {
    if (!this.form) return this;

    Object.entries(this.form).forEach(([_, field]) => {
      const f = field as WhereItem;
      if (f?.value) {
        this.where(f.column, f.operator, f.value, f.options);
      } else {
        this.wheres = this.wheres.filter((c) => c.column !== f.column);
      }
    });

    return this;
  }

  private parseCriteria(): Fields {
    const search: string[] = [];
    const searchFields: string[] = [];
    const orderBy: string[] = [];
    const sortedBy: string[] = [];

    this.syncWhereFromForm();

    this.wheres.forEach((condition) => {
      search.push(`${condition.column}:${condition.value}`);
      searchFields.push(`${condition.column}:${condition.operator}`);
    });

    this.orders.forEach((order) => {
      orderBy.push(order.column);
      sortedBy.push(order.direction);
    });

    return {
      search,
      searchFields,
      orderBy,
      sortedBy,
      with: this.relations,
      include: this.relations,
      filter: this.filters,
      page: [this.pageNo],
      limit: [this.limitPerPage],
      searchJoin: [this.searchJoinComparison]
    };
  }

  private applyFormUpdates(entries: [string, string][]): void {
    if (!this.form) return;

    const formFields = Object.keys(this.form);
    for (const [key, val] of entries) {
      const fieldKey = toCamel(key);
      if (formFields.includes(fieldKey)) {
        this.form[fieldKey].value = val ?? '';
      }
    }
  }

  private resolveOperatorValue(value: Value, operator: Operator | Value, useDefault: boolean): [Value, Operator] {
    if (useDefault) return [operator as Value, '='];
    if (!isString(operator)) return [operator as Value, '='];
    return [value, operator as Operator];
  }

  // private prepareValueAndOperator(value: Value, operator: Operator | Value, useDefault = false) {
  //   if (useDefault) {
  //     return [operator, '='];
  //   }
  //   return [value, operator];
  // }
}