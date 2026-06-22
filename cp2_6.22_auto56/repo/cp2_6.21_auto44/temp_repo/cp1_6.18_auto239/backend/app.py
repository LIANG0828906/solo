from flask import Flask
from flask_cors import CORS
from database import db

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///moodflow.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

with app.app_context():
    db.create_all()

import routes

if __name__ == '__main__':
    app.run(debug=False, port=5000)
