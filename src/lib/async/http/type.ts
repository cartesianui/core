export type Operator = string;

export type Value = string | string[] | number | number[] | null;

export type OrderDirection = 'asc' | 'desc';

export type ColumnItem = [string, Operator | Value, Value?];

export type Column = Array<ColumnItem>;

export type Comparison = 'and' | 'or';

export interface WhereItem {
  column: string;
  operator: Operator;
  value: Value;
}

export interface OrderItem {
  column: string;
  direction: OrderDirection;
}

export interface Fields {
  search: string[];
  searchFields: string[];
  orderBy: string[];
  sortedBy: string[];
  with: string[];
  filter: string[];
  page: number[];
  limit: number[];
  searchJoin: [Comparison];
  [key: string]: Fields[keyof Fields];
}

export interface Pairs {
  search?: string;
  searchFields?: string;
  orderBy?: string;
  sortedBy?: string;
  with?: string;
  filter?: string;
  page?: string;
  limit?: string;
  searchJoin?: string;
  [key: string]: Pairs[keyof Pairs];
}
