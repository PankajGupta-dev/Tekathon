import cv2
import time
import threading
from flask import Flask, Response, jsonify
from flask_socketio import SocketIO
from flask_cors import CORS
from ultralytics import YOLO

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

try:
    model = YOLO('yolov8n.pt')
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

# Video capture
cap = cv2.VideoCapture(0) # Use webcam

latest_detections = []
confidence_score = 0
severity_level = 0
inference_time = 0
fps = 0

def process_frames():
    global latest_detections, confidence_score, severity_level, inference_time, fps
    
    last_time = time.time()
    frames_count = 0
    
    while True:
        success, frame = cap.read()
        if not success:
            time.sleep(0.1)
            continue

        start_inf = time.time()
        
        detections = []
        highest_conf = 0
        
        if model:
            results = model(frame, verbose=False)
            inf_time_ms = (time.time() - start_inf) * 1000
            inference_time = int(inf_time_ms)
            
            for r in results:
                boxes = r.boxes
                for box in boxes:
                    cls_id = int(box.cls[0])
                    conf = float(box.conf[0])
                    label = model.names[cls_id]
                    
                    # Mock mapping for demo since standard YOLOv8n doesn't have fire/smoke
                    is_fire_smoke = label in ['fire', 'smoke']
                    demo_label = label
                    if not is_fire_smoke:
                        if label == 'person':
                            demo_label = 'fire'
                            is_fire_smoke = True
                        elif label in ['cell phone', 'cup', 'bottle']:
                            demo_label = 'smoke'
                            is_fire_smoke = True
                    
                    if is_fire_smoke:
                        x1, y1, x2, y2 = box.xyxy[0].tolist()
                        w = x2 - x1
                        h = y2 - y1
                        
                        detections.append({
                            'x': f"{x1 / frame.shape[1] * 100}%",
                            'y': f"{y1 / frame.shape[0] * 100}%",
                            'w': f"{w / frame.shape[1] * 100}%",
                            'h': f"{h / frame.shape[0] * 100}%",
                            'label': demo_label.upper(),
                            'confidence': round(conf * 100, 1)
                        })
                        if conf * 100 > highest_conf:
                            highest_conf = conf * 100
            
            confidence_score = highest_conf
            severity_level = int(highest_conf * 0.9) if highest_conf > 0 else 0
        else:
            inference_time = 0

        latest_detections = detections
        
        frames_count += 1
        current_time = time.time()
        if current_time - last_time >= 1.0:
            fps = frames_count
            frames_count = 0
            last_time = current_time

        socketio.emit('ai:update', {
            'detections': latest_detections,
            'confidence': confidence_score,
            'severity': severity_level,
            'inference_time': inference_time,
            'fps': fps,
            'model': 'YOLOv8 nano',
            'health': 'ONLINE' if model else 'ERROR'
        })
        
        socketio.sleep(0.05)

@app.route('/health')
def health():
    return jsonify({
        'status': 'online',
        'model': 'YOLOv8 nano',
        'inference_time': f"{inference_time}ms",
        'fps': fps
    })

def generate_frames():
    while True:
        success, frame = cap.read()
        if not success:
            time.sleep(0.1)
            continue
        
        ret, buffer = cv2.imencode('.jpg', frame)
        if not ret:
            continue
        
        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    thread = threading.Thread(target=process_frames)
    thread.daemon = True
    thread.start()
    socketio.run(app, host='0.0.0.0', port=5001, allow_unsafe_werkzeug=True)
