import os
from flask import Flask, jsonify, request
import psycopg2
from flask_cors import CORS
from psycopg2.extras import RealDictCursor
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import jwt
from functools import wraps
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_mail import Mail, Message
import random
import threading
import time

app = Flask(__name__)
app.config['SECRET_KEY'] = 'super_secret_key_for_tribeup_123'
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587        
app.config['MAIL_USE_TLS'] = True         
app.config['MAIL_USE_SSL'] = False          
app.config['MAIL_USERNAME'] = 'tribeup.welcome@gmail.com'  
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')    
app.config['MAIL_DEFAULT_SENDER'] = 'TribeUp Team <tribeup.welcome@gmail.com>'

mail = Mail(app)

online_users = {}

DB_CONFIG = os.environ.get('DATABASE_URL')

def get_db():
    database_url = os.environ.get('DATABASE_URL')
    
    if database_url:
        conn = psycopg2.connect(database_url)
    else:
        conn = psycopg2.connect(
            dbname='tribeup_db',
            user='postgres',
            password='qazwsxedcasd123', 
            host='localhost',
            port=5432
        )
    return conn

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(" ")[1]
        if not token:
            return jsonify({'error': 'Token is missing!'}), 401
        try:
            jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        except:
            return jsonify({'error': 'Token is invalid!'}), 401
        return f(*args, **kwargs)
    return decorated

def format_time(dt):
    if isinstance(dt, datetime):
        return dt.strftime("%H:%M")
    return str(dt)

def map_event(row):
    return {
        'eventId': row['id'],
        'title': row['title'],
        'description': row['description'],
        'category': row['category'],
        'location': row['location'],
        'date': row['event_date'],
        'participants': row['participants'],
        'minParticipants': row['min_participants'], 
        'status': row['status'],
        'currentParticipants': row['current_participants'],
        'creatorId': row['creator_id'],
        'interests': row['interests'] if row['interests'] else []
    }

def map_user(row):
    return {
        'id': row['id'],
        'name': row['name'],
        'username': row['username'],
        'email': row['email'],
        'age': row['age'],
        'location': row['location'],
        'avatarBase64': row['avatar_base64'],
        'interests': row['interests'] if row['interests'] else []
    }

def map_message(row):
    return {
        'id': row['id'],
        'text': row['text'],
        'time': format_time(row['created_at']),
        'senderId': row['sender_id'],
        'senderName': row.get('sender_name', ''),
        'timestamp': row['created_at'].timestamp() * 1000
    }

def save_new_interests(cur, interests_list):
    if not interests_list: return
    for interest in interests_list:
        cur.execute("INSERT INTO interests (name) VALUES (%s) ON CONFLICT (name) DO NOTHING", (interest,))

def create_notification(user_id, type, message, related_id=None):
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            INSERT INTO notifications (user_id, type, message, related_id)
            VALUES (%s, %s, %s, %s) RETURNING *
        """, (user_id, type, message, related_id))
        new_notif = cur.fetchone()
        conn.commit()
        socketio.emit('new_notification', map_message(new_notif) if 'text' in new_notif else new_notif, room=f"user_{user_id}")
    except Exception as e:
        print(f"Notification Error: {e}")
    finally:
        conn.close()

def check_upcoming_events():
    while True:
        try:
            conn = get_db()
            cur = conn.cursor(cursor_factory=RealDictCursor)
            now = datetime.now()
            start = now + timedelta(minutes=60)
            end = now + timedelta(minutes=61)
            
            cur.execute("""
                SELECT e.id, e.title, ep.user_id 
                FROM events e JOIN event_participants ep ON e.id = ep.event_id
                WHERE e.event_date::timestamp >= %s AND e.event_date::timestamp < %s
            """, (start, end))
            
            for row in cur.fetchall():
                create_notification(row['user_id'], 'reminder', f"Нагадування: '{row['title']}' через годину!", row['id'])
            conn.close()
        except Exception as e: print(f"Scheduler: {e}")
        time.sleep(60)
threading.Thread(target=check_upcoming_events, daemon=True).start()

def send_async_email(app, msg):
    with app.app_context():
        try:
            mail.send(msg)
        except Exception as e:
            print(f"Mail Error in background: {e}") 

@socketio.on('join_notifications')
def on_join_notifications(data):
    user_id = data.get('userId')
    if user_id:
        join_room(f"user_{user_id}")
        if user_id not in online_users:
            online_users[user_id] = set()
        online_users[user_id].add(request.sid)

@socketio.on('join')
def on_join(data):
    room = data['room']
    join_room(room)

@socketio.on('leave')
def on_leave(data):
    room = data['room']
    leave_room(room)

@socketio.on('send_event_message')
def handle_event_message(data):
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            INSERT INTO event_messages (event_id, sender_id, text)
            VALUES (%s, %s, %s) RETURNING *
        """, (data['eventId'], data['senderId'], data['text']))
        new_msg = cur.fetchone()
        cur.execute("SELECT username FROM users WHERE id = %s", (data['senderId'],))
        sender_name = cur.fetchone()['username']
        conn.commit()
        msg_response = map_message(new_msg)
        msg_response['senderName'] = sender_name
        room = f"event_{data['eventId']}"
        emit('receive_message', msg_response, room=room)
        
    except Exception as e:
        print(f"Error saving message: {e}")
    finally:
        conn.close()

