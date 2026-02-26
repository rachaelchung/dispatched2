from datetime import date, timedelta
from dateutil import parser as dateutil_parser
from dateutil.relativedelta import relativedelta, MO, TU, WE, TH, FR, SA, SU
import re

def manualDate(message):
    # manual implementation so there is still some minor parsing if AI does not work for some reason or confirms undated tasks are still "undated"
    today = date.today()
    todayWeekday = today.weekday() # Monday=0, Sunday=6
    content = message.content.lower()

    if 'today' in content or 'later' in content:
        return today
    if 'tomorrow' in content:
        return today + timedelta(days=1)
    if 'yesterday' in content:
        return today - timedelta(days=1)
    
    # in _ days
    if 'in ' in content and ' day' in content:
        return today + timedelta(days=1)
    if 'in ' in content and ' days' in content:
        inSplit = content.split('in ')[1]
        daySplit = inSplit.split(' days')[0]
        if daySplit.isdigit():
            return today + timedelta(days=int(daySplit))
        
    # in _ weeks
    if 'in ' in content and ' week' in content:
        return today + timedelta(weeks=1)
    elif 'in ' in content and ' weeks' in content:
        inSplit = content.split('in ')[1]
        weekSplit = inSplit.split(' weeks')[0]
        if weekSplit.isdigit():
            return today + timedelta(weeks=int(weekSplit))
        
    # in _ months
    if 'in ' in content and ' month' in content:
        return today + relativedelta(months=1)
    elif 'in ' in content and ' months' in content:
        inSplit = content.split('in ')[1]
        monthSplit = inSplit.split(' months')[0]
        if monthSplit.isdigit():
            return today + relativedelta(months=int(monthSplit))
    
    # week days
    if 'monday' in content or 'mon' in content:
        if 'next monday' in content and today.weekday() == 0:
            return today + timedelta(days=7)
        elif today.weekday() == 0:
            return today
        else:
            return today + relativedelta(weekday=MO(+1))
    if 'tuesday' in content or 'tue' in content:
        if 'next tuesday' in content and today.weekday() == 1:
            return today + timedelta(days=7)
        elif today.weekday() == 1:
            return today
        else:
            return today + relativedelta(weekday=TU(+1))
    if 'wednesday' in content or 'wed' in content:
        if 'next wednesday' in content and today.weekday() == 2:
            return today + timedelta(days=7)
        elif today.weekday() == 2:
            return today
        else:
            return today + relativedelta(weekday=WE(+1))
    if 'thursday' in content or 'thurs' in content:
        if 'next thursday' in content and today.weekday() == 3:
            return today + timedelta(days=7)
        elif today.weekday() == 3:
            return today
        else:
            return today + relativedelta(weekday=TH(+1))
    if 'friday' in content or 'fri' in content:
        if 'next friday' in content and today.weekday() == 4:
            return today + timedelta(days=7)
        elif today.weekday() == 4:
            return today
        else:
            return today + relativedelta(weekday=FR(+1))
    if 'saturday' in content or 'sat' in content:
        if 'next saturday' in content and today.weekday() == 5:
            return today + timedelta(days=7)
        elif today.weekday() == 5:
            return today
        else:
            return today + relativedelta(weekday=SA(+1))
    if 'sunday' in content or 'sun' in content:
        if 'next sunday' in content and today.weekday() == 6:
            return today + timedelta(days=7)
        elif today.weekday() == 6:
            return today
        else:
            return today + relativedelta(weekday=SU(+1))
        
    return None