
import google.generativeai as genai
import os
import json
from dotenv import load_dotenv

load_dotenv()

class AIService:
    def __init__(self):
        api_key = os.getenv("GOOGLE_API_KEY")
        if api_key:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-pro')
        else:
            self.model = None

    async def generate_phishing_content(self, context: str, target_department: str = "General"):
        if not self.model:
            return {
                "subject": "System Security Update",
                "content": f"This is a fallback content because AI service is not configured. Context: {context}"
            }

        prompt = f"""
        You are a cybersecurity training assistant. Generate a realistic but ethical phishing simulation email.
        Context: {context}
        Target Department: {target_department}
        
        The email should:
        1. Have a convincing subject line.
        2. Use a professional tone.
        3. Include a call to action (a link or button placeholder).
        4. Be clearly for training purposes (no real malicious links, just placeholders like [CLICK_HERE]).
        
        Return the result in JSON format:
        {{
            "subject": "...",
            "content": "..."
        }}
        """
        
        response = self.model.generate_content(prompt)
        text = response.text
        
        try:
            start = text.find('{')
            end = text.rfind('}') + 1
            if start != -1 and end != -1:
                return json.loads(text[start:end])
            return {
                "subject": "Security Awareness: " + context[:30],
                "content": text
            }
        except Exception:
            return {
                "subject": "Security Awareness Update",
                "content": text
            }

ai_service = AIService()