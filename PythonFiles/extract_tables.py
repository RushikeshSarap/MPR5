from flask import Flask, request, jsonify
import camelot
import tabula
import pandas as pd
import os

app = Flask(__name__)

@app.route('/extract', methods=['POST'])
def extract():
    data = request.get_json()
    file_path = data.get('file_path')

    if not file_path or not os.path.exists(file_path):
        return jsonify({"error": "Invalid file path"}), 400

    tables_json = []

    try:
        # Try Camelot first (bordered tables)
        tables = camelot.read_pdf(file_path, pages='all')
        if tables and len(tables) > 0:
            for i, t in enumerate(tables):
                df = t.df
                tables_json.append({
                    "page": i + 1,
                    "data": df.values.tolist()
                })
        else:
            # Fallback: Tabula (borderless/complex tables)
            dfs = tabula.read_pdf(file_path, pages='all', multiple_tables=True)
            for i, df in enumerate(dfs):
                tables_json.append({
                    "page": i + 1,
                    "data": df.values.tolist()
                })

        return jsonify({"tables": tables_json})

    except Exception as e:
        print("Extraction error:", e)
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5001, host='0.0.0.0')
