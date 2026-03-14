import google.generativeai as genai
import os
import json
import random
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

    async def generate_phishing_content(self, context: str, target_department: str = "General", brand: str = "Generic"):
        """
        Generates highly dynamic and realistic phishing simulation content.
        """
        fallback_subjects = [
            f"Action required: unusual sign-in detected on {brand}",
            f"{brand} security notice: verify your account now",
            f"Mandatory {brand} policy update for {target_department}",
            f"Suspicious activity alert for your {brand} access",
        ]
        fallback_openers = [
            "We detected a login attempt from an unrecognized location.",
            "Your account has been flagged for an urgent security verification.",
            "A policy refresh requires immediate confirmation of account ownership.",
            "Your session was temporarily restricted due to unusual behavior.",
        ]

        if not self.model:
            return {
                "subject": random.choice(fallback_subjects),
                "content": (
                    f"{random.choice(fallback_openers)} "
                    f"Department: {target_department}. "
                    f"Please review and confirm here: [CLICK_HERE]. "
                    f"Reference: {context[:80]} "
                    "<br/><br/><small>[TRAINING SIMULATION - INTERNAL USE ONLY]</small>"
                ),
            }

        prompt = f"""
        You are an expert cybersecurity training content creator. 
        Your goal is to generate a realistic but ethical phishing simulation email for training purposes.

        TARGET INFO:
        - Brand/Service: {brand} (e.g., Microsoft 365, Facebook, LinkedIn, Corporate VPN)
        - Department: {target_department}
        - Additional Context: {context}

        INSTRUCTIONS:
        1. Subject line must be high-urgency and clickable (e.g., 'Action Required', 'Security Exception').
        2. Body must use professional tone appropriate for the brand.
        3. Include a clear call to action placeholder: [CLICK_HERE].
        4. Do NOT use actual malicious links.
        5. The email should be persuasive but include subtle red flags for trainees to spot (e.g., slightly odd phrasing, over-urgency).
        6. Append a mandatory footer in small text: [TRAINING SIMULATION - INTERNAL USE ONLY].

        Return valid JSON ONLY:
        {{
            "subject": "...",
            "content": "..."
        }}
        """
        
        try:
            response = self.model.generate_content(prompt)
            text = response.text
            start = text.find('{')
            end = text.rfind('}') + 1
            if start != -1 and end != -1:
                payload = json.loads(text[start:end])
                body = str(payload.get("content", ""))
                if "[CLICK_HERE]" not in body:
                    body = f"{body}<br/><br/>Confirm now: [CLICK_HERE]"
                payload["content"] = body
                if not payload.get("subject"):
                    payload["subject"] = random.choice(fallback_subjects)
                return payload
            
            return {
                "subject": f"Security Notification: {brand}",
                "content": text if "[CLICK_HERE]" in text else f"{text}<br/><br/>Confirm now: [CLICK_HERE]"
            }
        except Exception as e:
            print(f"AI Generation Error: {e}")
            return {
                "subject": random.choice(fallback_subjects),
                "content": (
                    f"{random.choice(fallback_openers)} "
                    f"Please verify your {brand} account immediately by clicking: [CLICK_HERE]."
                    "<br/><br/><small>[TRAINING SIMULATION - INTERNAL USE ONLY]</small>"
                ),
            }

    async def generate_random_test_content(self, channel: str = "email", department: str = "General") -> dict:
        brands = ["Microsoft 365", "Google Workspace", "Slack", "VPN Portal", "HRMS"]
        scenarios = [
            "new device sign-in verification",
            "password expiration compliance",
            "quarterly payroll access confirmation",
            "security certificate renewal",
            "mailbox quota lock prevention",
        ]
        brand = random.choice(brands)
        scenario = random.choice(scenarios)
        context = f"{scenario}; urgency=high; channel={channel}; randomized_test=true"
        return await self.generate_phishing_content(context=context, target_department=department, brand=brand)

ai_service = AIService()
