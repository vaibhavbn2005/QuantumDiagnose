from flask import Flask, jsonify

app = Flask(__name__)

@app.route("/")
def home():
    return """
    <html>
    <head>
        <title>QuantumDiagnose</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                text-align: center;
                padding: 80px;
                background: #f5f7fb;
            }
            h1 {
                color: #2563eb;
            }
            .box {
                background: white;
                padding: 40px;
                border-radius: 15px;
                max-width: 600px;
                margin: auto;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
        </style>
    </head>
    <body>
        <div class="box">
            <h1>QuantumDiagnose</h1>
            <p>Quantum and ML based disease prediction system</p>
            <p>Application deployed successfully!</p>
        </div>
    </body>
    </html>
    """

@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
