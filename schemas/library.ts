import { z } from 'zod';

const optionalUrl = z
  .string()
  .trim()
  .max(500, 'URL muito longa.')
  .refine((value) => value === '' || /^https?:\/\//i.test(value), 'Use uma URL iniciada em http:// ou https://.');

export const inventoryBookSchema = z.object({
  title: z.string().trim().min(2, 'Informe o título.').max(255, 'Título muito longo.'),
  author: z.string().trim().min(2, 'Informe o autor.').max(255, 'Autor muito longo.'),
  description: z.string().trim().max(2000, 'Descrição muito longa.'),
  cover_url: optionalUrl,
  location_label: z.string().trim().max(120, 'Local muito longo.'),
  has_physical_copy: z.boolean(),
  sharing_status: z.enum(['private', 'showcase', 'loan', 'exchange', 'donation']),
});

export type InventoryBookFormValues = z.infer<typeof inventoryBookSchema>;

export const socialPostSchema = z.object({
  intent: z.enum(['need', 'donation', 'exchange', 'loan', 'offer']),
  book_title: z.string().trim().min(2, 'Informe o título.').max(255, 'Título muito longo.'),
  book_author: z.string().trim().min(2, 'Informe o autor.').max(255, 'Autor muito longo.'),
  caption: z.string().trim().max(1200, 'Texto muito longo.'),
  location_label: z.string().trim().max(120, 'Local muito longo.'),
  inventory_book_id: z.number().int().positive().nullable(),
});

export type SocialPostFormValues = z.infer<typeof socialPostSchema>;
