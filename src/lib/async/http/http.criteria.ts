import { toCamel, isString } from '../../services/utils/helpers';
import { WhereItem, WhereOptions, OrderItem, Operator, Value, OrderDirection, Column, ColumnItem, Comparison, Fields, Pairs } from './types';

export class RequestCriteria<TSearchForm> {
  public form: TSearchForm;
  private wheres: WhereItem[] = [];
  private orders: OrderItem[] = [];
  private relations: string[] = [];
  private filters: string[] = [];
  private limitPerPage: number = 30;
  private pageNo: number = 1;
  private searchJoinComparison: Comparison = 'and';
  private operators: string[] = ['=', 'like'];

  constructor(form: TSearchForm) {
    this.form = form;
  }

  where(column: string | Column, operator: Operator | Value = null, value: Value = null, options?: WhereOptions) {
    if (Array.isArray(column)) {
      return this.whereArray(column);
    }

    [value, operator] = this.prepareValueAndOperator(value, operator, arguments.length === 2);

    if (!isString(operator)) {
      value = operator;
      operator = '=';
    }

    if (!this.operators.includes(operator)) {
      operator = '=';
    }

    // clean old existance of same column
    this.wheres = this.wheres.filter((w) => w.column !== column);

    this.wheres.push({
      column,
      operator,
      value,
      options
    });

    return this;
  }

  filter(filters: string[]) {
    this.filters = filters;

    return this;
  }

  with(relationship: string) {
    this.relations.push(relationship);

    return this;
  }

  searchJoin(comparison: Comparison) {
    this.searchJoinComparison = comparison;

    return this;
  }

  orderBy(column: string, direction: OrderDirection = 'asc') {
    this.orders.push({
      column,
      direction
    });

    return this;
  }

  orderByDesc(column: string) {
    return this.orderBy(column, 'desc');
  }

  page(page: number) {
    this.pageNo = page;

    return this;
  }

  limit(limit: number) {
    this.limitPerPage = limit;

    return this;
  }

  /**
   *
   * @param field column name(s) to be searched in, string, comma separated or array
   * @param value
   */
  setSearchField(fields: string | string[], value: string) {
    const formFields = Object.keys(this.form);
    if (!Array.isArray(fields)) {
      fields = fields.split(',');
    }
    fields.map((f) => {
      if (formFields.includes(toCamel(f))) {
        this.form[toCamel(f)].value = value ?? '';
      }
    });
  }

  /**
   * Multiple where nested, such as [[column, value], [column, operator, value]]
   * @param {array} column
   */
  protected whereArray(column: Column) {
    column.forEach((item: ColumnItem) => {
      this.where.apply(this, item);
    });

    return this;
  }

  protected feedWhereFromSearchForm() {
    if (this.form) {
      for (const f in this.form) {
        const field = this.form[f] as WhereItem;
        if (field.value) {
          this.where(field.column, field.operator, field.value, field.options);
        } else {
          this.wheres = this.wheres.filter((c) => c.column !== field.column);
        }
      }
    }
  }

  protected prepareValueAndOperator(value: Value, operator: Operator | Value, useDefault = false) {
    if (useDefault) {
      return [operator, '='];
    }

    return [value, operator];
  }

  protected parseFields(): Fields {
    const search: string[] = [];
    const searchFields: string[] = [];
    const orderBy: string[] = [];
    const sortedBy: string[] = [];

    this.feedWhereFromSearchForm();

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

  toPairs(): Pairs {
    const fields = this.parseFields();
    const keys = Object.keys(fields);
    let pairs: Pairs = {};

    return keys.reduce((acc, key) => {
      if (fields[key] && Array.isArray(fields[key]) && fields[key].length > 0) {
        acc[key] = fields[key].join(';');
      }
      return acc;
    }, pairs);
  }

  toString(): string {
    const fields = this.parseFields();
    const keys = Object.keys(fields);
    let str = '';

    keys.forEach((key) => {
      if (Array.isArray(fields[key]) && fields[key].length > 0) {
        str += `${key}=${fields[key].join(';')}&`;
      }
    });

    // Trim `&` at the end
    str = str.substring(0, str.length - 1);

    return str;
  }

  searchCriteriaToUrlParams(): string {
    const search: string[] = [];
    this.feedWhereFromSearchForm();

    this.wheres.forEach((field) => {
      if (field?.options?.url !== false) search.push(`${field.column}:${field.value}`);
    });

    let str = '';
    if (Array.isArray(search) && search.length > 0) {
      str += `?search=${search.join(';')}`;
    }
    return str;
  }

  urlParamsToSearchCriteria(searchString: string): void {
    const formFields = Object.keys(this.form);
    let reverseCommaSplitted = searchString.split(',');
    reverseCommaSplitted.map((str) => {
      let f = str.split(':');
      if (formFields.includes(toCamel(f[0]))) {
        this.form[toCamel(f[0])].value = f[1] ?? '';
      }
    });
  }
}