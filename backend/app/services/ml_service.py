import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
import joblib
import os

class MLRiskService:
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.is_trained = False
        self.model_path = "app/services/risk_model.joblib"
        
        try:
            if os.path.exists(self.model_path):
                self.model = joblib.load(self.model_path)
                self.is_trained = True
        except Exception:
            pass

    def prepare_data(self, events):
        df = pd.DataFrame(events)
        if df.empty:
            return None
            
        features = df.groupby('target_id')['event_type'].value_counts().unstack(fill_value=0)

        # Normalize old naming if historical rows used credential_submitted.
        if 'credential_submitted' in features.columns and 'form_submitted' not in features.columns:
            features['form_submitted'] = features['credential_submitted']
        
        for col in ['email_opened', 'link_clicked', 'form_submitted']:
            if col not in features.columns:
                features[col] = 0
        
        features['risk_label'] = np.where(features['form_submitted'] > 0, 2, 
                               np.where(features['link_clicked'] > 0, 1, 0))
        
        return features

    def train_on_history(self, historical_data):
        features = self.prepare_data(historical_data)
        if features is None: return
        
        X = features[['email_opened', 'link_clicked', 'form_submitted']]
        y = features['risk_label']
        
        self.model.fit(X, y)
        self.is_trained = True
        try:
            joblib.dump(self.model, self.model_path)
        except Exception:
            pass

    def predict_risk_score(self, user_stats):
        email_opened = user_stats.get('email_opened', 0)
        link_clicked = user_stats.get('link_clicked', 0)
        form_submitted = user_stats.get('form_submitted', user_stats.get('credential_submitted', 0))

        if not self.is_trained:
            score = (email_opened * 0.1 + 
                     link_clicked * 0.4 + 
                     form_submitted * 0.5)
            return float(min(score, 1.0))

        X = pd.DataFrame([
            {
                'email_opened': email_opened,
                'link_clicked': link_clicked,
                'form_submitted': form_submitted,
            }
        ])
        X = X[['email_opened', 'link_clicked', 'form_submitted']]
        
        prediction_prob = self.model.predict_proba(X)[0]
        risk_score = (prediction_prob[0] * 0.1 + 
                      prediction_prob[1] * 0.5 + 
                      prediction_prob[2] * 0.9)
        return float(risk_score)

ml_service = MLRiskService()
