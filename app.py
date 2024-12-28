import os
import logging
from flask import Flask, render_template, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)
app = Flask(__name__)

# Configure Flask app
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "pacman_game_secret")
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
db.init_app(app)

# Import models after db initialization
with app.app_context():
    from models import HighScore
    db.create_all()
    logger.info("Database tables created successfully")

@app.before_request
def log_request_info():
    logger.debug('Request Headers: %s', dict(request.headers))
    logger.debug('Request Body: %s', request.get_data())

@app.route('/')
def index():
    logger.debug('Serving index page')
    return render_template('index.html')

@app.route('/api/scores', methods=['POST'])
def save_score():
    try:
        data = request.json
        logger.debug(f"Received score submission: {data}")

        if not data or 'name' not in data or 'score' not in data:
            logger.error("Invalid score submission data")
            return jsonify({"status": "error", "message": "Invalid data format"}), 400

        new_score = HighScore(
            player_name=data['name'],
            score=data['score']
        )
        db.session.add(new_score)
        db.session.commit()
        logger.info(f"Score saved successfully for player {data['name']}")
        return jsonify({"status": "success"})
    except Exception as e:
        logger.error(f"Error saving score: {str(e)}", exc_info=True)
        db.session.rollback()
        return jsonify({"status": "error", "message": "Server error while saving score"}), 500

@app.route('/api/scores', methods=['GET'])
def get_scores():
    try:
        top_scores = HighScore.get_top_scores()
        logger.debug(f"Retrieved {len(top_scores)} top scores")
        scores_data = [{
            "name": score.player_name,
            "score": score.score,
            "date": score.created_at.strftime("%Y-%m-%d")
        } for score in top_scores]
        return jsonify(scores_data)
    except Exception as e:
        logger.error(f"Error retrieving scores: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "message": "Server error while fetching scores"}), 500

@app.errorhandler(404)
def not_found_error(error):
    logger.error(f"404 error: {error}")
    return jsonify({"status": "error", "message": "Resource not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"500 error: {error}")
    db.session.rollback()
    return jsonify({"status": "error", "message": "Internal server error"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)