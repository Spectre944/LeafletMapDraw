from flask import Flask, render_template, jsonify, request

import json
import os

import serial
import time
from datetime import datetime
import pynmea2
import re

# Specify the file path and name
folder_path = 'C:/RCB/Imitator'

app = Flask(__name__)

# Configure serial communication
ser = serial.Serial('COM6', 115200)  # Replace 'COM1' with the appropriate COM port name

def calculate_checksum(sentence):
    # Remove any newlines
    if re.search("\n$", sentence):
        sentence = sentence[:-1]

    # Extract the data and checksum from the sentence
    nmeadata, cksum = re.split('\*', sentence)

    # Calculate the checksum
    calc_cksum = 0
    for s in nmeadata:
        calc_cksum ^= ord(s)

    # Convert the calculated checksum to a two-digit hexadecimal value
    calculated_checksum = hex(calc_cksum)[2:].upper().zfill(2)

    return cksum, calculated_checksum

def checksum(sentence):

    """ Remove any newlines """
    if re.search("\n$", sentence):
        sentence = sentence[:-1]

    nmeadata,cksum = re.split('\*', sentence)

    calc_cksum = 0
    for s in nmeadata:
        calc_cksum ^= ord(s)

    """ Return the nmeadata, the checksum from
        sentence, and the calculated checksum
    """
    return nmeadata,'0x'+cksum,hex(calc_cksum)

def convert_to_dms(coordinate):
    degrees = int(coordinate)
    minutes_float = (coordinate - degrees) * 60
    minutes = int(minutes_float)
    seconds_float = (minutes_float - minutes) * 60
    seconds = int(seconds_float)
    return (degrees, minutes_float, seconds_float)

# Function to send coordinates through the serial port using NMEA 0183 format
def send_data(currentCoordinates):

    lat = currentCoordinates['lat']
    lng = currentCoordinates['lng']

    # Convert latitude to DMS format
    lat_deg, lat_min, lat_sec = convert_to_dms(lat)
    lat_hemisphere = 'N' if lat >= 0 else 'S'

    # Convert longitude to DMS format
    lon_deg, lon_min, lon_sec = convert_to_dms(lng)
    lon_hemisphere = 'E' if lng >= 0 else 'W'
    
    # Create the GGA sentence
    msg = pynmea2.GGA(
        'GP',
        'GGA',
        ('123000.000', f'{lat_deg:02}{lat_min:02.6f}', lat_hemisphere, f'{lon_deg:03}{lon_min:03.6f}', lon_hemisphere, '1', '17', '0.7', '238.2', 'M', '36.7', 'M', '', '')
    )
    nmea_sentence = str(msg)
    data = f"{nmea_sentence}\r\n"  # Add the necessary start and end characters

    print(calculate_checksum(nmea_sentence))
    print(data)
    
    ser.write(data.encode())  # Send the data as bytes


# Schedule the data sending task every 5 seconds
#schedule.every(5).seconds.do(send_data)

# Определение маршрута и обработчика для первой страницы
@app.route('/operator')
def pageOperator():
    return render_template('operator.html')

# Определение маршрута и обработчика для второй страницы
@app.route('/student')
def pageStudent():
    return render_template('stuqdent.html')

#
@app.route('/settings')
def pageSettings():
    return render_template('settings.html')

#------------------------------------------------------------------------
# Обработчик для приёма координат
@app.route('/get-coordinates', methods=['POST'])
def get_coordinates():
    try:

        send_data(request.get_json())

        response = {'message': 'Координаты приняты'}
        
        return jsonify(response), 200
    
    except Exception as e:
        # Вывод сообщения об ошибке в консоль или логи сервера
        print('Ошибка при получении координат', str(e))
        
        response = {'message': 'Ошибка сохранения слоев на сервере.', 'error': str(e)}
        
        return jsonify(response), 500
        

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

# Start the scheduler
#while True:
#    schedule.run_pending()
#    time.sleep(1)