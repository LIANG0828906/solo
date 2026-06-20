export type ModuleType = 'searchBar' | 'userCard' | 'dataTable';

export interface SearchBarProps {
  placeholder: string;
  borderRadius: number;
  backgroundColor: string;
}

export interface UserCardProps {
  avatarUrl: string;
  name: string;
  role: string;
  tagColor: string;
}

export interface DataTableProps {
  columns: string[];
  rows: string[][];
}

export type ModuleProps = SearchBarProps | UserCardProps | DataTableProps;

export interface ModuleInstance {
  id: string;
  type: ModuleType;
  x: number;
  y: number;
  width: number;
  height: number;
  props: ModuleProps;
}

export interface LayoutData {
  modules: ModuleInstance[];
  zoom: number;
}
