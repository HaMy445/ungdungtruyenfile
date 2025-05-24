from flask import Flask, request, jsonify
from flask_cors import CORS
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from cryptography.hazmat.backends import default_backend
import os
import base64

app = Flask(__name__)
CORS(app)

# Thư mục lưu trữ file
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Tạo cặp khóa RSA
def generate_key_pair():
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
        backend=default_backend()
    )
    public_key = private_key.public_key()
    
    # Lưu private key
    with open("private_key.pem", "wb") as f:
        f.write(private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ))
    
    # Lưu public key
    with open("public_key.pem", "wb") as f:
        f.write(public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ))

# Ký file
def sign_file(file_data):
    with open("private_key.pem", "rb") as key_file:
        private_key = serialization.load_pem_private_key(
            key_file.read(),
            password=None,
            backend=default_backend()
        )
    
    signature = private_key.sign(
        file_data,
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.MAX_LENGTH
        ),
        hashes.SHA256()
    )
    return base64.b64encode(signature).decode()

# Xác thực chữ ký
def verify_signature(file_data, signature):
    with open("public_key.pem", "rb") as key_file:
        public_key = serialization.load_pem_public_key(
            key_file.read(),
            backend=default_backend()
        )
    
    try:
        public_key.verify(
            base64.b64decode(signature),
            file_data,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
        return True
    except:
        return False

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    file_data = file.read()
    signature = sign_file(file_data)
    
    # Lưu file và chữ ký
    filename = os.path.join(UPLOAD_FOLDER, file.filename)
    with open(filename, 'wb') as f:
        f.write(file_data)
    
    with open(filename + '.sig', 'w') as f:
        f.write(signature)
    
    return jsonify({
        'message': 'File uploaded and signed successfully',
        'signature': signature
    })

@app.route('/verify', methods=['POST'])
def verify_file():
    if 'file' not in request.files or 'signature' not in request.form:
        return jsonify({'error': 'Missing file or signature'}), 400
    
    file = request.files['file']
    signature = request.form['signature']
    
    file_data = file.read()
    is_valid = verify_signature(file_data, signature)
    
    return jsonify({
        'is_valid': is_valid
    })

if __name__ == '__main__':
    # Tạo cặp khóa khi khởi động server
    if not os.path.exists("private_key.pem"):
        generate_key_pair()
    app.run(debug=True) 