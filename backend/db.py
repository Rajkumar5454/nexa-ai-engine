import os
from motor.motor_asyncio import AsyncIOMotorClient

def get_db():
    mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.environ.get('DB_NAME', 'nexa_ai')
    
    if mongo_url == 'mock':
        from mongomock_motor import AsyncMongoMockClient as MockClient
        client = MockClient()
    else:
        client = AsyncIOMotorClient(mongo_url)
    
    return client, client[db_name]

# Singleton instance to be used across the app
client, db = get_db()
