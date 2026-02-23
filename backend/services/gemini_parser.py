import json
import os
from datetime import date, timedelta
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))

SYSTEM_PROMPT = """You are a task extraction assistant for a productivity app called DISPATCH.
Your job is to parse user messages and extract tasks with metadata.

Extract tasks from the message and return a JSON object with this exact structure:
{
  "tasks": [
    {
      "title": "short, clear task title",
      "date_reference": "raw date phrase or null",
      "time": "HH:MM in 24h format or null",
      "description": "optional extra context or null"
    }
  ],
  "is_edit_of_previous": false,
  "edit_field": null,
  "edit_value": null,
  "possible_duplicate_title": null
}

Rules:
- A message can contain multiple tasks
- If user says "actually", "change that", "make that", "update" → set is_edit_of_previous: true
- edit_field should be: "title", "date", "time", "tag", or "description"
- edit_value should be the new value as a string
- If a task seems like it might already exist (same subject matter), set possible_duplicate_title
- If no date is mentioned, date_reference should be null
- Keep titles concise (5 words or fewer ideally)
- Return ONLY valid JSON, no markdown, no explanation
"""

def parse_message(content: str, recent_tasks: list = None) -> dict:
    """Parse a user message and extract task data using OpenAI."""
    try:
        context = ""
        if recent_tasks:
            task_list = "\n".join([f"- [{t['id']}] {t['title']}" for t in recent_tasks[:10]])
            context = f"\n\nRecent tasks in the user's list:\n{task_list}\n\nIf the new message seems to duplicate one of these, set possible_duplicate_title to the matching title."

        today_str = date.today().strftime('%A, %B %d, %Y')

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT + f"\n\nToday's date is {today_str}. Resolve all date references to actual YYYY-MM-DD format in the date_reference field instead of raw phrases." + context},
                {"role": "user", "content": content}
            ],
            temperature=0.1,
            max_tokens=1024,
            response_format={"type": "json_object"}
        )

        raw = response.choices[0].message.content.strip()
        return json.loads(raw)

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"OpenAI parse error: {e}")
        return {
            "tasks": [{
                "title": content[:100],
                "date_reference": None,
                "time": None,
                "description": None
            }],
            "is_edit_of_previous": False,
            "edit_field": None,
            "edit_value": None,
            "possible_duplicate_title": None
        }

