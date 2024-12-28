import os
from flask import Flask, render_template, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)
app = Flask(__name__)

app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
db.init_app(app)

with app.app_context():
    from models import HighScore
    db.create_all()

@app.route('/api/scores', methods=['POST'])
def save_score():
    data = request.json
    new_score = HighScore(
        player_name=data['name'],
        score=data['score']
    )
    db.session.add(new_score)
    db.session.commit()
    return jsonify({"status": "success"})

@app.route('/api/scores', methods=['GET'])
def get_scores():
    top_scores = HighScore.get_top_scores()
    return jsonify([{
        "name": score.player_name,
        "score": score.score,
        "date": score.created_at.strftime("%Y-%m-%d")
    } for score in top_scores])
