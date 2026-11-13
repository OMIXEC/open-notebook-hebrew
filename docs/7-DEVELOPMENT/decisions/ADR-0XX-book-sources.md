# ADR-0XX: Represent books as source records

- **Status**: Accepted
- **Date**: 2026-11
- **Related**: None

## Context

The Books library needs to reuse the existing upload, extraction, embedding, and source-citation paths for PDF and EPUB files. Users also need to select several books and ask questions across that selection without mixing in other notebook sources.

## Decision

Represent each book as a `source` record with `kind = 'book'` and optional author/ISBN metadata. Keep book library filtering and book-scoped Ask as views and queries over those source records; validate selected book IDs before retrieval and cite the parent source IDs.

## Alternatives considered

- Add a separate `book` table: rejected because it would duplicate source ingestion, extraction, embedding, and citation behavior.
- Treat books as ordinary sources without a kind: rejected because the library could not distinguish books or enforce book-only retrieval.

## Consequences

- Books inherit the existing asynchronous source processing and PDF/EPUB extraction support.
- Book Ask can restrict vector search to selected source IDs and validate quotes against retrieved passages.
- Page and chapter references remain best-effort; they are included only when extraction preserves an explicit location marker.
- Source schema changes require a migration and legacy sources must be assigned the default `source` kind.
