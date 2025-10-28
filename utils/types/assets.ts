/**
 * Asset types enum matching the database enum
 */
export type AssetType =
  | 'cash'
  | 'savings_account'
  | 'investment_portfolio'
  | 'fixed_deposit'
  | 'checking_account'
  | 'retirement_fund'
  | 'cryptocurrency'
  | 'stocks'
  | 'bonds'
  | 'mutual_funds'
  | 'real_estate'
  | 'other';

/**
 * Risk level for investment assets
 */
export type RiskLevel = 'low' | 'medium' | 'high';

/**
 * Asset interface representing the assets table
 */
export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  currency_id: string;
  current_balance: number;
  initial_balance?: number;
  description?: string;
  account_number?: string;
  institution_name?: string;
  interest_rate?: number;
  maturity_date?: string;
  risk_level?: RiskLevel;
  is_liquid: boolean;
  auto_update_balance: boolean;
  last_updated_balance?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  created_by: string;
  is_active: boolean;
}

/**
 * Create asset payload
 */
export interface CreateAssetPayload {
  name: string;
  type: AssetType;
  currency_id: string;
  current_balance: number;
  initial_balance?: number;
  description?: string;
  account_number?: string;
  institution_name?: string;
  interest_rate?: number;
  maturity_date?: string;
  risk_level?: RiskLevel;
  is_liquid?: boolean;
  auto_update_balance?: boolean;
}

/**
 * Update asset payload
 */
export interface UpdateAssetPayload {
  name?: string;
  type?: AssetType;
  currency_id?: string;
  current_balance?: number;
  initial_balance?: number;
  description?: string;
  account_number?: string;
  institution_name?: string;
  interest_rate?: number;
  maturity_date?: string;
  risk_level?: RiskLevel;
  is_liquid?: boolean;
  auto_update_balance?: boolean;
  is_active?: boolean;
}

/**
 * User total assets response from get_user_total_assets function
 */
export interface UserTotalAssets {
  currency_id: string;
  currency_code: string;
  total_balance: number;
  asset_count: number;
}

/**
 * User assets by type response from get_user_assets_by_type function
 */
export interface UserAssetsByType {
  asset_type: AssetType;
  total_balance: number;
  asset_count: number;
  currency_code: string;
}

/**
 * Asset with currency information (for joined queries)
 */
export interface AssetWithCurrency extends Asset {
  currency: {
    id: string;
    code: string;
    symbol?: string;
    name: string;
  };
}

/**
 * Asset summary for dashboard display
 */
export interface AssetSummary {
  totalValue: number;
  totalAssets: number;
  byType: Record<AssetType, number>;
  byCurrency: Record<string, number>;
  liquidAssets: number;
  illiquidAssets: number;
}

/**
 * Asset filter options
 */
export interface AssetFilters {
  type?: AssetType[];
  currency_id?: string[];
  is_liquid?: boolean;
  is_active?: boolean;
  risk_level?: RiskLevel[];
  institution_name?: string;
  maturity_date_from?: string;
  maturity_date_to?: string;
  balance_min?: number;
  balance_max?: number;
}
