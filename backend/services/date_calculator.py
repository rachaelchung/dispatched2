from datetime import date, timedelta
from dateutil import parser as dateutil_parser
from dateutil.relativedelta import relativedelta, MO, TU, WE, TH, FR, SA, SU
import re

WEEKDAY_MAP = {
    'monday': MO, 'tuesday': TU, 'wednesday': WE,
    'thursday': TH, 'friday': FR, 'saturday': SA, 'sunday': SU
}

def resolve_date_reference(date_ref: str | None) -> date | None:
    """Convert natural language date references to actual dates."""
    if not date_ref:
        return None
    
    try:
        return date.fromisoformat(date_ref)
    except ValueError:
        pass

    # So the rest of this doesn't do much unless the AI for some reason cannot follow instructions and doesn't resolve the date with how it's been prompted to
    ref = date_ref.lower().strip()
    today = date.today()

    if ref in ('today', 'later'):
        return today
    if ref in ('tomorrow',):
        return today + timedelta(days=1)
    if ref in ('yesterday',):
        return today - timedelta(days=1)

    # "next <weekday>"
    next_match = re.match(r'next\s+(\w+)', ref)
    if next_match:
        day_name = next_match.group(1)
        if day_name in WEEKDAY_MAP:
            return today + relativedelta(weekday=WEEKDAY_MAP[day_name](+2))

    # "this <weekday>"
    this_match = re.match(r'this\s+(\w+)', ref)
    if this_match:
        day_name = this_match.group(1)
        if day_name in WEEKDAY_MAP:
            return today + relativedelta(weekday=WEEKDAY_MAP[day_name](+1))

    # bare weekday name
    if ref in WEEKDAY_MAP:
        return today + relativedelta(weekday=WEEKDAY_MAP[ref](+1))

    # "in X days/weeks/months"
    in_match = re.match(r'in\s+(\d+)\s+(day|days|week|weeks|month|months)', ref)
    if in_match:
        n = int(in_match.group(1))
        unit = in_match.group(2).rstrip('s')
        if unit == 'day':
            return today + timedelta(days=n)
        if unit == 'week':
            return today + timedelta(weeks=n)
        if unit == 'month':
            return today + relativedelta(months=n)

    # Try dateutil for explicit dates like "March 15", "2025-04-10", etc.
    try:
        parsed = dateutil_parser.parse(date_ref, default=date(today.year, today.month, today.day))
        return parsed.date()
    except (ValueError, OverflowError):
        pass

    return None