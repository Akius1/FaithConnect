// react-table-config.d.ts
import 'react-table';
import {
  UsePaginationOptions,
  UsePaginationInstanceProps,
  UsePaginationState,
} from 'react-table';

declare module 'react-table' {
  // Extend table options with pagination
  export interface TableOptions<D extends object>
    extends UsePaginationOptions<D> {}
  
  // Extend the table instance with pagination instance props
  export interface TableInstance<D extends object = {}>
    extends UsePaginationInstanceProps<D> {}
  
  // Extend the table state with pagination state
  export interface TableState<D extends object = {}>
    extends UsePaginationState<D> {}
}