@socketio.on('send_private_message')
def handle_private_message(data):
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            INSERT INTO private_messages (sender_id, receiver_id, text)
            VALUES (%s, %s, %s) RETURNING *
        """, (data['senderId'], data['receiverId'], data['text']))
        new_msg = cur.fetchone()
        cur.execute("SELECT username FROM users WHERE id = %s", (data['senderId'],))
        sender_name = cur.fetchone()['username']
        
        conn.commit()
        msg_response = map_message(new_msg)
        msg_response['senderName'] = sender_name
        u1, u2 = sorted([int(data['senderId']), int(data['receiverId'])])
        room = f"private_{u1}_{u2}"
        emit('receive_private_message', msg_response, room=room)
        emit('chat_alert', msg_response, room=f"user_{data['receiverId']}")
        
    except Exception as e:
        print(f"Error private message: {e}")
    finally:
        conn.close()

@app.route('/api/interests', methods=['GET'])
def get_interests():
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("SELECT name FROM interests ORDER BY name")
        interests = [row[0] for row in cur.fetchall()]
        return jsonify(interests)
    finally:
        conn.close()

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        hashed_password = generate_password_hash(data['password'])
        verification_code = str(random.randint(100000, 999999))
        save_new_interests(cur, data['interests'])
        cur.execute("""
            INSERT INTO users (name, username, email, password, age, location, avatar_base64, interests, is_verified, verification_code)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, FALSE, %s) RETURNING *
        """, (data['name'], data['username'], data['email'], hashed_password, data['age'], data['location'], data.get('avatarBase64', ''), data['interests'], verification_code))
        
        new_user = map_user(cur.fetchone())
        conn.commit()
        try:
            msg = Message("Ваш код підтвердження TribeUp", recipients=[new_user['email']])
            msg.body = f"Привіт, {new_user['name']}!\n\nТвій код підтвердження: {verification_code}\n\nВведи його на сайті, щоб завершити реєстрацію."
            mail.send(msg)
        except Exception as e:
            print(f"Mail Setup Error: {e}") 
            
        return jsonify({'userId': new_user['id'], 'message': 'Code sent'})

    except Exception as e:
        if 'duplicate key value violates unique constraint' in str(e):
            if 'username' in str(e):
                return jsonify({'error': 'Користувач з таким нікнеймом вже існує'}), 400
            elif 'email' in str(e):
                return jsonify({'error': 'Користувач з такою поштою вже існує'}), 400
        return jsonify({'error': str(e)}), 400
    finally:
        conn.close()

@app.route('/api/auth/verify', methods=['POST'])
def verify_email():
    data = request.json
    user_id = data.get('userId')
    code = data.get('code')
    
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        user = cur.fetchone()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        if user['verification_code'] == code:
            cur.execute("UPDATE users SET is_verified = TRUE, verification_code = NULL WHERE id = %s RETURNING *", (user_id,))
            updated_user = map_user(cur.fetchone())
            conn.commit()
            
            token = jwt.encode({'user_id': updated_user['id'], 'exp': datetime.utcnow() + timedelta(days=7)}, app.config['SECRET_KEY'], algorithm="HS256")
            return jsonify({'user': updated_user, 'token': token})
        else:
            return jsonify({'error': 'Невірний код'}), 400
    finally:
        conn.close()

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("SELECT * FROM users WHERE email = %s", (data['email'],))
        user = cur.fetchone()
        
        if user and check_password_hash(user['password'], data['password']):
            if not user['is_verified']:
                return jsonify({'error': 'Пошта не підтверджена. Введіть код.', 'userId': user['id']}), 403 
                
            user_data = map_user(user)
            token = jwt.encode({'user_id': user['id'], 'exp': datetime.utcnow() + timedelta(days=7)}, app.config['SECRET_KEY'], algorithm="HS256")
            return jsonify({'user': user_data, 'token': token})
        else:
            return jsonify({'error': 'Невірна пошта або пароль'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/users/<int:user_id>', methods=['PUT'])
@token_required
def update_user(user_id):
    data = request.json
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        save_new_interests(cur, data['interests'])
        cur.execute("""
            UPDATE users SET name=%s, username=%s, age=%s, location=%s, interests=%s, avatar_base64=%s WHERE id=%s RETURNING *
        """, (data['name'], data['username'], data['age'], data['location'], data['interests'], data['avatarBase64'], user_id))
        updated_row = cur.fetchone()
        if updated_row:
            conn.commit()
            return jsonify(map_user(updated_row))
        return jsonify({'error': 'User not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    finally:
        conn.close()

@app.route('/api/events', methods=['GET'])
def get_events():
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            UPDATE events 
            SET status = 'finished' 
            WHERE event_date::timestamp < NOW() AND status = 'active'
        """)
        conn.commit()

        status_filter = request.args.get('status', 'active')
        
        cur.execute("SELECT * FROM events WHERE status = %s ORDER BY id DESC", (status_filter,))
        events = [map_event(row) for row in cur.fetchall()]
        return jsonify(events)
    except Exception as e:
        print(f"ERROR: {e}") 
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/events', methods=['POST'])
@token_required
def create_event():
    data = request.json
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        save_new_interests(cur, data['interests'])
        cur.execute("""
            INSERT INTO events (title, description, category, location, event_date, participants, min_participants, current_participants, creator_id, interests, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 1, %s, %s, 'active') RETURNING *
        """, (data['title'], data['description'], data['category'], data['location'], data['date'], data['participants'], data.get('minParticipants', 0), data['creatorId'], data['interests']))
        
        event = cur.fetchone()
        cur.execute("INSERT INTO event_participants (user_id, event_id) VALUES (%s, %s)", (data['creatorId'], event['id']))
        
        try:
            cur.execute("SELECT username FROM users WHERE id = %s", (data['creatorId'],))
            creator_name = cur.fetchone()['username']

            cur.execute("SELECT follower_id FROM followers WHERE followed_id = %s", (data['creatorId'],))
            followers = cur.fetchall()

            for f in followers:
                create_notification(f['follower_id'], 'new_event', f"{creator_name} створює нову подію: {data['title']}", event['id'])
        except Exception as e:
            print(f"Notification error: {e}")
        # ---------------------------------------

        conn.commit()
        return jsonify(map_event(event))
    except Exception as e:
        print(f"ПОМИЛКА СТВОРЕННЯ: {e}")
        return jsonify({'error': str(e)}), 400
    finally:
        conn.close()

