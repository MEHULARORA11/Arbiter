import { pgTable, uuid, text, boolean, timestamp, integer, numeric, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import {sql} from 'drizzle-orm'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  googleId: text('google_id').unique().notNull(),
  email: text('email').unique().notNull(),
  emailVerified: boolean('email_verified').default(false),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  totalInputTokens: integer('total_input_tokens').notNull().default(0),
  totalOutputTokens: integer('total_output_tokens').notNull().default(0),
  totalCostUsd: numeric('total_cost_usd', { precision: 12, scale: 6 }).notNull().default('0'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt:timestamp('updated_at') .$onUpdateFn(() => sql`now()`)
});

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  revokedAt: timestamp('revoked_at'),
});

export const chats = pgTable('chats', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull().default('New Conversation'),
  titleGeneratedByModel: text('title_generated_by_model'),
  isTitlePinned: boolean('is_title_pinned').notNull().default(false),
  selectedWorkers: jsonb('selected_workers').$type<string[]>().notNull().default([]),
  selectedEvaluator: text('selected_evaluator'),
  autoTitleModel: text('auto_title_model'),
  totalInputTokens: integer('total_input_tokens').notNull().default(0),
  totalOutputTokens: integer('total_output_tokens').notNull().default(0),
  totalCostUsd: numeric('total_cost_usd', { precision: 12, scale: 6 }).notNull().default('0'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at') .$onUpdateFn(() => sql`now()`)
}, (t) => ({
  userIdUpdatedIdx: index('chats_user_id_updated_idx').on(t.userId, t.updatedAt),
}));

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  chatId: uuid('chat_id').notNull().references(() => chats.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['user', 'assistant', 'system'] }).notNull(),
  content: text('content').notNull(),
  producedByModel: text('produced_by_model'),
  producedByRole: text('produced_by_role', { enum: ['worker', 'evaluator'] }),
  sequence: integer('sequence').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  chatIdSequenceIdx: index('messages_chat_id_sequence_idx').on(t.chatId, t.sequence),
}));

export const messageModelRuns = pgTable('message_model_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  messageId: uuid('message_id').notNull().references(() => messages.id, { onDelete: 'cascade' }),
  chatId: uuid('chat_id').notNull().references(() => chats.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),
  modelId: text('model_id').notNull(),
  role: text('role', { enum: ['worker', 'evaluator'] }).notNull(),
  status: text('status', { enum: ['success', 'key_error', 'rate_limit', 'timeout', 'error'] }).notNull(),
  inputTokens: integer('input_tokens').notNull().default(0),
  cachedTokens: integer('cached_tokens').notNull().default(0),
  outputTokens: integer('output_tokens').notNull().default(0),
  costUsd: numeric('cost_usd', { precision: 12, scale: 6 }).notNull().default('0'),
  latencyMs: integer('latency_ms').notNull().default(0),
  ttftMs: integer('ttft_ms'),
  rawResponse: text('raw_response'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  chatIdIdx: index('message_model_runs_chat_id_idx').on(t.chatId),
  messageIdIdx: index('message_model_runs_message_id_idx').on(t.messageId),
}));

export const apiCredentials = pgTable('api_credentials', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),
  encryptedKey: text('encrypted_key').notNull(),
  iv: text('iv').notNull(),
  authTag: text('auth_tag').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at') .$onUpdateFn(() => sql`now()`)
}, (t) => ({
  userProviderUnique: uniqueIndex('api_credentials_user_provider_idx').on(t.userId, t.provider),
}));
