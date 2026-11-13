from open_notebook.utils.book_quotes import (
    book_location_from_chunk,
    keep_exact_locations,
    keep_exact_quotes,
)


def test_keep_exact_quotes_removes_quotes_not_found_verbatim_in_evidence():
    answer = 'The book says “Truth is a path.” It also says “Truth is always easy.”'
    evidence = ["Truth is a path."]

    assert keep_exact_quotes(answer, evidence) == (
        'The book says “Truth is a path.” It also says '
        '“[quote not found verbatim in the retrieved text]”'
    )


def test_keep_exact_quotes_keeps_quotes_from_any_selected_book():
    answer = '“A careful reader asks why.”'
    evidence = ["First passage.", "A careful reader asks why."]

    assert keep_exact_quotes(answer, evidence) == answer


def test_keep_exact_quotes_checks_hebrew_single_curly_quotes():
    answer = "המחבר כתב ‘זו הדרך.’"

    assert keep_exact_quotes(answer, ["זו הדרך."]) == answer


def test_keep_exact_quotes_checks_hebrew_quote_marks():
    answer = "המחבר כתב ״זו הדרך.״"

    assert keep_exact_quotes(answer, ["זו הדרך."]) == answer


def test_book_location_from_chunk_returns_explicit_chapter_or_page_markers():
    assert book_location_from_chunk("## Chapter 4: The Crossing\nPassage text") == (
        "Chapter 4: The Crossing"
    )
    assert book_location_from_chunk("# Page 17\nPassage text") == "Page 17"
    assert book_location_from_chunk("## פרק 2: המסע\nטקסט") == "פרק 2: המסע"
    assert book_location_from_chunk("Passage without a location") is None


def test_keep_exact_locations_marks_unverified_page_references():
    answer = "The point appears on Page 17, with context in Chapter 4: The Crossing."
    evidence = ["# Page 17\nText", "## Chapter 4: The Crossing\nText"]

    assert keep_exact_locations(answer, evidence) == answer
    assert keep_exact_locations("See Page 18.", evidence) == (
        "See [location not found in extracted text]."
    )
