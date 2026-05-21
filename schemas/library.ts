import { z } from 'zod';

export const inventoryBookSchema = z.object({
  title: z.string().trim().min(2, 'Informe o título.').max(255, 'Título muito longo.'),
  author: z.string().trim().min(2, 'Informe o autor.').max(255, 'Autor muito longo.'),
  description: z.string().trim().max(2000, 'Descrição muito longa.'),
  genre: z.string().trim().max(120, 'Gênero muito longo.'),
  published_year: z.string().trim().regex(/^\d{0,4}$/, 'Use até 4 dígitos.'),
  publisher: z.string().trim().max(160, 'Editora muito longa.'),
  isbn: z.string().trim().max(32, 'ISBN muito longo.'),
  page_count: z.string().trim().regex(/^\d{0,4}$/, 'Use até 4 dígitos.'),
  cover_url: z.string().trim().max(500, 'URL de capa muito longa.'),
  location_label: z.string().trim().max(120, 'Local muito longo.'),
  has_physical_copy: z.boolean(),
  sharing_status: z.enum(['private', 'showcase', 'loan', 'exchange', 'donation']),
});

export type InventoryBookFormValues = z.infer<typeof inventoryBookSchema>;

export const tradeRequestSchema = z.object({
  book_requested_id: z.number().int().positive(),
  book_offered_id: z.number().int().positive().nullable(),
  message: z.string().trim().max(500, 'Mensagem muito longa.'),
});

export type TradeRequestFormValues = z.infer<typeof tradeRequestSchema>;

export const socialPostSchema = z.object({
  intent: z.enum(['need', 'donation', 'exchange', 'loan', 'offer']),
  book_title: z.string().trim().min(2, 'Informe o título.').max(255, 'Título muito longo.'),
  book_author: z.string().trim().min(2, 'Informe o autor.').max(255, 'Autor muito longo.'),
  caption: z.string().trim().max(1200, 'Texto muito longo.'),
  location_label: z.string().trim().max(120, 'Local muito longo.'),
  inventory_book_id: z.number().int().positive().nullable(),
});

export type SocialPostFormValues = z.infer<typeof socialPostSchema>;
