import { router } from 'expo-router';

import type { CatalogBook } from '@/hooks/useLibrary';

export function openCatalogBook(book: CatalogBook) {
  router.push({
    pathname: '/(app)/book-form',
    params: {
      title: book.title,
      author: book.author,
      description: book.description,
      genre: book.genre,
      publishedYear: book.published_year ? String(book.published_year) : '',
      publisher: book.publisher,
      isbn: book.isbn,
      pageCount: book.page_count ? String(book.page_count) : '',
      coverUrl: book.cover_url,
    },
  });
}
