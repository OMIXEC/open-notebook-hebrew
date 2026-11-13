"""Guard verbatim quotations in book Ask answers against retrieved evidence."""

import re
from collections.abc import Iterable

_QUOTED_TEXT = re.compile(
    r'“([^”]+)”|‘([^’]+)’|״([^״]+)״|"([^"\n]+)"', re.DOTALL
)
_UNVERIFIED_QUOTE = "[quote not found verbatim in the retrieved text]"
_LOCATION = re.compile(
    r"(?im)^\s*(?:#{1,3}\s*)?(Page\s+\d+|Chapter\s+[^\n#]+|"
    r"עמוד\s+\d+|פרק\s+[^\n#]+)\s*#*\s*$"
)
_LOCATION_CLAIM = re.compile(
    r"(?i)(?:\b(?:page\s+\d+|chapter\s+[^.;,\]\n]+)|עמוד\s+\d+|פרק\s+[^.;,\]\n]+)"
)


def book_location_from_chunk(text: str) -> str | None:
    """Return an explicit page or chapter marker present in an extracted chunk."""
    locations = _LOCATION.findall(text)
    return locations[-1].strip() if locations else None


def keep_exact_locations(answer: str, evidence: Iterable[str]) -> str:
    """Mark page/chapter claims that are not explicit in retrieved passages."""
    locations = {
        location.strip().casefold()
        for passage in evidence
        for location in _LOCATION.findall(passage)
    }

    def replace(match: re.Match[str]) -> str:
        claim = match.group(0).strip()
        if claim.casefold() in locations:
            return claim
        return "[location not found in extracted text]"

    return _LOCATION_CLAIM.sub(replace, answer)


def keep_exact_quotes(answer: str, evidence: Iterable[str]) -> str:
    """Mark quoted spans that are not exact substrings of retrieved passages."""
    passages = tuple(text for text in evidence if text)

    def replace(match: re.Match[str]) -> str:
        quote = next((part for part in match.groups() if part is not None), "")
        if any(quote in passage for passage in passages):
            return match.group(0)
        if match.group(1) is not None:
            left, right = "“", "”"
        elif match.group(2) is not None:
            left, right = "‘", "’"
        elif match.group(3) is not None:
            left, right = "״", "״"
        else:
            left, right = '"', '"'
        return f"{left}{_UNVERIFIED_QUOTE}{right}"

    return _QUOTED_TEXT.sub(replace, answer)
