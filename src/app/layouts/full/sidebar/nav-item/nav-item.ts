
export interface NavItem {
  displayName?: string;
  divider?: boolean;
  iconName?: string;
  navCap?: string;
  route?: string;
  expanded?: boolean;
  children?: NavItem[];
  roles?: string[];
  chip?: boolean;
  chipContent?: string;
  chipClass?: string;
  external?: boolean;
  subItemIcon?: boolean;
}
