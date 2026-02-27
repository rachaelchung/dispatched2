from datetime import date, timedelta
from dateutil import parser as dateutil_parser
from dateutil.relativedelta import relativedelta, MO, TU, WE, TH, FR, SA, SU
import re

def manualParse(message : str | None) -> dict:
    # manual implementation so there is still some minor parsing if AI does not work for some reason or confirms undated tasks are still "undated"
    today = date.today()
    todayWeekday = today.weekday() # Monday=0, Sunday=6
    content = message.lower()
    taskDate = None
    taskTitle = message

    if 'today' in content or 'later' in content:
        index = content.find('today') if 'today' in content else content.find('later')
        taskTitle = message[:index] + message[index+5:]
        taskDate = today
    if 'tomorrow' in content:
        index = content.find('tomorrow')
        taskTitle = message[:index] + message[index+8:]
        taskDate = today + timedelta(days=1)
    if 'yesterday' in content:
        index = content.find('yesterday')
        taskTitle = message[:index] + message[index+9:]
        taskDate = today - timedelta(days=1)
    
    # in _ days
    if 'in ' in content and ' day' in content:
        index1 = content.find('in ')
        index2 = content.find(' day')
        taskTitle = message[:index1] + message[index2+4:]
        taskDate = today + timedelta(days=1)
    if 'in ' in content and ' days' in content:
        inSplit = content.split('in ')[1]
        daySplit = inSplit.split(' days')[0]
        if daySplit.isdigit():
            index1 = content.find('in ')
            index2 = content.find(' days')
            taskTitle = message[:index1] + message[index2+5:]
            taskDate = today + timedelta(days=int(daySplit))
        
    # in _ weeks
    if 'in ' in content and ' week' in content:
        index1 = content.find('in ')
        index2 = content.find(' week')
        taskTitle = message[:index1] + message[index2+5:]
        taskDate = today + timedelta(weeks=1)
    elif 'in ' in content and ' weeks' in content:
        inSplit = content.split('in ')[1]
        weekSplit = inSplit.split(' weeks')[0]
        if weekSplit.isdigit():
            index1 = content.find('in ')
            index2 = content.find(' weeks')
            taskTitle = message[:index1] + message[index2+6:]
            taskDate = today + timedelta(weeks=int(weekSplit))
        
    # in _ months
    if 'in ' in content and ' month' in content:
        index1 = content.find('in ')
        index2 = content.find(' month')
        taskTitle = message[:index1] + message[index2+6:]
        taskDate = today + relativedelta(months=1)
    elif 'in ' in content and ' months' in content:
        inSplit = content.split('in ')[1]
        monthSplit = inSplit.split(' months')[0]
        if monthSplit.isdigit():
            index1 = content.find('in ')
            index2 = content.find(' months')
            taskTitle = message[:index1] + message[index2+7:]
            taskDate = today + relativedelta(months=int(monthSplit))
    
    # week days
    if 'monday' in content or 'mon' in content:
        if 'next monday' in content and today.weekday() == 0:
            index = content.find('next monday')
            taskTitle = message[:index] + message[index+11:]
            taskDate = today + timedelta(days=7)
        elif today.weekday() == 0:
            index = content.find('monday') if 'monday' in content else content.find('mon')
            if 'monday' in content:
                taskTitle = message[:index] + message[index+6:]
            else:
                taskTitle = message[:index] + message[index+3:]
            taskDate = today
        else:
            index = content.find('monday') if 'monday' in content else content.find('mon')
            if 'monday' in content:
                taskTitle = message[:index] + message[index+6:]
            else:
                taskTitle = message[:index] + message[index+3:]
            taskDate = today + relativedelta(weekday=MO(+1))
    if 'tuesday' in content or 'tue' in content:
        if 'next tuesday' in content and today.weekday() == 1:
            index = content.find('next tuesday')
            taskTitle = message[:index] + message[index+12:]
            taskDate = today + timedelta(days=7)
        elif today.weekday() == 1:
            index = content.find('tuesday') if 'tuesday' in content else content.find('tue')
            if 'tuesday' in content:
                taskTitle = message[:index] + message[index+7:]
            else:                
                taskTitle = message[:index] + message[index+3:]
            taskDate = today
        else:
            index = content.find('tuesday') if 'tuesday' in content else content.find('tue')
            if 'tuesday' in content:
                taskTitle = message[:index] + message[index+7:]
            else:                
                taskTitle = message[:index] + message[index+3:]
            taskDate = today + relativedelta(weekday=TU(+1))
    if 'wednesday' in content or 'wed' in content:
        if 'next wednesday' in content and today.weekday() == 2:
            index = content.find('next wednesday')
            taskTitle = message[:index] + message[index+14:]
            taskDate = today + timedelta(days=7)
        elif today.weekday() == 2:
            index = content.find('wednesday') if 'wednesday' in content else content.find('wed')
            if 'wednesday' in content:
                taskTitle = message[:index] + message[index+9:]
            else:                
                taskTitle = message[:index] + message[index+3:]
            taskDate = today
        else:
            index = content.find('wednesday') if 'wednesday' in content else content.find('wed')
            if 'wednesday' in content:
                taskTitle = message[:index] + message[index+9:]
            else:                
                taskTitle = message[:index] + message[index+3:]
            taskDate = today + relativedelta(weekday=WE(+1))
    if 'thursday' in content or 'thurs' in content:
        if 'next thursday' in content and today.weekday() == 3:
            index = content.find('next thursday')
            taskTitle = message[:index] + message[index+13:]
            taskDate = today + timedelta(days=7)
        elif today.weekday() == 3:
            index = content.find('thursday') if 'thursday' in content else content.find('thurs')
            if 'thursday' in content:
                taskTitle = message[:index] + message[index+8:]
            else:                
                taskTitle = message[:index] + message[index+5:]
            taskDate = today
        else:
            index = content.find('thursday') if 'thursday' in content else content.find('thurs')
            if 'thursday' in content:
                taskTitle = message[:index] + message[index+8:]
            else:                
                taskTitle = message[:index] + message[index+5:]
            taskDate = today + relativedelta(weekday=TH(+1))
    if 'friday' in content or 'fri' in content:
        if 'next friday' in content and today.weekday() == 4:
            index = content.find('next friday')
            taskTitle = message[:index] + message[index+11:]
            taskDate = today + timedelta(days=7)
        elif today.weekday() == 4:
            index = content.find('friday') if 'friday' in content else content.find('fri')
            if 'friday' in content:
                taskTitle = message[:index] + message[index+6:]
            else:                
                taskTitle = message[:index] + message[index+3:]
            taskDate = today
        else:
            index = content.find('friday') if 'friday' in content else content.find('fri')
            if 'friday' in content:
                taskTitle = message[:index] + message[index+6:]
            else:                
                taskTitle = message[:index] + message[index+3:]
            taskDate = today + relativedelta(weekday=FR(+1))
    if 'saturday' in content or 'sat' in content:
        if 'next saturday' in content and today.weekday() == 5:
            index = content.find('next saturday')
            taskTitle = message[:index] + message[index+13:]
            taskDate = today + timedelta(days=7)
        elif today.weekday() == 5:
            index = content.find('saturday') if 'saturday' in content else content.find('sat')
            if 'saturday' in content:
                taskTitle = message[:index] + message[index+8:]
            else:                
                taskTitle = message[:index] + message[index+3:]
            taskDate = today
        else:
            index = content.find('saturday') if 'saturday' in content else content.find('sat')
            if 'saturday' in content:
                taskTitle = message[:index] + message[index+8:]
            else:                
                taskTitle = message[:index] + message[index+3:]
            taskDate = today + relativedelta(weekday=SA(+1))
    if 'sunday' in content or 'sun' in content:
        if 'next sunday' in content and today.weekday() == 6:
            index = content.find('next sunday')
            taskTitle = message[:index] + message[index+11:]
            taskDate = today + timedelta(days=7)
        elif today.weekday() == 6:
            index = content.find('sunday') if 'sunday' in content else content.find('sun')
            if 'sunday' in content:
                taskTitle = message[:index] + message[index+6:]
            else:                
                taskTitle = message[:index] + message[index+3:]
            taskDate = today
        else:
            index = content.find('sunday') if 'sunday' in content else content.find('sun')
            if 'sunday' in content:
                taskTitle = message[:index] + message[index+6:]
            else:                
                taskTitle = message[:index] + message[index+3:]
            taskDate = today + relativedelta(weekday=SU(+1))
    
        
    if 'end of week' in content:
        index = content.find('end of week')
        taskTitle = message[:index] + message[index+11:]
        if today.weekday() == 5: # saturday
            taskDate = today
        else:
            taskDate = today + relativedelta(weekday=SA(+1))
        
    if 'next week' in content:
        index = content.find('next week')
        taskTitle = message[:index] + message[index+9:]
        taskDate = today + timedelta(weeks=1)
        
    return {
            "tasks": [{
                "title": taskTitle.strip(),
                "date_reference": taskDate.isoformat() if taskDate else None,
                "time": None,
                "description": None
            }],
            "is_edit_of_previous": False,
            "edit_field": None,
            "edit_value": None,
            "possible_duplicate_title": None
        }