@app.route('/api/events/<int:event_id>', methods=['PUT'])
@token_required
def update_event(event_id):
    data = request.json
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        save_new_interests(cur, data['interests'])
        cur.execute("""
            UPDATE events SET title=%s, description=%s, category=%s, location=%s, event_date=%s, participants=%s, interests=%s WHERE id=%s RETURNING *
        """, (data['title'], data['description'], data['category'], data['location'], data['date'], data['participants'], data['interests'], event_id))
        updated_event = cur.fetchone()
        if updated_event:
            # --- СИСТЕМА СПОВІЩЕНЬ: ОНОВЛЕННЯ ПОДІЇ ---
            try:
                cur.execute("SELECT user_id FROM event_participants WHERE event_id = %s", (event_id,))
                participants = cur.fetchall()
                for p in participants:
                    if p['user_id'] != updated_event['creator_id']:
                        create_notification(p['user_id'], 'update', f"Оновлено деталі події '{updated_event['title']}'", event_id)
            except Exception as e:
                print(f"Notification error (update): {e}")
            # ------------------------------------------

            conn.commit()
            return jsonify(map_event(updated_event))
        return jsonify({'error': 'Not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    finally:
        conn.close()

@app.route('/api/events/<int:event_id>', methods=['DELETE'])
@token_required
def delete_event(event_id):
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        # --- СИСТЕМА СПОВІЩЕНЬ: СКАСУВАННЯ ПОДІЇ ---
        try:
            cur.execute("SELECT title, creator_id FROM events WHERE id = %s", (event_id,))
            evt = cur.fetchone()
            
            if evt:
                cur.execute("SELECT user_id FROM event_participants WHERE event_id = %s", (event_id,))
                participants = cur.fetchall()
                for p in participants:
                    if p['user_id'] != evt['creator_id']:
                        create_notification(p['user_id'], 'system', f"Подію '{evt['title']}' було скасовано організатором.", None)
        except Exception as e:
            print(f"Notification error (delete): {e}")
        # ------------------------------------------

        cur.execute("DELETE FROM event_participants WHERE event_id = %s", (event_id,))
        cur.execute("DELETE FROM event_messages WHERE event_id = %s", (event_id,))
        cur.execute("DELETE FROM events WHERE id = %s", (event_id,))
        conn.commit()
        return jsonify({'status': 'success'})
    except Exception:
        return jsonify({'error': 'Error'}), 400
    finally:
        conn.close()

@app.route('/api/events/join', methods=['POST'])
@token_required
def join_event():
    data = request.json
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("INSERT INTO event_participants (user_id, event_id) VALUES (%s, %s)", (data['userId'], data['eventId']))
        cur.execute("UPDATE events SET current_participants = current_participants + 1 WHERE id = %s", (data['eventId'],))
        
        # --- СИСТЕМА СПОВІЩЕНЬ: НОВИЙ УЧАСНИК ---
        try:
            cur.execute("SELECT title, creator_id FROM events WHERE id = %s", (data['eventId'],))
            evt_info = cur.fetchone()
            
            cur.execute("SELECT username FROM users WHERE id = %s", (data['userId'],))
            joiner_name = cur.fetchone()['username']
            
            if evt_info and evt_info['creator_id'] != data['userId']:
                create_notification(evt_info['creator_id'], 'join', f"{joiner_name} йде на вашу подію '{evt_info['title']}'", data['eventId'])
        except Exception as e:
            print(f"Notification error (join): {e}")
        # ----------------------------------------

        conn.commit()
        return jsonify({'status': 'success'})
    except Exception: return jsonify({'error': 'Error'}), 400
    finally: conn.close()

@app.route('/api/events/leave', methods=['POST'])
@token_required
def leave_event():
    data = request.json
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM event_participants WHERE user_id = %s AND event_id = %s", (data['userId'], data['eventId']))
        cur.execute("UPDATE events SET current_participants = current_participants - 1 WHERE id = %s", (data['eventId'],))
        conn.commit()
        return jsonify({'status': 'success'})
    except Exception: return jsonify({'error': 'Error'}), 400
    finally: conn.close()

@app.route('/api/users', methods=['GET'])
def get_users_list():
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    # ЗМІНА: Фільтруємо лише підтверджених користувачів
    cur.execute("SELECT * FROM users WHERE is_verified = TRUE")
    users = [map_user(row) for row in cur.fetchall()]
    conn.close()
    return jsonify(users)

@app.route('/api/my-joined-events/<int:user_id>', methods=['GET'])
def get_joined_events(user_id):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT event_id FROM event_participants WHERE user_id = %s", (user_id,))
    ids = [row[0] for row in cur.fetchall()]
    conn.close()
    return jsonify(ids)

@app.route('/api/messages/event/<int:event_id>', methods=['GET'])
def get_event_messages(event_id):
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT em.*, u.username as sender_name FROM event_messages em
        JOIN users u ON em.sender_id = u.id WHERE em.event_id = %s ORDER BY em.created_at ASC
    """, (event_id,))
    messages = [map_message(row) for row in cur.fetchall()]
    conn.close()
    return jsonify(messages)

@app.route('/api/messages/private', methods=['GET'])
def get_private_messages():
    user1 = request.args.get('user1')
    user2 = request.args.get('user2')
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM private_messages WHERE (sender_id = %s AND receiver_id = %s) OR (sender_id = %s AND receiver_id = %s) ORDER BY created_at ASC", (user1, user2, user2, user1))
    messages = [map_message(row) for row in cur.fetchall()]
    conn.close()
    return jsonify(messages)

@app.route('/api/my-chats/<int:user_id>', methods=['GET'])
def get_my_chats(user_id):
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        WITH all_chats AS (
            SELECT receiver_id as partner_id, created_at, text FROM private_messages WHERE sender_id = %s
            UNION ALL
            SELECT sender_id as partner_id, created_at, text FROM private_messages WHERE receiver_id = %s
        )
        SELECT DISTINCT ON (partner_id) partner_id, text, created_at FROM all_chats ORDER BY partner_id, created_at DESC
    """, (user_id, user_id))
    chats = []
    rows = cur.fetchall()
    for row in rows:
        cur.execute("SELECT id, name, username, avatar_base64 FROM users WHERE id = %s", (row['partner_id'],))
        user_data = cur.fetchone()
        if user_data:
            chats.append({
                'otherUser': {'id': user_data['id'], 'name': user_data['name'], 'username': user_data['username'], 'avatarBase64': user_data['avatar_base64']},
                'lastMessage': {'text': row['text'], 'time': format_time(row['created_at']), 'timestamp': row['created_at'].timestamp() * 1000}
            })
    chats.sort(key=lambda x: x['lastMessage']['timestamp'], reverse=True)
    conn.close()
    return jsonify(chats)

@app.route('/api/events/<int:event_id>/participants', methods=['GET'])
def get_event_participants(event_id):
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("""
            SELECT u.id, u.name, u.username, u.avatar_base64 
            FROM users u
            JOIN event_participants ep ON u.id = ep.user_id
            WHERE ep.event_id = %s
        """, (event_id,))
        
        participants = []
        for row in cur.fetchall():
            participants.append({
                'id': row['id'],
                'name': row['name'],
                'username': row['username'],
                'avatarBase64': row['avatar_base64']
            })
        return jsonify(participants)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/users/search', methods=['GET'])
def search_users():
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify([])
    
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        search_pattern = f"%{query}%"
        # ЗМІНА: Фільтруємо лише підтверджених користувачів
        cur.execute("""
            SELECT id, name, username, avatar_base64, age, location, interests 
            FROM users 
            WHERE is_verified = TRUE AND (username ILIKE %s OR name ILIKE %s)
            LIMIT 20
        """, (search_pattern, search_pattern))
        
        users = [map_user(row) for row in cur.fetchall()]
        return jsonify(users)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/users/<int:user_id>/follow', methods=['POST'])
@token_required
def follow_user(user_id):
    follower_id = request.json.get('followerId')
    if follower_id == user_id: return jsonify({'error': 'Error'}), 400
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute("INSERT INTO followers (follower_id, followed_id) VALUES (%s, %s) ON CONFLICT DO NOTHING", (follower_id, user_id))
        conn.commit()
        
        cur.execute("SELECT username FROM users WHERE id = %s", (follower_id,))
        name = cur.fetchone()[0]
        create_notification(user_id, 'follow', f"{name} підписався на вас!", follower_id)
        return jsonify({'status': 'success'})
    finally: conn.close()

@app.route('/api/users/<int:user_id>/unfollow', methods=['POST'])
@token_required
def unfollow_user(user_id):
    conn = get_db()
    try:
        conn.cursor().execute("DELETE FROM followers WHERE follower_id = %s AND followed_id = %s", (request.json.get('followerId'), user_id))
        conn.commit()
        return jsonify({'status': 'success'})
    finally: conn.close()

@app.route('/api/users/<int:user_id>/social', methods=['GET'])
def get_user_social(user_id):
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        # ЗМІНА: Фільтруємо лише підтверджених користувачів
        cur.execute("SELECT u.id, u.username, u.name, u.avatar_base64 FROM users u JOIN followers f ON u.id = f.follower_id WHERE f.followed_id = %s AND u.is_verified = TRUE", (user_id,))
        followers = [dict(row) for row in cur.fetchall()]
        cur.execute("SELECT u.id, u.username, u.name, u.avatar_base64 FROM users u JOIN followers f ON u.id = f.followed_id WHERE f.follower_id = %s AND u.is_verified = TRUE", (user_id,))
        following = [dict(row) for row in cur.fetchall()]
        return jsonify({'followers': followers, 'following': following})
    finally: conn.close()

@app.route('/api/notifications/<int:user_id>', methods=['GET'])
@token_required
def get_notifications(user_id):
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("SELECT * FROM notifications WHERE user_id = %s ORDER BY created_at DESC LIMIT 20", (user_id,))
        return jsonify([dict(row) for row in cur.fetchall()])
    finally: conn.close()

@app.route('/api/notifications/read', methods=['POST'])
@token_required
def read_notifications():
    conn = get_db()
    try:
        if request.json.get('id'):
            conn.cursor().execute("UPDATE notifications SET is_read = TRUE WHERE id = %s", (request.json['id'],))
        elif request.json.get('userId'):
            conn.cursor().execute("UPDATE notifications SET is_read = TRUE WHERE user_id = %s", (request.json['userId'],))
        conn.commit()
        return jsonify({'status': 'success'})
    finally: conn.close()

@app.route('/api/auth/forgot-password', methods=['POST'])
def forgot_password():
    data = request.json
    email = data.get('email')
    
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cur.fetchone()
        
        if not user:
            return jsonify({'error': 'Користувача з такою поштою не знайдено'}), 404
            
        verification_code = str(random.randint(100000, 999999))
        cur.execute("UPDATE users SET verification_code = %s WHERE id = %s", (verification_code, user['id']))
        conn.commit()
        
        # --- АСИНХРОННА ВІДПРАВКА ПОШТИ В ОКРЕМОМУ ПОТОЦІ ---
        try:
            msg = Message("Відновлення паролю TribeUp", recipients=[email])
            msg.body = f"Привіт, {user['name']}!\n\nТвій код для відновлення паролю: {verification_code}\n\nНікому не повідомляй цей код."
            mail.send(msg)
        except Exception as e:
            print(f"Mail Setup Error: {e}")
            return jsonify({'error': 'Не вдалося відправити лист (Помилка налаштування)'}), 500
        # -----------------------------------------------------------------
            
        return jsonify({'message': 'Code sent', 'email': email})

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/auth/reset-password', methods=['POST'])
def reset_password():
    data = request.json
    email = data.get('email')
    code = data.get('code')
    new_password = data.get('newPassword')
    
    conn = get_db()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        cur.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cur.fetchone()
        
        if not user:
            return jsonify({'error': 'Користувача не знайдено'}), 404
            
        if user['verification_code'] != code:
            return jsonify({'error': 'Невірний код підтвердження'}), 400
            
        hashed_password = generate_password_hash(new_password)
        cur.execute("UPDATE users SET password = %s, verification_code = NULL WHERE id = %s", (hashed_password, user['id']))
        conn.commit()
        
        return jsonify({'status': 'success', 'message': 'Пароль успішно змінено'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@socketio.on('disconnect')
def on_disconnect():
    # Шукаємо, хто відключився, за його socket_id (request.sid)
    disconnected_user_id = None
    
    for uid, sids in online_users.items():
        if request.sid in sids:
            sids.remove(request.sid)
            if not sids: # Якщо закрив останню вкладку
                disconnected_user_id = uid
            break
    
    if disconnected_user_id:
        # Видаляємо зі списку онлайн
        del online_users[disconnected_user_id]
        
        # Оновлюємо час останнього візиту в БД
        conn = get_db()
        try:
            cur = conn.cursor()
            cur.execute("UPDATE users SET last_seen = NOW() WHERE id = %s", (disconnected_user_id,))
            conn.commit()
        except Exception as e:
            print(f"Error updating last_seen: {e}")
        finally:
            conn.close()

@app.route('/api/users/<int:user_id>/status', methods=['GET'])
def get_user_status(user_id):
    # 1. Перевіряємо, чи є він у списку онлайн (в оперативній пам'яті)
    is_online = user_id in online_users
    
    last_seen = None
    # 2. Якщо не онлайн, беремо час з БД
    if not is_online:
        conn = get_db()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT last_seen FROM users WHERE id = %s", (user_id,))
            row = cur.fetchone()
            if row and row['last_seen']:
                last_seen = row['last_seen'].isoformat()
        finally:
            conn.close()
            
    return jsonify({'isOnline': is_online, 'lastSeen': last_seen})

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    socketio.run(app, host='0.0.0.0', port=port)