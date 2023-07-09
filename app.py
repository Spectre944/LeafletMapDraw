from flask import Flask, render_template, jsonify, request

import json
import os

# Specify the file path and name
folder_path = 'C:/RCB/Imitator'

app = Flask(__name__)

# Определение маршрута и обработчика для первой страницы
@app.route('/operator')
def pageOperator():
    return render_template('operator.html')

# Определение маршрута и обработчика для второй страницы
@app.route('/student')
def pageStudent():
    return render_template('student.html')

#
@app.route('/settings')
def pageSettings():
    return render_template('settings.html')

#------------------------------------------------------------------------
# Обработчик для сохранения слоев
@app.route('/save-layers', methods=['POST'])
def save_layers():
    try:
        layers_data = request.get_json()
        # Ваш код для обработки и сохранения слоев

        # Convert the data to JSON string
        json_str = json.dumps(layers_data)

        fileName = layers_data['properties']['name'] + ' ' + layers_data['properties']['concentration'] + ".json"

        # Join the folder path and file name
        file_path = os.path.join(folder_path, fileName)

        # Save the JSON data to the file
        with open(file_path, 'w') as file:
            file.write(json_str)
        
        response = {'message': 'Слои сохранены на сервере.'}
        return jsonify(response), 200
    
    except Exception as e:
        # Вывод сообщения об ошибке в консоль или логи сервера
        print('Ошибка при сохранении слоев:', str(e))
        
        response = {'message': 'Ошибка сохранения слоев на сервере.', 'error': str(e)}
        return jsonify(response), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)