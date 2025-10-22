import { QueryRunner } from 'typeorm'

/**
 * Helper functions for database migrations
 */

/**
 * Value types for user settings
 */
export enum UserSettingValueType {
  string = 0,
  int = 1,
  float = 2,
  object = 3,
  array = 4,
  boolean = 5,
}

/**
 * Options for adding a user setting
 */
export interface AddUserSettingOptions {
  /** Default value for all platforms */
  defaultValue: string
  /** Value type from UserSettingValueType enum */
  valueType: UserSettingValueType
  /** Optional user value */
  userValue?: string | null
  /** Optional Linux-specific default */
  linuxDefault?: string
  /** Optional Mac-specific default */
  macDefault?: string
  /** Optional Windows-specific default */
  windowsDefault?: string
  /** Use INSERT OR IGNORE instead of INSERT */
  insertOrIgnore?: boolean
}

/**
 * Setting configuration for batch operations
 */
export interface UserSettingConfig {
  key: string
  options: AddUserSettingOptions
}

/**
 * Helper to create a user setting insertion migration
 */
export async function addUserSetting(
  runner: QueryRunner,
  key: string,
  options: AddUserSettingOptions
): Promise<void> {
  const {
    defaultValue,
    valueType,
    userValue = null,
    linuxDefault = '',
    macDefault = '',
    windowsDefault = '',
    insertOrIgnore = false
  } = options

  // Validate required fields
  if (!key || defaultValue === undefined || valueType === undefined) {
    throw new Error(`Missing required fields for user setting: key=${key}, defaultValue=${defaultValue}, valueType=${valueType}`)
  }

  const insertClause = insertOrIgnore ? 'INSERT OR IGNORE' : 'INSERT'

  // Determine which columns to use based on provided fields
  const hasUserValue = userValue !== null && userValue !== undefined
  const hasPlatformDefaults = linuxDefault || macDefault || windowsDefault

  let query: string

  if (hasPlatformDefaults || hasUserValue) {
    // Full format with all columns
    query = `
      ${insertClause} INTO user_setting(
        key,
        userValue,
        defaultValue,
        linuxDefault,
        macDefault,
        windowsDefault,
        valueType
      ) VALUES (
        '${key}',
        ${hasUserValue ? `'${userValue}'` : 'NULL'},
        '${defaultValue}',
        '${linuxDefault}',
        '${macDefault}',
        '${windowsDefault}',
        ${valueType}
      )
    `
  } else {
    // Simple format with just key, defaultValue, and valueType
    query = `
      ${insertClause} INTO user_setting(key, defaultValue, valueType)
      VALUES ('${key}', '${defaultValue}', ${valueType})
    `
  }

  await runner.query(query)
}

/**
 * Helper to create multiple user setting insertion migrations at once
 */
export async function addUserSettings(
  runner: QueryRunner,
  settings: UserSettingConfig[]
): Promise<void> {
  for (const { key, options } of settings) {
    await addUserSetting(runner, key, options)
  }
}
