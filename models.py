from app import db
from datetime import datetime

class HighScore(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    player_name = db.Column(db.String(50), nullable=False)
    score = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    @staticmethod
    def get_top_scores(limit=10):
        return HighScore.query.order_by(HighScore.score.desc()).limit(limit).all()
