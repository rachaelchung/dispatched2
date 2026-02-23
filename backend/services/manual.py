from datetime import date, timedelta
from dateutil import parser as dateutil_parser
from dateutil.relativedelta import relativedelta, MO, TU, WE, TH, FR, SA, SU
import re

def manualDate(message):
    # manual implementation so there is still some minor parsing if AI does not work for some reason
    today = date.today()
    return